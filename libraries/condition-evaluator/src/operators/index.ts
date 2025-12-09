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
): boolean {
   switch (condition.type) {
      case "string":
         return evaluateString(
            condition.operator,
            actualValue,
            condition.value as string | string[] | undefined,
            condition.options,
         );

      case "number":
         return evaluateNumber(
            condition.operator,
            actualValue,
            condition.value as number | [number, number] | undefined,
         );

      case "boolean":
         return evaluateBoolean(
            condition.operator,
            actualValue,
            condition.value as boolean | undefined,
         );

      case "date":
         return evaluateDate(condition.operator, actualValue, condition.value);

      case "array":
         return evaluateArray(condition.operator, actualValue, condition.value);

      default: {
         const _exhaustive: never = condition;
         throw new Error(
            `Unknown condition type: ${(_exhaustive as Condition).type}`,
         );
      }
   }
}
