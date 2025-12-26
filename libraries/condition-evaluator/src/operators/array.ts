import type { ArrayOperator } from "../schemas";

type ArrayEvaluatorFn = (
   actual: unknown[],
   expected: unknown | unknown[] | number | undefined,
) => boolean;

export const arrayOperators: Record<ArrayOperator, ArrayEvaluatorFn> = {
   contains: (actual, expected) => {
      return actual.some((item) => deepEquals(item, expected));
   },

   not_contains: (actual, expected) => {
      return !actual.some((item) => deepEquals(item, expected));
   },

   contains_all: (actual, expected) => {
      if (!Array.isArray(expected)) return false;
      return expected.every((exp) =>
         actual.some((item) => deepEquals(item, exp)),
      );
   },

   contains_any: (actual, expected) => {
      if (!Array.isArray(expected)) return false;
      return expected.some((exp) =>
         actual.some((item) => deepEquals(item, exp)),
      );
   },

   is_empty: (actual) => actual.length === 0,

   is_not_empty: (actual) => actual.length > 0,

   length_eq: (actual, expected) => actual.length === Number(expected),

   length_gt: (actual, expected) => actual.length > Number(expected),

   length_lt: (actual, expected) => actual.length < Number(expected),
};

export function evaluateArray(
   operator: ArrayOperator,
   actual: unknown,
   expected: unknown | unknown[] | number | undefined,
): boolean {
   const actualArray = Array.isArray(actual) ? actual : [];
   const evaluator = arrayOperators[operator];
   return evaluator(actualArray, expected);
}

function deepEquals(
   a: unknown,
   b: unknown,
   seen: WeakSet<object> = new WeakSet(),
): boolean {
   if (a === b) return true;
   if (typeof a !== typeof b) return false;
   if (a === null || b === null) return a === b;

   if (typeof a === "object" && typeof b === "object") {
      // Circular reference protection
      if (seen.has(a as object)) return false;
      seen.add(a as object);

      if (Array.isArray(a) && Array.isArray(b)) {
         if (a.length !== b.length) return false;
         return a.every((item, index) => deepEquals(item, b[index], seen));
      }

      if (Array.isArray(a) || Array.isArray(b)) return false;

      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const aKeys = Object.keys(aObj);
      const bKeys = Object.keys(bObj);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) => deepEquals(aObj[key], bObj[key], seen));
   }
   return false;
}
