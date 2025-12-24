import type { NumberOperator } from "../schemas";

type NumberEvaluatorFn = (
   actual: number,
   expected: number | [number, number] | undefined,
) => boolean;

export const numberOperators: Record<NumberOperator, NumberEvaluatorFn> = {
   eq: (actual, expected) => actual === expected,

   neq: (actual, expected) => actual !== expected,

   gt: (actual, expected) => actual > (expected as number),

   gte: (actual, expected) => actual >= (expected as number),

   lt: (actual, expected) => actual < (expected as number),

   lte: (actual, expected) => actual <= (expected as number),

   between: (actual, expected) => {
      if (!Array.isArray(expected) || expected.length !== 2) return false;
      const [min, max] = expected;
      return actual >= min && actual <= max;
   },

   not_between: (actual, expected) => {
      if (!Array.isArray(expected) || expected.length !== 2) return true;
      const [min, max] = expected;
      return actual < min || actual > max;
   },
};

export function evaluateNumber(
   operator: NumberOperator,
   actual: unknown,
   expected: number | [number, number] | undefined,
): boolean {
   const actualNum = Number(actual);
   if (Number.isNaN(actualNum)) return false;

   const evaluator = numberOperators[operator];
   return evaluator(actualNum, expected);
}
