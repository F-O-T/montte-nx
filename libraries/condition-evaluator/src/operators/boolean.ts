import type { BooleanOperator } from "../schemas";

type BooleanEvaluatorFn = (
   actual: boolean,
   expected: boolean | undefined,
) => boolean;

export const booleanOperators: Record<BooleanOperator, BooleanEvaluatorFn> = {
   eq: (actual, expected) => actual === expected,

   neq: (actual, expected) => actual !== expected,

   is_true: (actual) => actual === true,

   is_false: (actual) => actual === false,
};

export function evaluateBoolean(
   operator: BooleanOperator,
   actual: unknown,
   expected: boolean | undefined,
): boolean {
   const actualBool = toBoolean(actual);
   const evaluator = booleanOperators[operator];
   return evaluator(actualBool, expected);
}

function toBoolean(value: unknown): boolean {
   if (typeof value === "boolean") return value;
   if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "1" || lower === "yes") return true;
      if (lower === "false" || lower === "0" || lower === "no") return false;
   }
   if (typeof value === "number") return value !== 0;
   return Boolean(value);
}
