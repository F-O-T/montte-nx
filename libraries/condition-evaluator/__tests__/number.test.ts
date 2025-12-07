import { describe, expect, it } from "bun:test";
import { evaluateNumber } from "../src/operators/number";

describe("Number Operators", () => {
   describe("eq", () => {
      it("returns true for equal numbers", () => {
         expect(evaluateNumber("eq", 5, 5)).toBe(true);
      });

      it("returns false for different numbers", () => {
         expect(evaluateNumber("eq", 5, 10)).toBe(false);
      });

      it("handles string numbers", () => {
         expect(evaluateNumber("eq", "5", 5)).toBe(true);
      });

      it("returns false for NaN", () => {
         expect(evaluateNumber("eq", "not a number", 5)).toBe(false);
      });
   });

   describe("neq", () => {
      it("returns true for different numbers", () => {
         expect(evaluateNumber("neq", 5, 10)).toBe(true);
      });

      it("returns false for equal numbers", () => {
         expect(evaluateNumber("neq", 5, 5)).toBe(false);
      });
   });

   describe("gt", () => {
      it("returns true when actual > expected", () => {
         expect(evaluateNumber("gt", 10, 5)).toBe(true);
      });

      it("returns false when actual <= expected", () => {
         expect(evaluateNumber("gt", 5, 5)).toBe(false);
         expect(evaluateNumber("gt", 3, 5)).toBe(false);
      });
   });

   describe("gte", () => {
      it("returns true when actual >= expected", () => {
         expect(evaluateNumber("gte", 10, 5)).toBe(true);
         expect(evaluateNumber("gte", 5, 5)).toBe(true);
      });

      it("returns false when actual < expected", () => {
         expect(evaluateNumber("gte", 3, 5)).toBe(false);
      });
   });

   describe("lt", () => {
      it("returns true when actual < expected", () => {
         expect(evaluateNumber("lt", 3, 5)).toBe(true);
      });

      it("returns false when actual >= expected", () => {
         expect(evaluateNumber("lt", 5, 5)).toBe(false);
         expect(evaluateNumber("lt", 10, 5)).toBe(false);
      });
   });

   describe("lte", () => {
      it("returns true when actual <= expected", () => {
         expect(evaluateNumber("lte", 3, 5)).toBe(true);
         expect(evaluateNumber("lte", 5, 5)).toBe(true);
      });

      it("returns false when actual > expected", () => {
         expect(evaluateNumber("lte", 10, 5)).toBe(false);
      });
   });

   describe("between", () => {
      it("returns true when value is within range", () => {
         expect(evaluateNumber("between", 5, [1, 10])).toBe(true);
      });

      it("returns true when value equals boundaries", () => {
         expect(evaluateNumber("between", 1, [1, 10])).toBe(true);
         expect(evaluateNumber("between", 10, [1, 10])).toBe(true);
      });

      it("returns false when value is outside range", () => {
         expect(evaluateNumber("between", 0, [1, 10])).toBe(false);
         expect(evaluateNumber("between", 11, [1, 10])).toBe(false);
      });

      it("returns false for invalid range", () => {
         expect(evaluateNumber("between", 5, [1] as any)).toBe(false);
         expect(evaluateNumber("between", 5, 5)).toBe(false);
      });
   });

   describe("not_between", () => {
      it("returns true when value is outside range", () => {
         expect(evaluateNumber("not_between", 0, [1, 10])).toBe(true);
         expect(evaluateNumber("not_between", 11, [1, 10])).toBe(true);
      });

      it("returns false when value is within range", () => {
         expect(evaluateNumber("not_between", 5, [1, 10])).toBe(false);
      });

      it("returns true for invalid range", () => {
         expect(evaluateNumber("not_between", 5, [1] as any)).toBe(true);
      });
   });

   describe("edge cases", () => {
      it("handles decimal numbers", () => {
         expect(evaluateNumber("eq", 5.5, 5.5)).toBe(true);
         expect(evaluateNumber("gt", 5.6, 5.5)).toBe(true);
      });

      it("handles negative numbers", () => {
         expect(evaluateNumber("lt", -10, -5)).toBe(true);
         expect(evaluateNumber("gt", -5, -10)).toBe(true);
      });

      it("handles zero", () => {
         expect(evaluateNumber("eq", 0, 0)).toBe(true);
         expect(evaluateNumber("gt", 1, 0)).toBe(true);
         expect(evaluateNumber("lt", -1, 0)).toBe(true);
      });
   });
});
