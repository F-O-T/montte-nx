import { evaluateArray } from "./operators/array";
import { evaluateBoolean } from "./operators/boolean";
import { evaluateDate } from "./operators/date";
import { evaluateNumber } from "./operators/number";
import { evaluateString } from "./operators/string";
import {
   Condition,
   ConditionGroup,
   type DiffAnalysis,
   EvaluationContext,
   type EvaluationMetadata,
   type EvaluationResult,
   type GroupEvaluationResult,
   isConditionGroup,
} from "./schemas";

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

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
   const parts = path.split(".");
   let current: unknown = obj;

   for (const part of parts) {
      if (current === null || current === undefined) {
         return undefined;
      }
      if (typeof current !== "object") {
         return undefined;
      }
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

   const reasons: Record<string, string> = {
      eq: `Expected ${field} to equal ${expected}, got ${actual}`,
      neq: `Expected ${field} to not equal ${expected}, but it does`,
      gt: `Expected ${field} (${actual}) to be greater than ${expected}`,
      gte: `Expected ${field} (${actual}) to be greater than or equal to ${expected}`,
      lt: `Expected ${field} (${actual}) to be less than ${expected}`,
      lte: `Expected ${field} (${actual}) to be less than or equal to ${expected}`,
      contains: `Expected ${field} to contain ${expected}, got ${actual}`,
      not_contains: `Expected ${field} to not contain ${expected}`,
      starts_with: `Expected ${field} to start with ${expected}, got ${actual}`,
      ends_with: `Expected ${field} to end with ${expected}, got ${actual}`,
      matches: `Expected ${field} to match pattern ${expected}, got ${actual}`,
      is_empty: `Expected ${field} to be empty, got ${actual}`,
      is_not_empty: `Expected ${field} to not be empty`,
      in: `Expected ${field} to be in ${expected}, got ${actual}`,
      not_in: `Expected ${field} to not be in ${expected}`,
      one_of: `Expected ${field} to be one of ${expected}, got ${actual}`,
      not_one_of: `Expected ${field} to not be one of ${expected}`,
      contains_any: `Expected ${field} to contain any of ${expected}`,
      contains_all: `Expected ${field} to contain all of ${expected}`,
      ilike: `Expected ${field} to match pattern ${expected} (case-insensitive)`,
      not_ilike: `Expected ${field} to not match pattern ${expected}`,
      before: `Expected ${field} (${actual}) to be before ${expected}`,
      after: `Expected ${field} (${actual}) to be after ${expected}`,
      between: `Expected ${field} (${actual}) to be between ${expected}`,
      not_between: `Expected ${field} (${actual}) to not be between ${expected}`,
      is_true: `Expected ${field} to be true, got ${actual}`,
      is_false: `Expected ${field} to be false, got ${actual}`,
      is_weekend: `Expected ${field} to be a weekend`,
      is_weekday: `Expected ${field} to be a weekday`,
      day_of_week: `Expected ${field} day of week to match ${expected}`,
      day_of_month: `Expected ${field} day of month to match ${expected}`,
      length_eq: `Expected ${field} length to equal ${expected}`,
      length_gt: `Expected ${field} length to be greater than ${expected}`,
      length_lt: `Expected ${field} length to be less than ${expected}`,
   };

   return (
      reasons[operator] ?? `Condition failed: ${field} ${operator} ${expected}`
   );
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

function getWeight(item: Condition | ConditionGroup): number {
   if ("weight" in item && typeof item.weight === "number") {
      return item.weight;
   }
   if ("options" in item && item.options && "weight" in item.options) {
      return (item.options as { weight?: number }).weight ?? 1;
   }
   return 1;
}

export function evaluateCondition(
   condition: Condition,
   context: EvaluationContext,
): EvaluationResult {
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

   const validCondition = parseResult.data;

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

export function evaluateConditionGroup(
   group: ConditionGroup,
   context: EvaluationContext,
): GroupEvaluationResult {
   const parseResult = ConditionGroup.safeParse(group);
   if (!parseResult.success) {
      return {
         groupId: group.id ?? "unknown",
         operator: group.operator ?? "AND",
         passed: false,
         results: [],
      };
   }

   const validGroup = parseResult.data;
   const results: (EvaluationResult | GroupEvaluationResult)[] = [];
   const scoringMode = validGroup.scoringMode ?? "binary";

   let totalScore = 0;
   let maxPossibleScore = 0;

   for (const item of validGroup.conditions) {
      const result = isConditionGroup(item)
         ? evaluateConditionGroup(item, context)
         : evaluateCondition(item, context);
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

export function evaluateConditions(
   conditions: ConditionGroup[],
   context: EvaluationContext,
): { passed: boolean; results: GroupEvaluationResult[] } {
   const contextResult = EvaluationContext.safeParse(context);
   if (!contextResult.success) {
      return {
         passed: false,
         results: [],
      };
   }

   if (conditions.length === 0) {
      return { passed: true, results: [] };
   }

   const results: GroupEvaluationResult[] = [];
   let allPassed = true;

   for (const group of conditions) {
      const result = evaluateConditionGroup(group, contextResult.data);
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
): EvaluationResult | GroupEvaluationResult {
   if (isConditionGroup(conditionOrGroup)) {
      return evaluateConditionGroup(conditionOrGroup, context);
   }
   return evaluateCondition(conditionOrGroup, context);
}
