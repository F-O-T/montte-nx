import { describe, expect, it } from "bun:test";
import { evaluateArray } from "../src/operators/array";

describe("Array Operators", () => {
   // ==========================================================================
   // contains operator
   // ==========================================================================
   describe("contains", () => {
      it("returns true when array contains primitive value", () => {
         expect(evaluateArray("contains", [1, 2, 3], 2)).toBe(true);
      });

      it("returns true when array contains string value", () => {
         expect(evaluateArray("contains", ["a", "b", "c"], "b")).toBe(true);
      });

      it("returns false when array does not contain value", () => {
         expect(evaluateArray("contains", [1, 2, 3], 4)).toBe(false);
      });

      it("returns true when array contains object (deep equality)", () => {
         const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
         expect(evaluateArray("contains", arr, { id: 2 })).toBe(true);
      });

      it("returns true when array contains nested array (deep equality)", () => {
         const arr = [
            [1, 2],
            [3, 4],
            [5, 6],
         ];
         expect(evaluateArray("contains", arr, [3, 4])).toBe(true);
      });

      it("returns false for empty array", () => {
         expect(evaluateArray("contains", [], 1)).toBe(false);
      });

      it("handles non-array input by treating as empty array", () => {
         expect(evaluateArray("contains", "not-an-array", "a")).toBe(false);
      });
   });

   // ==========================================================================
   // not_contains operator
   // ==========================================================================
   describe("not_contains", () => {
      it("returns true when array does not contain value", () => {
         expect(evaluateArray("not_contains", [1, 2, 3], 4)).toBe(true);
      });

      it("returns false when array contains value", () => {
         expect(evaluateArray("not_contains", [1, 2, 3], 2)).toBe(false);
      });

      it("returns true for empty array", () => {
         expect(evaluateArray("not_contains", [], 1)).toBe(true);
      });

      it("returns false when array contains object (deep equality)", () => {
         const arr = [{ id: 1 }, { id: 2 }];
         expect(evaluateArray("not_contains", arr, { id: 1 })).toBe(false);
      });

      it("returns true when object is not in array", () => {
         const arr = [{ id: 1 }, { id: 2 }];
         expect(evaluateArray("not_contains", arr, { id: 3 })).toBe(true);
      });
   });

   // ==========================================================================
   // contains_all operator
   // ==========================================================================
   describe("contains_all", () => {
      it("returns true when array contains all expected values", () => {
         expect(evaluateArray("contains_all", [1, 2, 3, 4, 5], [2, 4])).toBe(
            true,
         );
      });

      it("returns false when array is missing some expected values", () => {
         expect(evaluateArray("contains_all", [1, 2, 3], [2, 4])).toBe(false);
      });

      it("returns true when expected array is empty", () => {
         expect(evaluateArray("contains_all", [1, 2, 3], [])).toBe(true);
      });

      it("returns false when actual array is empty but expected is not", () => {
         expect(evaluateArray("contains_all", [], [1, 2])).toBe(false);
      });

      it("returns false when expected is not an array", () => {
         expect(evaluateArray("contains_all", [1, 2, 3], 2)).toBe(false);
      });

      it("handles objects with deep equality", () => {
         const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
         expect(
            evaluateArray("contains_all", arr, [{ id: 1 }, { id: 3 }]),
         ).toBe(true);
      });
   });

   // ==========================================================================
   // contains_any operator
   // ==========================================================================
   describe("contains_any", () => {
      it("returns true when array contains at least one expected value", () => {
         expect(evaluateArray("contains_any", [1, 2, 3], [4, 2, 5])).toBe(true);
      });

      it("returns false when array contains none of expected values", () => {
         expect(evaluateArray("contains_any", [1, 2, 3], [4, 5, 6])).toBe(
            false,
         );
      });

      it("returns false when expected array is empty", () => {
         expect(evaluateArray("contains_any", [1, 2, 3], [])).toBe(false);
      });

      it("returns false when actual array is empty", () => {
         expect(evaluateArray("contains_any", [], [1, 2])).toBe(false);
      });

      it("returns false when expected is not an array", () => {
         expect(evaluateArray("contains_any", [1, 2, 3], 2)).toBe(false);
      });

      it("handles objects with deep equality", () => {
         const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
         expect(
            evaluateArray("contains_any", arr, [{ id: 5 }, { id: 2 }]),
         ).toBe(true);
      });
   });

   // ==========================================================================
   // is_empty operator
   // ==========================================================================
   describe("is_empty", () => {
      it("returns true for empty array", () => {
         expect(evaluateArray("is_empty", [], undefined)).toBe(true);
      });

      it("returns false for non-empty array", () => {
         expect(evaluateArray("is_empty", [1], undefined)).toBe(false);
      });

      it("returns false for array with multiple elements", () => {
         expect(evaluateArray("is_empty", [1, 2, 3], undefined)).toBe(false);
      });

      it("returns true for non-array input (treated as empty array)", () => {
         expect(evaluateArray("is_empty", null, undefined)).toBe(true);
      });
   });

   // ==========================================================================
   // is_not_empty operator
   // ==========================================================================
   describe("is_not_empty", () => {
      it("returns true for non-empty array", () => {
         expect(evaluateArray("is_not_empty", [1], undefined)).toBe(true);
      });

      it("returns true for array with multiple elements", () => {
         expect(evaluateArray("is_not_empty", [1, 2, 3], undefined)).toBe(true);
      });

      it("returns false for empty array", () => {
         expect(evaluateArray("is_not_empty", [], undefined)).toBe(false);
      });

      it("returns false for non-array input (treated as empty array)", () => {
         expect(evaluateArray("is_not_empty", undefined, undefined)).toBe(
            false,
         );
      });
   });

   // ==========================================================================
   // length_eq operator
   // ==========================================================================
   describe("length_eq", () => {
      it("returns true when length matches", () => {
         expect(evaluateArray("length_eq", [1, 2, 3], 3)).toBe(true);
      });

      it("returns false when length does not match", () => {
         expect(evaluateArray("length_eq", [1, 2, 3], 2)).toBe(false);
      });

      it("returns true for empty array with length 0", () => {
         expect(evaluateArray("length_eq", [], 0)).toBe(true);
      });

      it("handles string number input", () => {
         expect(
            evaluateArray("length_eq", [1, 2, 3], "3" as unknown as number),
         ).toBe(true);
      });

      it("returns true for non-array input with length 0", () => {
         expect(evaluateArray("length_eq", null, 0)).toBe(true);
      });
   });

   // ==========================================================================
   // length_gt operator
   // ==========================================================================
   describe("length_gt", () => {
      it("returns true when length is greater than expected", () => {
         expect(evaluateArray("length_gt", [1, 2, 3], 2)).toBe(true);
      });

      it("returns false when length equals expected", () => {
         expect(evaluateArray("length_gt", [1, 2, 3], 3)).toBe(false);
      });

      it("returns false when length is less than expected", () => {
         expect(evaluateArray("length_gt", [1, 2], 3)).toBe(false);
      });

      it("returns false for empty array with length > 0", () => {
         expect(evaluateArray("length_gt", [], 0)).toBe(false);
      });
   });

   // ==========================================================================
   // length_lt operator
   // ==========================================================================
   describe("length_lt", () => {
      it("returns true when length is less than expected", () => {
         expect(evaluateArray("length_lt", [1, 2], 3)).toBe(true);
      });

      it("returns false when length equals expected", () => {
         expect(evaluateArray("length_lt", [1, 2, 3], 3)).toBe(false);
      });

      it("returns false when length is greater than expected", () => {
         expect(evaluateArray("length_lt", [1, 2, 3, 4], 3)).toBe(false);
      });

      it("returns true for empty array with length < 1", () => {
         expect(evaluateArray("length_lt", [], 1)).toBe(true);
      });
   });

   // ==========================================================================
   // Deep equality tests
   // ==========================================================================
   describe("deep equality", () => {
      it("handles nested objects", () => {
         const arr = [{ user: { name: "John", age: 30 } }];
         expect(
            evaluateArray("contains", arr, { user: { name: "John", age: 30 } }),
         ).toBe(true);
      });

      it("handles nested arrays", () => {
         const arr = [
            [
               [1, 2],
               [3, 4],
            ],
         ];
         expect(
            evaluateArray("contains", arr, [
               [1, 2],
               [3, 4],
            ]),
         ).toBe(true);
      });

      it("detects differences in nested objects", () => {
         const arr = [{ user: { name: "John", age: 30 } }];
         expect(
            evaluateArray("contains", arr, { user: { name: "John", age: 31 } }),
         ).toBe(false);
      });

      it("detects differences in nested arrays", () => {
         const arr = [
            [
               [1, 2],
               [3, 4],
            ],
         ];
         expect(
            evaluateArray("contains", arr, [
               [1, 2],
               [3, 5],
            ]),
         ).toBe(false);
      });

      it("handles arrays with different lengths", () => {
         const arr = [[1, 2, 3]];
         expect(evaluateArray("contains", arr, [1, 2])).toBe(false);
      });

      it("handles objects with different keys", () => {
         const arr = [{ a: 1, b: 2 }];
         expect(evaluateArray("contains", arr, { a: 1 })).toBe(false);
      });

      it("handles null in nested structures", () => {
         const arr = [{ value: null }];
         expect(evaluateArray("contains", arr, { value: null })).toBe(true);
      });

      it("handles mixed types in arrays", () => {
         const arr = [[1, "two", null, { three: 3 }]];
         expect(
            evaluateArray("contains", arr, [1, "two", null, { three: 3 }]),
         ).toBe(true);
      });
   });

   // ==========================================================================
   // Circular reference protection
   // ==========================================================================
   describe("circular reference protection", () => {
      it("handles circular reference in actual value without infinite loop", () => {
         const obj: { self?: unknown } = { self: undefined };
         obj.self = obj;
         const arr = [obj];

         // Should not throw and should return false (since the expected doesn't match)
         expect(evaluateArray("contains", arr, { self: {} })).toBe(false);
      });

      it("handles self-referencing array", () => {
         const arr: unknown[] = [1, 2];
         arr.push(arr);

         // Should not throw
         expect(evaluateArray("contains", arr, [1, 2])).toBe(false);
      });
   });

   // ==========================================================================
   // Edge cases
   // ==========================================================================
   describe("edge cases", () => {
      it("handles undefined in array", () => {
         expect(evaluateArray("contains", [undefined, 1, 2], undefined)).toBe(
            true,
         );
      });

      it("handles null in array", () => {
         expect(evaluateArray("contains", [null, 1, 2], null)).toBe(true);
      });

      it("handles boolean values", () => {
         expect(evaluateArray("contains", [true, false], true)).toBe(true);
      });

      it("handles number 0", () => {
         expect(evaluateArray("contains", [0, 1, 2], 0)).toBe(true);
      });

      it("handles empty string", () => {
         expect(evaluateArray("contains", ["", "a", "b"], "")).toBe(true);
      });

      it("handles NaN (note: NaN !== NaN)", () => {
         // NaN is never equal to NaN, so this should be false
         expect(evaluateArray("contains", [Number.NaN, 1, 2], Number.NaN)).toBe(
            false,
         );
      });

      it("handles very large arrays", () => {
         const largeArray = Array.from({ length: 10000 }, (_, i) => i);
         expect(evaluateArray("contains", largeArray, 9999)).toBe(true);
      });

      it("handles sparse arrays", () => {
         // biome-ignore lint/suspicious/noSparseArray: Testing sparse array behavior
         const sparse = [1, , , 4];
         expect(evaluateArray("length_eq", sparse, 4)).toBe(true);
      });

      it("handles object vs non-object", () => {
         const arr = [{ a: 1 }];
         expect(evaluateArray("contains", arr, 1)).toBe(false);
      });

      it("handles array vs non-array comparison", () => {
         const arr = [[1, 2, 3]];
         expect(evaluateArray("contains", arr, { 0: 1, 1: 2, 2: 3 })).toBe(
            false,
         );
      });
   });
});
