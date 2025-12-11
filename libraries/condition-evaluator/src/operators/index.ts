import type { Condition } from "../schemas";
import { evaluateArray } from "./array";
import { evaluateBoolean } from "./boolean";
import { evaluateDate } from "./date";
import { evaluateNumber } from "./number";
import { evaluateString } from "./string";

export { evaluateArray } from "./array";
export { evaluateBoolean } from "./boolean";
export { evaluateDate } from "./date";
export { evaluateNumber } from "./number";
export { evaluateString } from "./string";

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
