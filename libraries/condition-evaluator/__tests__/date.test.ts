import { describe, expect, it } from "bun:test";
import { evaluateDate } from "../src/operators/date";

describe("Date Operators", () => {
   // ==========================================================================
   // eq operator
   // ==========================================================================
   describe("eq", () => {
      it("returns true when dates are equal (Date objects)", () => {
         const date = new Date("2024-06-15T12:00:00Z");
         expect(
            evaluateDate("eq", date, new Date("2024-06-15T12:00:00Z")),
         ).toBe(true);
      });

      it("returns true when dates are equal (ISO strings)", () => {
         expect(
            evaluateDate("eq", "2024-06-15T12:00:00Z", "2024-06-15T12:00:00Z"),
         ).toBe(true);
      });

      it("returns true when dates are equal (timestamps)", () => {
         const timestamp = 1718452800000; // 2024-06-15T12:00:00Z
         expect(evaluateDate("eq", timestamp, timestamp)).toBe(true);
      });

      it("returns false when dates are different", () => {
         expect(
            evaluateDate("eq", "2024-06-15T12:00:00Z", "2024-06-16T12:00:00Z"),
         ).toBe(false);
      });

      it("returns false when expected is undefined", () => {
         expect(evaluateDate("eq", "2024-06-15T12:00:00Z", undefined)).toBe(
            false,
         );
      });
   });

   // ==========================================================================
   // neq operator
   // ==========================================================================
   describe("neq", () => {
      it("returns true when dates are different", () => {
         expect(
            evaluateDate("neq", "2024-06-15T12:00:00Z", "2024-06-16T12:00:00Z"),
         ).toBe(true);
      });

      it("returns false when dates are equal", () => {
         expect(
            evaluateDate("neq", "2024-06-15T12:00:00Z", "2024-06-15T12:00:00Z"),
         ).toBe(false);
      });

      it("returns true when expected is undefined", () => {
         expect(evaluateDate("neq", "2024-06-15T12:00:00Z", undefined)).toBe(
            true,
         );
      });
   });

   // ==========================================================================
   // before operator
   // ==========================================================================
   describe("before", () => {
      it("returns true when actual is before expected", () => {
         expect(
            evaluateDate(
               "before",
               "2024-06-15T12:00:00Z",
               "2024-06-16T12:00:00Z",
            ),
         ).toBe(true);
      });

      it("returns false when actual is after expected", () => {
         expect(
            evaluateDate(
               "before",
               "2024-06-17T12:00:00Z",
               "2024-06-16T12:00:00Z",
            ),
         ).toBe(false);
      });

      it("returns false when dates are equal", () => {
         expect(
            evaluateDate(
               "before",
               "2024-06-15T12:00:00Z",
               "2024-06-15T12:00:00Z",
            ),
         ).toBe(false);
      });

      it("returns false when expected is undefined", () => {
         expect(evaluateDate("before", "2024-06-15T12:00:00Z", undefined)).toBe(
            false,
         );
      });
   });

   // ==========================================================================
   // after operator
   // ==========================================================================
   describe("after", () => {
      it("returns true when actual is after expected", () => {
         expect(
            evaluateDate(
               "after",
               "2024-06-17T12:00:00Z",
               "2024-06-16T12:00:00Z",
            ),
         ).toBe(true);
      });

      it("returns false when actual is before expected", () => {
         expect(
            evaluateDate(
               "after",
               "2024-06-15T12:00:00Z",
               "2024-06-16T12:00:00Z",
            ),
         ).toBe(false);
      });

      it("returns false when dates are equal", () => {
         expect(
            evaluateDate(
               "after",
               "2024-06-15T12:00:00Z",
               "2024-06-15T12:00:00Z",
            ),
         ).toBe(false);
      });

      it("returns false when expected is undefined", () => {
         expect(evaluateDate("after", "2024-06-15T12:00:00Z", undefined)).toBe(
            false,
         );
      });
   });

   // ==========================================================================
   // between operator
   // ==========================================================================
   describe("between", () => {
      it("returns true when date is within range", () => {
         expect(
            evaluateDate("between", "2024-06-15T12:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(true);
      });

      it("returns true when date equals start of range", () => {
         expect(
            evaluateDate("between", "2024-06-10T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(true);
      });

      it("returns true when date equals end of range", () => {
         expect(
            evaluateDate("between", "2024-06-20T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(true);
      });

      it("returns false when date is before range", () => {
         expect(
            evaluateDate("between", "2024-06-05T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(false);
      });

      it("returns false when date is after range", () => {
         expect(
            evaluateDate("between", "2024-06-25T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(false);
      });

      it("returns false when range is invalid (not an array)", () => {
         expect(
            evaluateDate(
               "between",
               "2024-06-15T00:00:00Z",
               "2024-06-10T00:00:00Z",
            ),
         ).toBe(false);
      });

      it("returns false when range has wrong length", () => {
         expect(
            evaluateDate("between", "2024-06-15T00:00:00Z", [
               "2024-06-10T00:00:00Z",
            ] as unknown as [string, string]),
         ).toBe(false);
      });
   });

   // ==========================================================================
   // not_between operator
   // ==========================================================================
   describe("not_between", () => {
      it("returns true when date is before range", () => {
         expect(
            evaluateDate("not_between", "2024-06-05T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(true);
      });

      it("returns true when date is after range", () => {
         expect(
            evaluateDate("not_between", "2024-06-25T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(true);
      });

      it("returns false when date is within range", () => {
         expect(
            evaluateDate("not_between", "2024-06-15T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(false);
      });

      it("returns false when date equals start of range", () => {
         expect(
            evaluateDate("not_between", "2024-06-10T00:00:00Z", [
               "2024-06-10T00:00:00Z",
               "2024-06-20T00:00:00Z",
            ]),
         ).toBe(false);
      });

      it("returns true when range is invalid", () => {
         expect(
            evaluateDate(
               "not_between",
               "2024-06-15T00:00:00Z",
               "2024-06-10T00:00:00Z",
            ),
         ).toBe(true);
      });
   });

   // ==========================================================================
   // is_weekend operator
   // ==========================================================================
   describe("is_weekend", () => {
      it("returns true for Saturday", () => {
         // 2024-06-15 is a Saturday
         expect(
            evaluateDate("is_weekend", "2024-06-15T12:00:00Z", undefined),
         ).toBe(true);
      });

      it("returns true for Sunday", () => {
         // 2024-06-16 is a Sunday
         expect(
            evaluateDate("is_weekend", "2024-06-16T12:00:00Z", undefined),
         ).toBe(true);
      });

      it("returns false for Monday", () => {
         // 2024-06-17 is a Monday
         expect(
            evaluateDate("is_weekend", "2024-06-17T12:00:00Z", undefined),
         ).toBe(false);
      });

      it("returns false for Friday", () => {
         // 2024-06-14 is a Friday
         expect(
            evaluateDate("is_weekend", "2024-06-14T12:00:00Z", undefined),
         ).toBe(false);
      });
   });

   // ==========================================================================
   // is_weekday operator
   // ==========================================================================
   describe("is_weekday", () => {
      it("returns true for Monday", () => {
         // 2024-06-17 is a Monday
         expect(
            evaluateDate("is_weekday", "2024-06-17T12:00:00Z", undefined),
         ).toBe(true);
      });

      it("returns true for Friday", () => {
         // 2024-06-14 is a Friday
         expect(
            evaluateDate("is_weekday", "2024-06-14T12:00:00Z", undefined),
         ).toBe(true);
      });

      it("returns true for Wednesday", () => {
         // 2024-06-19 is a Wednesday
         expect(
            evaluateDate("is_weekday", "2024-06-19T12:00:00Z", undefined),
         ).toBe(true);
      });

      it("returns false for Saturday", () => {
         // 2024-06-15 is a Saturday
         expect(
            evaluateDate("is_weekday", "2024-06-15T12:00:00Z", undefined),
         ).toBe(false);
      });

      it("returns false for Sunday", () => {
         // 2024-06-16 is a Sunday
         expect(
            evaluateDate("is_weekday", "2024-06-16T12:00:00Z", undefined),
         ).toBe(false);
      });
   });

   // ==========================================================================
   // day_of_week operator
   // ==========================================================================
   describe("day_of_week", () => {
      it("returns true when day matches single value (Sunday = 0)", () => {
         // 2024-06-16 is a Sunday
         expect(evaluateDate("day_of_week", "2024-06-16T12:00:00Z", 0)).toBe(
            true,
         );
      });

      it("returns true when day matches single value (Saturday = 6)", () => {
         // 2024-06-15 is a Saturday
         expect(evaluateDate("day_of_week", "2024-06-15T12:00:00Z", 6)).toBe(
            true,
         );
      });

      it("returns false when day does not match single value", () => {
         // 2024-06-17 is a Monday (1)
         expect(evaluateDate("day_of_week", "2024-06-17T12:00:00Z", 5)).toBe(
            false,
         );
      });

      it("returns true when day is in array of values", () => {
         // 2024-06-17 is a Monday (1)
         expect(
            evaluateDate("day_of_week", "2024-06-17T12:00:00Z", [1, 3, 5]),
         ).toBe(true);
      });

      it("returns false when day is not in array of values", () => {
         // 2024-06-17 is a Monday (1)
         expect(
            evaluateDate("day_of_week", "2024-06-17T12:00:00Z", [2, 4, 6]),
         ).toBe(false);
      });

      it("handles weekend days array", () => {
         // 2024-06-15 is a Saturday (6)
         expect(
            evaluateDate("day_of_week", "2024-06-15T12:00:00Z", [0, 6]),
         ).toBe(true);
      });
   });

   // ==========================================================================
   // day_of_month operator
   // ==========================================================================
   describe("day_of_month", () => {
      it("returns true when day of month matches single value", () => {
         expect(evaluateDate("day_of_month", "2024-06-15T12:00:00Z", 15)).toBe(
            true,
         );
      });

      it("returns false when day of month does not match", () => {
         expect(evaluateDate("day_of_month", "2024-06-15T12:00:00Z", 20)).toBe(
            false,
         );
      });

      it("returns true when day of month is in array", () => {
         expect(
            evaluateDate("day_of_month", "2024-06-15T12:00:00Z", [1, 15, 30]),
         ).toBe(true);
      });

      it("returns false when day of month is not in array", () => {
         expect(
            evaluateDate("day_of_month", "2024-06-15T12:00:00Z", [1, 10, 20]),
         ).toBe(false);
      });

      it("handles first day of month", () => {
         expect(evaluateDate("day_of_month", "2024-06-01T12:00:00Z", 1)).toBe(
            true,
         );
      });

      it("handles last day of month", () => {
         // June has 30 days
         expect(evaluateDate("day_of_month", "2024-06-30T12:00:00Z", 30)).toBe(
            true,
         );
      });

      it("handles 31st in month with 31 days", () => {
         // July has 31 days
         expect(evaluateDate("day_of_month", "2024-07-31T12:00:00Z", 31)).toBe(
            true,
         );
      });
   });

   // ==========================================================================
   // Edge cases
   // ==========================================================================
   describe("edge cases", () => {
      it("returns false for invalid date string", () => {
         expect(
            evaluateDate("eq", "invalid-date", "2024-06-15T12:00:00Z"),
         ).toBe(false);
      });

      it("returns false for null input", () => {
         expect(evaluateDate("eq", null, "2024-06-15T12:00:00Z")).toBe(false);
      });

      it("returns false for undefined input", () => {
         expect(evaluateDate("eq", undefined, "2024-06-15T12:00:00Z")).toBe(
            false,
         );
      });

      it("handles leap year date", () => {
         // Feb 29, 2024 is a valid leap year date
         expect(
            evaluateDate("eq", "2024-02-29T12:00:00Z", "2024-02-29T12:00:00Z"),
         ).toBe(true);
      });

      it("handles year boundary - New Year's Eve", () => {
         expect(
            evaluateDate(
               "before",
               "2023-12-31T23:59:59Z",
               "2024-01-01T00:00:00Z",
            ),
         ).toBe(true);
      });

      it("handles year boundary - New Year's Day", () => {
         expect(
            evaluateDate(
               "after",
               "2024-01-01T00:00:01Z",
               "2023-12-31T23:59:59Z",
            ),
         ).toBe(true);
      });

      it("handles very old date", () => {
         expect(
            evaluateDate(
               "before",
               "1900-01-01T00:00:00Z",
               "2024-01-01T00:00:00Z",
            ),
         ).toBe(true);
      });

      it("handles future date", () => {
         expect(
            evaluateDate(
               "after",
               "2050-01-01T00:00:00Z",
               "2024-01-01T00:00:00Z",
            ),
         ).toBe(true);
      });

      it("handles timestamp as number", () => {
         const timestamp = new Date("2024-06-15T12:00:00Z").getTime();
         expect(evaluateDate("eq", timestamp, "2024-06-15T12:00:00Z")).toBe(
            true,
         );
      });

      it("handles Date object with invalid time", () => {
         const invalidDate = new Date("invalid");
         expect(evaluateDate("eq", invalidDate, "2024-06-15T12:00:00Z")).toBe(
            false,
         );
      });

      it("handles empty string as date", () => {
         expect(evaluateDate("eq", "", "2024-06-15T12:00:00Z")).toBe(false);
      });
   });

   // ==========================================================================
   // Mixed format comparisons
   // ==========================================================================
   describe("mixed format comparisons", () => {
      it("compares Date object with ISO string", () => {
         const date = new Date("2024-06-15T12:00:00Z");
         expect(evaluateDate("eq", date, "2024-06-15T12:00:00Z")).toBe(true);
      });

      it("compares timestamp with Date object", () => {
         const timestamp = new Date("2024-06-15T12:00:00Z").getTime();
         const date = new Date("2024-06-15T12:00:00Z");
         expect(evaluateDate("eq", timestamp, date)).toBe(true);
      });

      it("compares ISO string with timestamp", () => {
         const timestamp = new Date("2024-06-15T12:00:00Z").getTime();
         expect(evaluateDate("eq", "2024-06-15T12:00:00Z", timestamp)).toBe(
            true,
         );
      });
   });
});
