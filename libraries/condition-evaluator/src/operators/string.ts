import type { StringOperator } from "../schemas";

type StringEvaluatorFn = (
   actual: string,
   expected: string | string[] | undefined,
   options?: { caseSensitive?: boolean; trim?: boolean },
) => boolean;

function normalize(
   value: string,
   options?: { caseSensitive?: boolean; trim?: boolean },
): string {
   let result = value;
   if (options?.trim) {
      result = result.trim();
   }
   if (!options?.caseSensitive) {
      result = result.toLowerCase();
   }
   return result;
}

export const stringOperators: Record<StringOperator, StringEvaluatorFn> = {
   eq: (actual, expected, options) =>
      normalize(actual, options) === normalize(String(expected ?? ""), options),

   neq: (actual, expected, options) =>
      normalize(actual, options) !== normalize(String(expected ?? ""), options),

   contains: (actual, expected, options) =>
      normalize(actual, options).includes(
         normalize(String(expected ?? ""), options),
      ),

   not_contains: (actual, expected, options) =>
      !normalize(actual, options).includes(
         normalize(String(expected ?? ""), options),
      ),

   starts_with: (actual, expected, options) =>
      normalize(actual, options).startsWith(
         normalize(String(expected ?? ""), options),
      ),

   ends_with: (actual, expected, options) =>
      normalize(actual, options).endsWith(
         normalize(String(expected ?? ""), options),
      ),

   matches: (actual, expected, options) => {
      try {
         const flags = options?.caseSensitive ? "" : "i";
         const regex = new RegExp(String(expected ?? ""), flags);
         return regex.test(actual);
      } catch {
         return false;
      }
   },

   is_empty: (actual) =>
      actual === "" || actual === null || actual === undefined,

   is_not_empty: (actual) =>
      actual !== "" && actual !== null && actual !== undefined,

   in: (actual, expected, options) => {
      if (!Array.isArray(expected)) return false;
      const normalizedActual = normalize(actual, options);
      return expected.some(
         (item) => normalize(String(item), options) === normalizedActual,
      );
   },

   not_in: (actual, expected, options) => {
      if (!Array.isArray(expected)) return true;
      const normalizedActual = normalize(actual, options);
      return !expected.some(
         (item) => normalize(String(item), options) === normalizedActual,
      );
   },

   one_of: (actual, expected, options) => {
      return stringOperators.in(actual, expected, options);
   },

   not_one_of: (actual, expected, options) => {
      return stringOperators.not_in(actual, expected, options);
   },

   contains_any: (actual, expected, options) => {
      if (!Array.isArray(expected)) return false;
      const normalizedActual = normalize(actual, options);
      return expected.some((substring) =>
         normalizedActual.includes(normalize(String(substring), options)),
      );
   },

   contains_all: (actual, expected, options) => {
      if (!Array.isArray(expected)) return false;
      const normalizedActual = normalize(actual, options);
      return expected.every((substring) =>
         normalizedActual.includes(normalize(String(substring), options)),
      );
   },

   ilike: (actual, expected) => {
      const pattern = String(expected ?? "")
         .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
         .replace(/%/g, ".*")
         .replace(/_/g, ".");
      const regex = new RegExp(`^${pattern}$`, "i");
      return regex.test(actual);
   },

   not_ilike: (actual, expected, options) => {
      return !stringOperators.ilike(actual, expected, options);
   },
};

export function evaluateString(
   operator: StringOperator,
   actual: unknown,
   expected: string | string[] | undefined,
   options?: { caseSensitive?: boolean; trim?: boolean },
): boolean {
   const actualStr = actual == null ? "" : String(actual);
   const evaluator = stringOperators[operator];
   return evaluator(actualStr, expected, options);
}
