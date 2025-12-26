import { z } from "zod";
import { evaluateArray } from "./operators/array";
import { evaluateBoolean } from "./operators/boolean";
import { evaluateDate } from "./operators/date";
import { evaluateNumber } from "./operators/number";
import { evaluateString } from "./operators/string";
import {
   Condition,
   ConditionGroup,
   EvaluationContext,
   type EvaluationMetadata,
   type EvaluationResult,
   type GroupEvaluationResult,
} from "./schemas";
import {
   calculateDiff,
   generateReason,
   getNestedValue,
   getWeight,
} from "./utils";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_DEPTH = 10;

// =============================================================================
// Schemas
// =============================================================================

export const EvaluationOptionsSchema = z.object({
   skipValidation: z.boolean().optional(),
   maxDepth: z.number().min(1).optional(),
});

export type EvaluationOptions = z.infer<typeof EvaluationOptionsSchema>;

export function isConditionGroup(
   item: Condition | ConditionGroup,
): item is ConditionGroup {
   return "conditions" in item && "operator" in item && !("field" in item);
}

export function evaluateConditionValue(
   condition: Condition,
   actualValue: unknown,
   resolvedExpected?: unknown,
): boolean {
   switch (condition.type) {
      case "string":
         return evaluateString(
            condition.operator,
            actualValue,
            (resolvedExpected ?? condition.value) as
               | string
               | string[]
               | undefined,
            condition.options,
         );

      case "number":
         return evaluateNumber(
            condition.operator,
            actualValue,
            (resolvedExpected ?? condition.value) as
               | number
               | [number, number]
               | undefined,
         );

      case "boolean":
         return evaluateBoolean(
            condition.operator,
            actualValue,
            (resolvedExpected ?? condition.value) as boolean | undefined,
         );

      case "date":
         return evaluateDate(
            condition.operator,
            actualValue,
            (resolvedExpected ?? condition.value) as
               | string
               | Date
               | number
               | [string | Date | number, string | Date | number]
               | number[]
               | undefined,
         );

      case "array":
         return evaluateArray(
            condition.operator,
            actualValue,
            (resolvedExpected ?? condition.value) as
               | unknown
               | unknown[]
               | number
               | undefined,
         );

      case "custom":
         throw new Error(
            `Custom conditions must be evaluated through createEvaluator()`,
         );

      default: {
         const _exhaustive: never = condition;
         throw new Error(
            `Unknown condition type: ${(_exhaustive as Condition).type}`,
         );
      }
   }
}

export function evaluateCondition(
   condition: Condition,
   context: EvaluationContext,
   options?: EvaluationOptions,
): EvaluationResult {
   let validCondition: Condition;

   if (options?.skipValidation) {
      validCondition = condition;
   } else {
      const parseResult = Condition.safeParse(condition);
      if (!parseResult.success) {
         return {
            conditionId: condition.id ?? "unknown",
            passed: false,
            field: condition.field ?? "unknown",
            operator: condition.operator ?? "unknown",
            actualValue: undefined,
            expectedValue: condition.value,
            error: `Invalid condition: ${parseResult.error.message}`,
         };
      }
      validCondition = parseResult.data;
   }

   if (validCondition.type === "custom") {
      return {
         conditionId: validCondition.id,
         passed: false,
         field: validCondition.field,
         operator: validCondition.operator,
         actualValue: undefined,
         expectedValue: validCondition.value,
         error: "Custom conditions must be evaluated through createEvaluator()",
      };
   }

   try {
      const actualValue = getNestedValue(context.data, validCondition.field);

      let resolvedExpected: unknown = validCondition.value;
      let valueSource: EvaluationMetadata["valueSource"] = "static";
      let resolvedRef: string | undefined;

      if ("valueRef" in validCondition && validCondition.valueRef) {
         resolvedExpected = getNestedValue(
            context.data,
            validCondition.valueRef,
         );
         valueSource = "reference";
         resolvedRef = validCondition.valueRef;
      }

      let passed = evaluateConditionValue(
         validCondition,
         actualValue,
         resolvedExpected,
      );

      if (validCondition.options?.negate) {
         passed = !passed;
      }

      const reason = generateReason(
         validCondition.operator,
         passed,
         actualValue,
         resolvedExpected,
         validCondition.field,
      );

      const metadata: EvaluationMetadata = {
         valueSource,
         ...(resolvedRef && { resolvedRef }),
      };

      const diff = calculateDiff(
         validCondition.type,
         validCondition.operator,
         actualValue,
         resolvedExpected,
      );

      return {
         conditionId: validCondition.id,
         passed,
         field: validCondition.field,
         operator: validCondition.operator,
         actualValue,
         expectedValue: resolvedExpected,
         reason,
         metadata,
         diff,
      };
   } catch (error) {
      return {
         conditionId: validCondition.id,
         passed: false,
         field: validCondition.field,
         operator: validCondition.operator,
         actualValue: undefined,
         expectedValue: validCondition.value,
         error: error instanceof Error ? error.message : "Unknown error",
      };
   }
}

function evaluateConditionGroupInternal(
   group: ConditionGroup,
   context: EvaluationContext,
   options: EvaluationOptions,
   depth: number,
): GroupEvaluationResult {
   const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

   if (depth > maxDepth) {
      throw new Error(
         `Maximum nesting depth of ${maxDepth} exceeded at depth ${depth}`,
      );
   }

   let validGroup: ConditionGroup;

   if (options.skipValidation) {
      validGroup = group;
   } else {
      const parseResult = ConditionGroup.safeParse(group);
      if (!parseResult.success) {
         return {
            groupId: group.id ?? "unknown",
            operator: group.operator ?? "AND",
            passed: false,
            results: [],
         };
      }
      validGroup = parseResult.data;
   }

   const results: (EvaluationResult | GroupEvaluationResult)[] = [];
   const scoringMode = validGroup.scoringMode ?? "binary";

   let totalScore = 0;
   let maxPossibleScore = 0;

   for (const item of validGroup.conditions) {
      const result = isConditionGroup(item)
         ? evaluateConditionGroupInternal(item, context, options, depth + 1)
         : evaluateCondition(item, context, options);
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
         validGroup.threshold !== undefined
            ? totalScore >= validGroup.threshold
            : totalScore > 0;
   } else {
      if (validGroup.operator === "AND") {
         passed = results.every((r) => r.passed);
      } else {
         passed =
            validGroup.conditions.length === 0
               ? true
               : results.some((r) => r.passed);
      }
   }

   const scorePercentage =
      maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

   return {
      groupId: validGroup.id,
      operator: validGroup.operator,
      passed,
      results,
      ...(scoringMode === "weighted" && {
         scoringMode,
         totalScore,
         maxPossibleScore,
         threshold: validGroup.threshold,
         scorePercentage,
      }),
   };
}

export function evaluateConditionGroup(
   group: ConditionGroup,
   context: EvaluationContext,
   options?: EvaluationOptions,
): GroupEvaluationResult {
   return evaluateConditionGroupInternal(group, context, options ?? {}, 0);
}

export function evaluateConditions(
   conditions: ConditionGroup[],
   context: EvaluationContext,
   options?: EvaluationOptions,
): { passed: boolean; results: GroupEvaluationResult[] } {
   const opts = options ?? {};

   if (!opts.skipValidation) {
      const contextResult = EvaluationContext.safeParse(context);
      if (!contextResult.success) {
         return {
            passed: false,
            results: [],
         };
      }
   }

   if (conditions.length === 0) {
      return { passed: true, results: [] };
   }

   const results: GroupEvaluationResult[] = [];
   let allPassed = true;

   for (const group of conditions) {
      const result = evaluateConditionGroup(group, context, opts);
      results.push(result);
      if (!result.passed) {
         allPassed = false;
      }
   }

   return { passed: allPassed, results };
}

export function evaluate(
   conditionOrGroup: Condition | ConditionGroup,
   context: EvaluationContext,
   options?: EvaluationOptions,
): EvaluationResult | GroupEvaluationResult {
   if (isConditionGroup(conditionOrGroup)) {
      return evaluateConditionGroup(conditionOrGroup, context, options);
   }
   return evaluateCondition(conditionOrGroup, context, options);
}
