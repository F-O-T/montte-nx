import type {
   Condition,
   ConditionGroup,
   ConditionOperator,
} from "@packages/database/schema";
import type {
   ConditionEvaluationContext,
   ConditionEvaluationResult,
   ConditionGroupEvaluationResult,
} from "../types/conditions";
import { isConditionGroup } from "../types/conditions";

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

function normalizeString(value: unknown, caseSensitive?: boolean): string {
   const str = String(value ?? "");
   return caseSensitive ? str : str.toLowerCase();
}

function evaluateStringOperator(
   operator: ConditionOperator,
   actualValue: unknown,
   expectedValue: unknown,
   options?: { caseSensitive?: boolean },
): boolean {
   const actual = normalizeString(actualValue, options?.caseSensitive);
   const expected = normalizeString(expectedValue, options?.caseSensitive);

   switch (operator) {
      case "equals":
         return actual === expected;
      case "not_equals":
         return actual !== expected;
      case "contains":
         return actual.includes(expected);
      case "not_contains":
         return !actual.includes(expected);
      case "starts_with":
         return actual.startsWith(expected);
      case "ends_with":
         return actual.endsWith(expected);
      case "regex": {
         try {
            const flags = options?.caseSensitive ? "" : "i";
            const regex = new RegExp(String(expectedValue), flags);
            return regex.test(String(actualValue ?? ""));
         } catch {
            return false;
         }
      }
      case "is_empty":
         return (
            actual === "" || actualValue === null || actualValue === undefined
         );
      case "is_not_empty":
         return (
            actual !== "" && actualValue !== null && actualValue !== undefined
         );
      default:
         return false;
   }
}

function evaluateNumberOperator(
   operator: ConditionOperator,
   actualValue: unknown,
   expectedValue: unknown,
): boolean {
   const actual = Number(actualValue);
   if (Number.isNaN(actual)) return false;

   switch (operator) {
      case "eq":
         return actual === Number(expectedValue);
      case "neq":
         return actual !== Number(expectedValue);
      case "gt":
         return actual > Number(expectedValue);
      case "gte":
         return actual >= Number(expectedValue);
      case "lt":
         return actual < Number(expectedValue);
      case "lte":
         return actual <= Number(expectedValue);
      case "between": {
         if (!Array.isArray(expectedValue) || expectedValue.length !== 2) {
            return false;
         }
         const [minVal, maxVal] = expectedValue.map(Number);
         if (minVal === undefined || maxVal === undefined) return false;
         return actual >= minVal && actual <= maxVal;
      }
      default:
         return false;
   }
}

function evaluateDateOperator(
   operator: ConditionOperator,
   actualValue: unknown,
   expectedValue: unknown,
): boolean {
   const actualDate = new Date(String(actualValue));
   if (Number.isNaN(actualDate.getTime())) return false;

   switch (operator) {
      case "before": {
         const expected = new Date(String(expectedValue));
         return actualDate < expected;
      }
      case "after": {
         const expected = new Date(String(expectedValue));
         return actualDate > expected;
      }
      case "between": {
         if (!Array.isArray(expectedValue) || expectedValue.length !== 2) {
            return false;
         }
         const [startDate, endDate] = expectedValue.map(
            (v) => new Date(String(v)),
         );
         if (!startDate || !endDate) return false;
         return actualDate >= startDate && actualDate <= endDate;
      }
      case "is_weekend": {
         const day = actualDate.getDay();
         return day === 0 || day === 6;
      }
      case "is_business_day": {
         const day = actualDate.getDay();
         return day >= 1 && day <= 5;
      }
      case "day_of_month": {
         const dayOfMonth = actualDate.getDate();
         if (Array.isArray(expectedValue)) {
            return expectedValue.map(Number).includes(dayOfMonth);
         }
         return dayOfMonth === Number(expectedValue);
      }
      case "day_of_week": {
         const dayOfWeek = actualDate.getDay();
         if (Array.isArray(expectedValue)) {
            return expectedValue.map(Number).includes(dayOfWeek);
         }
         return dayOfWeek === Number(expectedValue);
      }
      default:
         return false;
   }
}

function evaluateArrayOperator(
   operator: ConditionOperator,
   actualValue: unknown,
   expectedValue: unknown,
): boolean {
   const actualArray = Array.isArray(actualValue) ? actualValue : [];

   switch (operator) {
      case "contains": {
         if (Array.isArray(expectedValue)) {
            return expectedValue.some((v) => actualArray.includes(v));
         }
         return actualArray.includes(expectedValue);
      }
      case "not_contains": {
         if (Array.isArray(expectedValue)) {
            return !expectedValue.some((v) => actualArray.includes(v));
         }
         return !actualArray.includes(expectedValue);
      }
      case "is_empty":
         return actualArray.length === 0;
      case "is_not_empty":
         return actualArray.length > 0;
      default:
         return false;
   }
}

function evaluateListOperator(
   operator: ConditionOperator,
   actualValue: unknown,
   expectedValue: unknown,
): boolean {
   if (!Array.isArray(expectedValue)) {
      return false;
   }

   const actual = String(actualValue);

   switch (operator) {
      case "in_list":
         return expectedValue.map(String).includes(actual);
      case "not_in_list":
         return !expectedValue.map(String).includes(actual);
      default:
         return false;
   }
}

function evaluateOperator(condition: Condition, actualValue: unknown): boolean {
   const { operator, value: expectedValue, options } = condition;

   if (operator === "is_empty") {
      return (
         actualValue === null ||
         actualValue === undefined ||
         actualValue === "" ||
         (Array.isArray(actualValue) && actualValue.length === 0)
      );
   }

   if (operator === "is_not_empty") {
      return (
         actualValue !== null &&
         actualValue !== undefined &&
         actualValue !== "" &&
         !(Array.isArray(actualValue) && actualValue.length === 0)
      );
   }

   if (operator === "in_list" || operator === "not_in_list") {
      return evaluateListOperator(operator, actualValue, expectedValue);
   }

   if (["eq", "neq", "gt", "gte", "lt", "lte"].includes(operator)) {
      return evaluateNumberOperator(operator, actualValue, expectedValue);
   }

   if (
      [
         "before",
         "after",
         "is_weekend",
         "is_business_day",
         "day_of_month",
         "day_of_week",
      ].includes(operator)
   ) {
      return evaluateDateOperator(operator, actualValue, expectedValue);
   }

   if (operator === "between") {
      if (
         typeof actualValue === "number" ||
         !Number.isNaN(Number(actualValue))
      ) {
         return evaluateNumberOperator(operator, actualValue, expectedValue);
      }
      return evaluateDateOperator(operator, actualValue, expectedValue);
   }

   if (Array.isArray(actualValue)) {
      return evaluateArrayOperator(operator, actualValue, expectedValue);
   }

   return evaluateStringOperator(operator, actualValue, expectedValue, options);
}

export function evaluateCondition(
   condition: Condition,
   context: ConditionEvaluationContext,
): ConditionEvaluationResult {
   try {
      const actualValue = getNestedValue(context.eventData, condition.field);
      let passed = evaluateOperator(condition, actualValue);

      if (condition.options?.negate) {
         passed = !passed;
      }

      return {
         actualValue,
         conditionId: condition.id,
         expectedValue: condition.value,
         field: condition.field,
         operator: condition.operator,
         passed,
      };
   } catch (error) {
      return {
         actualValue: undefined,
         conditionId: condition.id,
         error: error instanceof Error ? error.message : "Unknown error",
         expectedValue: condition.value,
         field: condition.field,
         operator: condition.operator,
         passed: false,
      };
   }
}

export function evaluateConditionGroup(
   group: ConditionGroup,
   context: ConditionEvaluationContext,
): ConditionGroupEvaluationResult {
   const results: (
      | ConditionEvaluationResult
      | ConditionGroupEvaluationResult
   )[] = [];
   let passed: boolean;

   if (group.operator === "AND") {
      passed = true;
      for (const item of group.conditions) {
         const result = isConditionGroup(item)
            ? evaluateConditionGroup(item, context)
            : evaluateCondition(item, context);
         results.push(result);
         if (!result.passed) {
            passed = false;
         }
      }
   } else {
      passed = false;
      for (const item of group.conditions) {
         const result = isConditionGroup(item)
            ? evaluateConditionGroup(item, context)
            : evaluateCondition(item, context);
         results.push(result);
         if (result.passed) {
            passed = true;
         }
      }

      if (group.conditions.length === 0) {
         passed = true;
      }
   }

   return {
      groupId: group.id,
      operator: group.operator,
      passed,
      results,
   };
}

export function evaluateConditions(
   conditions: ConditionGroup[],
   context: ConditionEvaluationContext,
): { passed: boolean; results: ConditionGroupEvaluationResult[] } {
   if (conditions.length === 0) {
      return { passed: true, results: [] };
   }

   const results: ConditionGroupEvaluationResult[] = [];
   let allPassed = true;

   for (const group of conditions) {
      const result = evaluateConditionGroup(group, context);
      results.push(result);
      if (!result.passed) {
         allPassed = false;
      }
   }

   return { passed: allPassed, results };
}
