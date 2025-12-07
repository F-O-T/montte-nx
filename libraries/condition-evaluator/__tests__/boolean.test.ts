import { describe, expect, it } from "bun:test";
import { evaluateBoolean } from "../src/operators/boolean";

describe("Boolean Operators", () => {
   describe("eq", () => {
      it("returns true for equal booleans", () => {
         expect(evaluateBoolean("eq", true, true)).toBe(true);
         expect(evaluateBoolean("eq", false, false)).toBe(true);
      });

      it("returns false for different booleans", () => {
         expect(evaluateBoolean("eq", true, false)).toBe(false);
         expect(evaluateBoolean("eq", false, true)).toBe(false);
      });
   });

   describe("neq", () => {
      it("returns true for different booleans", () => {
         expect(evaluateBoolean("neq", true, false)).toBe(true);
         expect(evaluateBoolean("neq", false, true)).toBe(true);
      });

      it("returns false for equal booleans", () => {
         expect(evaluateBoolean("neq", true, true)).toBe(false);
         expect(evaluateBoolean("neq", false, false)).toBe(false);
      });
   });

   describe("is_true", () => {
      it("returns true for true values", () => {
         expect(evaluateBoolean("is_true", true, undefined)).toBe(true);
      });

      it("returns false for false values", () => {
         expect(evaluateBoolean("is_true", false, undefined)).toBe(false);
      });
   });

   describe("is_false", () => {
      it("returns true for false values", () => {
         expect(evaluateBoolean("is_false", false, undefined)).toBe(true);
      });

      it("returns false for true values", () => {
         expect(evaluateBoolean("is_false", true, undefined)).toBe(false);
      });
   });

   describe("type coercion", () => {
      it("converts string 'true' to boolean true", () => {
         expect(evaluateBoolean("eq", "true", true)).toBe(true);
         expect(evaluateBoolean("eq", "TRUE", true)).toBe(true);
         expect(evaluateBoolean("eq", "True", true)).toBe(true);
      });

      it("converts string 'false' to boolean false", () => {
         expect(evaluateBoolean("eq", "false", false)).toBe(true);
         expect(evaluateBoolean("eq", "FALSE", false)).toBe(true);
      });

      it("converts string '1' to true", () => {
         expect(evaluateBoolean("eq", "1", true)).toBe(true);
      });

      it("converts string '0' to false", () => {
         expect(evaluateBoolean("eq", "0", false)).toBe(true);
      });

      it("converts string 'yes' to true", () => {
         expect(evaluateBoolean("eq", "yes", true)).toBe(true);
         expect(evaluateBoolean("eq", "YES", true)).toBe(true);
      });

      it("converts string 'no' to false", () => {
         expect(evaluateBoolean("eq", "no", false)).toBe(true);
         expect(evaluateBoolean("eq", "NO", false)).toBe(true);
      });

      it("converts number 0 to false", () => {
         expect(evaluateBoolean("eq", 0, false)).toBe(true);
      });

      it("converts non-zero numbers to true", () => {
         expect(evaluateBoolean("eq", 1, true)).toBe(true);
         expect(evaluateBoolean("eq", -1, true)).toBe(true);
         expect(evaluateBoolean("eq", 42, true)).toBe(true);
      });
   });
});
