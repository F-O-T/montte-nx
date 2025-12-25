import {
   evaluateConditionValue as builtInEvaluateValue,
   isConditionGroup,
} from "../evaluator";
import type {
   Condition,
   ConditionGroup,
   EvaluationContext,
   EvaluationMetadata,
   EvaluationResult,
   GroupEvaluationResult,
} from "../schemas";
import {
   calculateDiff,
   generateReason,
   getNestedValue,
   getWeight,
} from "../utils";
import type {
   CustomCondition,
   EvaluatorConfig,
   InferOperatorNames,
   OperatorMap,
} from "./types";

export function createEvaluator<T extends OperatorMap = OperatorMap>(
   config: EvaluatorConfig<T> = {},
) {
   const customOperators = config.operators ?? ({} as T);

   type CustomOp = InferOperatorNames<T>;
   type ExtendedCondition = Condition | CustomCondition<CustomOp>;

   function evaluateCustomOperator(
      operatorName: string,
      currentValue: unknown,
      expectedValue: unknown,
      options?: Record<string, unknown>,
   ): { passed: boolean; reason?: string } {
      const customOp = customOperators[operatorName];
      if (!customOp) {
         throw new Error(`Unknown custom operator: "${operatorName}"`);
      }

      if (customOp.valueSchema && expectedValue !== undefined) {
         const validation = customOp.valueSchema.safeParse(expectedValue);
         if (!validation.success) {
            throw new Error(
               `Invalid value for operator "${operatorName}": ${validation.error.message}`,
            );
         }
      }

      const passed = customOp.evaluate(currentValue, expectedValue, options);
      const reason = customOp.reasonGenerator
         ? customOp.reasonGenerator(passed, currentValue, expectedValue, "")
         : undefined;

      return { passed, reason };
   }

   function evaluateCondition(
      condition: ExtendedCondition,
      context: EvaluationContext,
   ): EvaluationResult {
      const actualValue = getNestedValue(context.data, condition.field);

      let resolvedExpected: unknown = condition.value;
      let valueSource: EvaluationMetadata["valueSource"] = "static";
      let resolvedRef: string | undefined;

      if ("valueRef" in condition && condition.valueRef) {
         resolvedExpected = getNestedValue(context.data, condition.valueRef);
         valueSource = "reference";
         resolvedRef = condition.valueRef;
      }

      try {
         let passed: boolean;
         let customReason: string | undefined;

         if (condition.type === "custom") {
            const result = evaluateCustomOperator(
               condition.operator,
               actualValue,
               resolvedExpected,
               condition.options as Record<string, unknown>,
            );
            passed = result.passed;
            customReason = result.reason;
         } else {
            passed = builtInEvaluateValue(
               condition as Condition,
               actualValue,
               resolvedExpected,
            );
         }

         if (condition.options?.negate) {
            passed = !passed;
         }

         const reason =
            customReason ??
            generateReason(
               condition.operator,
               passed,
               actualValue,
               resolvedExpected,
               condition.field,
            );

         const metadata: EvaluationMetadata = {
            valueSource,
            ...(resolvedRef && { resolvedRef }),
         };

         const diff =
            condition.type === "custom"
               ? undefined
               : calculateDiff(
                    condition.type,
                    condition.operator,
                    actualValue,
                    resolvedExpected,
                 );

         return {
            conditionId: condition.id,
            passed,
            field: condition.field,
            operator: condition.operator,
            actualValue,
            expectedValue: resolvedExpected,
            reason,
            metadata,
            diff,
         };
      } catch (error) {
         return {
            conditionId: condition.id,
            passed: false,
            field: condition.field,
            operator: condition.operator,
            actualValue,
            expectedValue: resolvedExpected,
            error: error instanceof Error ? error.message : "Unknown error",
         };
      }
   }

   function evaluateConditionGroup(
      group: ConditionGroup,
      context: EvaluationContext,
   ): GroupEvaluationResult {
      const results: (EvaluationResult | GroupEvaluationResult)[] = [];
      const scoringMode = group.scoringMode ?? "binary";

      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const item of group.conditions) {
         const result = isConditionGroup(item)
            ? evaluateConditionGroup(item, context)
            : evaluateCondition(item as ExtendedCondition, context);
         results.push(result);

         const weight = getWeight(item);
         maxPossibleScore += weight;
         if (result.passed) {
            totalScore += weight;
         }
      }

      let passed: boolean;

      if (scoringMode === "weighted") {
         passed =
            group.threshold !== undefined
               ? totalScore >= group.threshold
               : totalScore > 0;
      } else {
         if (group.operator === "AND") {
            passed = results.every((r) => r.passed);
         } else {
            passed =
               group.conditions.length === 0
                  ? true
                  : results.some((r) => r.passed);
         }
      }

      const scorePercentage =
         maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

      return {
         groupId: group.id,
         operator: group.operator,
         passed,
         results,
         ...(scoringMode === "weighted" && {
            scoringMode,
            totalScore,
            maxPossibleScore,
            threshold: group.threshold,
            scorePercentage,
         }),
      };
   }

   function evaluate(
      conditionOrGroup: ExtendedCondition | ConditionGroup,
      context: EvaluationContext,
   ): EvaluationResult | GroupEvaluationResult {
      if (isConditionGroup(conditionOrGroup)) {
         return evaluateConditionGroup(conditionOrGroup, context);
      }
      return evaluateCondition(conditionOrGroup, context);
   }

   return {
      evaluate,
      evaluateCondition,
      evaluateConditionGroup,
   } as const;
}
