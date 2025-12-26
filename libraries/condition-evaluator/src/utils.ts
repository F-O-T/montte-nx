import type { CustomCondition } from "./plugins/types";
import type { Condition, ConditionGroup, DiffAnalysis } from "./schemas";

/**
 * Gets a nested value from an object using dot notation path.
 * @param obj The object to traverse
 * @param path Dot-separated path (e.g., "user.profile.name")
 * @returns The value at the path or undefined if not found
 */
export function getNestedValue(
   obj: Record<string, unknown>,
   path: string,
): unknown {
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

/**
 * Formats a value for display in error messages and reasons.
 */
export function formatValue(value: unknown): string {
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

/**
 * Generates a human-readable reason for why a condition passed or failed.
 */
export function generateReason(
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

/**
 * Calculates the diff/distance between actual and expected values.
 * Useful for understanding "how far off" a failed condition was.
 */
export function calculateDiff(
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

/**
 * Gets the weight of a condition or condition group for weighted scoring.
 */
export function getWeight(
   item: Condition | ConditionGroup | CustomCondition,
): number {
   if ("weight" in item && typeof item.weight === "number") {
      return item.weight;
   }
   if ("options" in item && item.options && "weight" in item.options) {
      return (item.options as { weight?: number }).weight ?? 1;
   }
   return 1;
}
