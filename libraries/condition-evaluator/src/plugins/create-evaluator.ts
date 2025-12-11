import type {
   Condition,
   ConditionGroup,
   EvaluationContext,
   EvaluationResult,
   GroupEvaluationResult,
   EvaluationMetadata,
   DiffAnalysis,
} from "../schemas";
import { isConditionGroup } from "../schemas";
import { evaluateConditionValue as builtInEvaluateValue } from "../operators";
import type {
   CustomCondition,
   EvaluatorConfig,
   OperatorMap,
   InferOperatorNames,
} from "./types";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
   const parts = path.split(".");
   let current: unknown = obj;

   for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[part];
   }

   return current;
}

function formatValue(value: unknown): string {
   if (value === null) return "null";
   if (value === undefined) return "undefined";
   if (typeof value === "string") return `"${value}"`;
   if (Array.isArray(value)) {
      if (value.length > 3) {
         return `[${value.slice(0, 3).map(formatValue).join(", ")}, ...]`;
      }
      return `[${value.map(formatValue).join(", ")}]`;
   }
   if (value instanceof Date) return value.toISOString();
   return String(value);
}

function generateReason(
   operator: string,
   passed: boolean,
   actualValue: unknown,
   expectedValue: unknown,
   field: string,
): string {
   const actual = formatValue(actualValue);
   const expected = formatValue(expectedValue);

   if (passed) {
      return `${field} ${operator} ${expected}: passed`;
   }

   return `Condition failed: ${field} ${operator} ${expected}, got ${actual}`;
}

function calculateDiff(
   type: string,
   operator: string,
   actualValue: unknown,
   expectedValue: unknown,
): DiffAnalysis | undefined {
   if (type === "number") {
      const actual = Number(actualValue);
      const expected = Number(expectedValue);

      if (Number.isNaN(actual) || Number.isNaN(expected)) {
         return { type: "numeric", applicable: false };
      }

      const comparisonOps = ["eq", "neq", "gt", "gte", "lt", "lte"];
      if (!comparisonOps.includes(operator)) {
         return { type: "numeric", applicable: false };
      }

      const distance = actual - expected;
      const proximity =
         expected !== 0
            ? Math.min(Math.abs(actual / expected), 1)
            : actual === 0
              ? 1
              : 0;

      return {
         type: "numeric",
         applicable: true,
         numericDistance: distance,
         proximity,
      };
   }

   if (type === "date") {
      const parseDate = (v: unknown): Date | null => {
         if (v instanceof Date) return v;
         if (typeof v === "string" || typeof v === "number") {
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? null : d;
         }
         return null;
      };

      const actual = parseDate(actualValue);
      const expected = parseDate(expectedValue);

      if (!actual || !expected) {
         return { type: "date", applicable: false };
      }

      const comparisonOps = ["eq", "neq", "before", "after"];
      if (!comparisonOps.includes(operator)) {
         return { type: "date", applicable: false };
      }

      const ms = actual.getTime() - expected.getTime();
      const absDays = Math.floor(Math.abs(ms) / (1000 * 60 * 60 * 24));
      const absHours = Math.floor(Math.abs(ms) / (1000 * 60 * 60)) % 24;
      const direction = ms >= 0 ? "after" : "before";

      let humanReadable: string;
      if (absDays > 0) {
         humanReadable = `${absDays} day${absDays > 1 ? "s" : ""} ${direction}`;
      } else if (absHours > 0) {
         humanReadable = `${absHours} hour${absHours > 1 ? "s" : ""} ${direction}`;
      } else {
         humanReadable = "same time";
      }

      return {
         type: "date",
         applicable: true,
         milliseconds: ms,
         humanReadable,
      };
   }

   return undefined;
}

function getWeight(item: Condition | ConditionGroup | CustomCondition): number {
   if ("weight" in item && typeof item.weight === "number") {
      return item.weight;
   }
   if ("options" in item && item.options && "weight" in item.options) {
      return (item.options as { weight?: number }).weight ?? 1;
   }
   return 1;
}

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
