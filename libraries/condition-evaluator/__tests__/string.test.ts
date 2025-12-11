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

   describe("one_of", () => {
      it("returns true when value is in array", () => {
         expect(
            evaluateString("one_of", "apple", ["apple", "banana", "cherry"]),
         ).toBe(true);
      });

      it("returns false when value is not in array", () => {
         expect(
            evaluateString("one_of", "grape", ["apple", "banana", "cherry"]),
         ).toBe(false);
      });

      it("is case insensitive by default", () => {
         expect(evaluateString("one_of", "APPLE", ["apple", "banana"])).toBe(
            true,
         );
      });

      it("respects caseSensitive option", () => {
         expect(
            evaluateString("one_of", "APPLE", ["apple", "banana"], {
               caseSensitive: true,
            }),
         ).toBe(false);
      });
   });

   describe("not_one_of", () => {
      it("returns true when value is not in array", () => {
         expect(
            evaluateString("not_one_of", "grape", ["apple", "banana"]),
         ).toBe(true);
      });

      it("returns false when value is in array", () => {
         expect(
            evaluateString("not_one_of", "apple", ["apple", "banana"]),
         ).toBe(false);
      });
   });

   describe("contains_any", () => {
      it("returns true if string contains any substring", () => {
         expect(
            evaluateString("contains_any", "hello world", ["foo", "world"]),
         ).toBe(true);
      });

      it("returns false if string contains none of the substrings", () => {
         expect(
            evaluateString("contains_any", "hello world", ["foo", "bar"]),
         ).toBe(false);
      });

      it("is case insensitive by default", () => {
         expect(evaluateString("contains_any", "HELLO WORLD", ["world"])).toBe(
            true,
         );
      });

      it("returns false for non-array expected", () => {
         expect(evaluateString("contains_any", "hello", "hello")).toBe(false);
      });

      it("returns false for empty array", () => {
         expect(evaluateString("contains_any", "hello", [])).toBe(false);
      });
   });

   describe("contains_all", () => {
      it("returns true if string contains all substrings", () => {
         expect(
            evaluateString("contains_all", "hello world", ["hello", "world"]),
         ).toBe(true);
      });

      it("returns false if string is missing any substring", () => {
         expect(
            evaluateString("contains_all", "hello world", ["hello", "foo"]),
         ).toBe(false);
      });

      it("returns false for non-array expected", () => {
         expect(evaluateString("contains_all", "hello", "hello")).toBe(false);
      });

      it("returns true for empty array", () => {
         expect(evaluateString("contains_all", "hello", [])).toBe(true);
      });

      it("is case insensitive by default", () => {
         expect(
            evaluateString("contains_all", "HELLO WORLD", ["hello", "world"]),
         ).toBe(true);
      });
   });

   describe("ilike", () => {
      it("matches exact string (case insensitive)", () => {
         expect(evaluateString("ilike", "Hello", "hello")).toBe(true);
         expect(evaluateString("ilike", "HELLO", "hello")).toBe(true);
      });

      it("matches with % wildcard (any characters)", () => {
         expect(evaluateString("ilike", "hello world", "hello%")).toBe(true);
         expect(evaluateString("ilike", "hello world", "%world")).toBe(true);
         expect(
            evaluateString("ilike", "hello beautiful world", "%beautiful%"),
         ).toBe(true);
         expect(evaluateString("ilike", "hello", "hello%")).toBe(true);
      });

      it("matches with _ wildcard (single character)", () => {
         expect(evaluateString("ilike", "hello", "h_llo")).toBe(true);
         expect(evaluateString("ilike", "hello", "h___o")).toBe(true);
         expect(evaluateString("ilike", "hello", "h____")).toBe(true);
         expect(evaluateString("ilike", "hello", "h_____")).toBe(false);
         expect(evaluateString("ilike", "hello", "h__")).toBe(false);
      });

      it("combines % and _ wildcards", () => {
         expect(evaluateString("ilike", "hello world", "h_llo%")).toBe(true);
         expect(evaluateString("ilike", "test123", "%_23")).toBe(true);
      });

      it("escapes regex special characters", () => {
         expect(evaluateString("ilike", "hello.world", "hello.world")).toBe(
            true,
         );
         expect(evaluateString("ilike", "hello[world", "hello[world")).toBe(
            true,
         );
         expect(evaluateString("ilike", "hello(test)", "hello(test)")).toBe(
            true,
         );
      });

      it("returns false when pattern does not match", () => {
         expect(evaluateString("ilike", "hello", "world%")).toBe(false);
         expect(evaluateString("ilike", "hi", "hello")).toBe(false);
      });

      it("handles empty pattern", () => {
         expect(evaluateString("ilike", "", "")).toBe(true);
         expect(evaluateString("ilike", "hello", "")).toBe(false);
      });

      it("handles pattern with only wildcards", () => {
         expect(evaluateString("ilike", "anything", "%")).toBe(true);
         expect(evaluateString("ilike", "a", "_")).toBe(true);
         expect(evaluateString("ilike", "ab", "_")).toBe(false);
      });
   });

   describe("not_ilike", () => {
      it("returns true when pattern does not match", () => {
         expect(evaluateString("not_ilike", "hello", "world%")).toBe(true);
      });

      it("returns false when pattern matches", () => {
         expect(evaluateString("not_ilike", "hello world", "hello%")).toBe(
            false,
         );
      });

      it("is case insensitive", () => {
         expect(evaluateString("not_ilike", "HELLO", "hello")).toBe(false);
      });
   });
});
