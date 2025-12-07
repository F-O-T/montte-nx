import { describe, expect, it } from "bun:test";
import { evaluateString } from "../src/operators/string";

describe("String Operators", () => {
   describe("eq", () => {
      it("returns true for equal strings", () => {
         expect(evaluateString("eq", "hello", "hello")).toBe(true);
      });

      it("returns false for different strings", () => {
         expect(evaluateString("eq", "hello", "world")).toBe(false);
      });

      it("is case insensitive by default", () => {
         expect(evaluateString("eq", "Hello", "hello")).toBe(true);
      });

      it("respects caseSensitive option", () => {
         expect(
            evaluateString("eq", "Hello", "hello", { caseSensitive: true }),
         ).toBe(false);
      });

      it("handles null/undefined", () => {
         expect(evaluateString("eq", null, "")).toBe(true);
         expect(evaluateString("eq", undefined, "")).toBe(true);
      });
   });

   describe("neq", () => {
      it("returns true for different strings", () => {
         expect(evaluateString("neq", "hello", "world")).toBe(true);
      });

      it("returns false for equal strings", () => {
         expect(evaluateString("neq", "hello", "hello")).toBe(false);
      });
   });

   describe("contains", () => {
      it("returns true when substring exists", () => {
         expect(evaluateString("contains", "hello world", "world")).toBe(true);
      });

      it("returns false when substring does not exist", () => {
         expect(evaluateString("contains", "hello", "world")).toBe(false);
      });

      it("is case insensitive by default", () => {
         expect(evaluateString("contains", "Hello World", "world")).toBe(true);
      });
   });

   describe("not_contains", () => {
      it("returns true when substring does not exist", () => {
         expect(evaluateString("not_contains", "hello", "world")).toBe(true);
      });

      it("returns false when substring exists", () => {
         expect(evaluateString("not_contains", "hello world", "world")).toBe(
            false,
         );
      });
   });

   describe("starts_with", () => {
      it("returns true when string starts with prefix", () => {
         expect(evaluateString("starts_with", "hello world", "hello")).toBe(
            true,
         );
      });

      it("returns false when string does not start with prefix", () => {
         expect(evaluateString("starts_with", "hello world", "world")).toBe(
            false,
         );
      });
   });

   describe("ends_with", () => {
      it("returns true when string ends with suffix", () => {
         expect(evaluateString("ends_with", "hello world", "world")).toBe(true);
      });

      it("returns false when string does not end with suffix", () => {
         expect(evaluateString("ends_with", "hello world", "hello")).toBe(
            false,
         );
      });
   });

   describe("matches", () => {
      it("returns true when regex matches", () => {
         expect(evaluateString("matches", "hello123", "\\d+")).toBe(true);
      });

      it("returns false when regex does not match", () => {
         expect(evaluateString("matches", "hello", "\\d+")).toBe(false);
      });

      it("is case insensitive by default", () => {
         expect(evaluateString("matches", "Hello", "hello")).toBe(true);
      });

      it("handles invalid regex gracefully", () => {
         expect(evaluateString("matches", "hello", "[invalid")).toBe(false);
      });
   });

   describe("is_empty", () => {
      it("returns true for empty string", () => {
         expect(evaluateString("is_empty", "", undefined)).toBe(true);
      });

      it("returns true for null", () => {
         expect(evaluateString("is_empty", null, undefined)).toBe(true);
      });

      it("returns true for undefined", () => {
         expect(evaluateString("is_empty", undefined, undefined)).toBe(true);
      });

      it("returns false for non-empty string", () => {
         expect(evaluateString("is_empty", "hello", undefined)).toBe(false);
      });
   });

   describe("is_not_empty", () => {
      it("returns false for empty string", () => {
         expect(evaluateString("is_not_empty", "", undefined)).toBe(false);
      });

      it("returns true for non-empty string", () => {
         expect(evaluateString("is_not_empty", "hello", undefined)).toBe(true);
      });
   });

   describe("in", () => {
      it("returns true when value is in array", () => {
         expect(evaluateString("in", "b", ["a", "b", "c"])).toBe(true);
      });

      it("returns false when value is not in array", () => {
         expect(evaluateString("in", "d", ["a", "b", "c"])).toBe(false);
      });

      it("is case insensitive by default", () => {
         expect(evaluateString("in", "B", ["a", "b", "c"])).toBe(true);
      });

      it("returns false for non-array expected", () => {
         expect(evaluateString("in", "a", "a")).toBe(false);
      });
   });

   describe("not_in", () => {
      it("returns true when value is not in array", () => {
         expect(evaluateString("not_in", "d", ["a", "b", "c"])).toBe(true);
      });

      it("returns false when value is in array", () => {
         expect(evaluateString("not_in", "b", ["a", "b", "c"])).toBe(false);
      });

      it("returns true for non-array expected", () => {
         expect(evaluateString("not_in", "a", "a")).toBe(true);
      });
   });

   describe("trim option", () => {
      it("trims whitespace when enabled", () => {
         expect(
            evaluateString("eq", "  hello  ", "hello", { trim: true }),
         ).toBe(true);
      });
   });
});
