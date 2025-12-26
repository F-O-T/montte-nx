import type { DateOperator } from "../schemas";

type DateValue = string | Date | number;
type DateRangeTuple = [DateValue, DateValue];

type DateEvaluatorFn = (
   actual: Date,
   expected: DateValue | DateRangeTuple | number[] | undefined,
) => boolean;

function toDate(value: DateValue): Date {
   if (value instanceof Date) return value;
   if (typeof value === "number") return new Date(value);
   return new Date(value);
}

export const dateOperators: Record<DateOperator, DateEvaluatorFn> = {
   eq: (actual, expected) => {
      if (expected === undefined) return false;
      const expectedDate = toDate(expected as DateValue);
      return actual.getTime() === expectedDate.getTime();
   },

   neq: (actual, expected) => {
      if (expected === undefined) return true;
      const expectedDate = toDate(expected as DateValue);
      return actual.getTime() !== expectedDate.getTime();
   },

   before: (actual, expected) => {
      if (expected === undefined) return false;
      const expectedDate = toDate(expected as DateValue);
      return actual < expectedDate;
   },

   after: (actual, expected) => {
      if (expected === undefined) return false;
      const expectedDate = toDate(expected as DateValue);
      return actual > expectedDate;
   },

   between: (actual, expected) => {
      if (!Array.isArray(expected) || expected.length !== 2) return false;
      const [start, end] = expected as DateRangeTuple;
      const startDate = toDate(start);
      const endDate = toDate(end);
      return actual >= startDate && actual <= endDate;
   },

   not_between: (actual, expected) => {
      if (!Array.isArray(expected) || expected.length !== 2) return true;
      const [start, end] = expected as DateRangeTuple;
      const startDate = toDate(start);
      const endDate = toDate(end);
      return actual < startDate || actual > endDate;
   },

   is_weekend: (actual) => {
      const day = actual.getDay();
      return day === 0 || day === 6;
   },

   is_weekday: (actual) => {
      const day = actual.getDay();
      return day >= 1 && day <= 5;
   },

   day_of_week: (actual, expected) => {
      const dayOfWeek = actual.getDay();
      if (Array.isArray(expected)) {
         return (expected as number[]).includes(dayOfWeek);
      }
      return dayOfWeek === Number(expected);
   },

   day_of_month: (actual, expected) => {
      const dayOfMonth = actual.getDate();
      if (Array.isArray(expected)) {
         return (expected as number[]).includes(dayOfMonth);
      }
      return dayOfMonth === Number(expected);
   },
};

export function evaluateDate(
   operator: DateOperator,
   actual: unknown,
   expected: DateValue | DateRangeTuple | number[] | undefined,
): boolean {
   const actualDate = parseDate(actual);
   if (actualDate === null) return false;

   const evaluator = dateOperators[operator];
   return evaluator(actualDate, expected);
}

function parseDate(value: unknown): Date | null {
   if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
   }
   if (typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
   }
   if (typeof value === "string") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
   }
   return null;
}
