import { evaluateConditionValue } from "./operators/index.ts";
import {
   Condition,
   ConditionGroup,
   EvaluationContext,
   type EvaluationResult,
   type GroupEvaluationResult,
   isConditionGroup,
} from "./schemas.ts";

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

   try {
      const actualValue = getNestedValue(context.data, validCondition.field);
      let passed = evaluateConditionValue(validCondition, actualValue);

      if (validCondition.options?.negate) {
         passed = !passed;
      }

      return {
         conditionId: validCondition.id,
         passed,
         field: validCondition.field,
         operator: validCondition.operator,
         actualValue,
         expectedValue: validCondition.value,
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
   let passed: boolean;

   if (validGroup.operator === "AND") {
      passed = true;
      for (const item of validGroup.conditions) {
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
      for (const item of validGroup.conditions) {
         const result = isConditionGroup(item)
            ? evaluateConditionGroup(item, context)
            : evaluateCondition(item, context);
         results.push(result);
         if (result.passed) {
            passed = true;
         }
      }

      if (validGroup.conditions.length === 0) {
         passed = true;
      }
   }

   return {
      groupId: validGroup.id,
      operator: validGroup.operator,
      passed,
      results,
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
