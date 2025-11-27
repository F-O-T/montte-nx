import { describe, expect, it } from "bun:test";
import {
   type CategorySplit,
   getRemainingAmount,
   isSplitSumValid,
   validateCategorySplits,
} from "../src/split";

describe("split utilities", () => {
   describe("validateCategorySplits", () => {
      const categoryIds = ["cat-1", "cat-2", "cat-3"];

      it("should return valid for null splits", () => {
         const result = validateCategorySplits(null, categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid for undefined splits", () => {
         const result = validateCategorySplits(undefined, categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid for empty splits array", () => {
         const result = validateCategorySplits([], categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid when splits sum matches total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid when splits sum is within tolerance (1 cent)", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4999 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });

      it("should return invalid when splits sum exceeds tolerance", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4998 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors.length).toBeGreaterThan(0);
      });

      it("should return invalid for splits with invalid category IDs", () => {
         const splits: CategorySplit[] = [
            { categoryId: "invalid-cat", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors).toContain("Split contains invalid category IDs");
      });

      it("should return invalid for negative split values", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: -5000 },
            { categoryId: "cat-2", splitType: "amount", value: 15000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors).toContain("Split values cannot be negative");
      });

      it("should return multiple errors when multiple validations fail", () => {
         const splits: CategorySplit[] = [
            { categoryId: "invalid-cat", splitType: "amount", value: -1000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors.length).toBeGreaterThan(1);
      });

      it("should handle single category split", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });

      it("should handle many category splits", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 3333 },
            { categoryId: "cat-2", splitType: "amount", value: 3333 },
            { categoryId: "cat-3", splitType: "amount", value: 3334 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });

      it("should handle zero value splits", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
            { categoryId: "cat-2", splitType: "amount", value: 0 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });
   });

   describe("isSplitSumValid", () => {
      it("should return true when sum equals total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(true);
      });

      it("should return true when sum is within 1 cent tolerance", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4999 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(true);
      });

      it("should return false when sum exceeds tolerance (below)", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4997 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(false);
      });

      it("should return false when sum exceeds tolerance (above)", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5003 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(false);
      });

      it("should handle empty splits array", () => {
         expect(isSplitSumValid([], 0)).toBe(true);
      });

      it("should handle single split", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(true);
      });
   });

   describe("getRemainingAmount", () => {
      it("should return 0 when splits sum equals total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(0);
      });

      it("should return positive when splits sum is less than total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 3000 },
            { categoryId: "cat-2", splitType: "amount", value: 4000 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(3000);
      });

      it("should return negative when splits sum exceeds total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 6000 },
            { categoryId: "cat-2", splitType: "amount", value: 6000 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(-2000);
      });

      it("should return total when splits array is empty", () => {
         expect(getRemainingAmount([], 10000)).toBe(10000);
      });

      it("should handle single split", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 7500 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(2500);
      });

      it("should handle zero total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 0 },
         ];
         expect(getRemainingAmount(splits, 0)).toBe(0);
      });
   });
});
