import type { Condition } from "../schemas.ts";
import { evaluateArray } from "./array.ts";
import { evaluateBoolean } from "./boolean.ts";
import { evaluateDate } from "./date.ts";
import { evaluateNumber } from "./number.ts";
import { evaluateString } from "./string.ts";

export { evaluateArray } from "./array.ts";
export { evaluateBoolean } from "./boolean.ts";
export { evaluateDate } from "./date.ts";
export { evaluateNumber } from "./number.ts";
export { evaluateString } from "./string.ts";

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
