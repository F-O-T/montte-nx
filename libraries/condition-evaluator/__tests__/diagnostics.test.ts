import { describe, expect, it } from "bun:test";
import { evaluateCondition } from "../src/evaluator";
import type { Condition } from "../src/schemas";

describe("Enhanced EvaluationResult", () => {
   describe("reason field", () => {
      it("provides human-readable reason for passed condition", () => {
         const condition: Condition = {
            id: "1",
            type: "number",
            field: "age",
            operator: "gt",
            value: 18,
         };
         const result = evaluateCondition(condition, { data: { age: 25 } });
         expect(result.reason).toBeDefined();
         expect(result.reason).toContain("passed");
      });

      it("provides human-readable reason for failed condition", () => {
         const condition: Condition = {
            id: "2",
            type: "number",
            field: "age",
            operator: "gt",
            value: 30,
         };
         const result = evaluateCondition(condition, { data: { age: 25 } });
         expect(result.reason).toBeDefined();
         expect(result.reason).toContain("greater than");
      });

      it("includes field name in reason", () => {
         const condition: Condition = {
            id: "3",
            type: "string",
            field: "status",
            operator: "eq",
            value: "active",
         };
         const result = evaluateCondition(condition, {
            data: { status: "inactive" },
         });
         expect(result.reason).toContain("status");
      });

      it("provides reason for string operators", () => {
         const condition: Condition = {
            id: "4",
            type: "string",
            field: "name",
            operator: "contains",
            value: "test",
         };
         const result = evaluateCondition(condition, {
            data: { name: "hello" },
         });
         expect(result.reason).toContain("contain");
      });
   });

   describe("metadata field", () => {
      it("indicates static valueSource when using value", () => {
         const condition: Condition = {
            id: "5",
            type: "string",
            field: "name",
            operator: "eq",
            value: "John",
         };
         const result = evaluateCondition(condition, {
            data: { name: "John" },
         });
         expect(result.metadata?.valueSource).toBe("static");
      });

      it("indicates reference valueSource when using valueRef", () => {
         const condition: Condition = {
            id: "6",
            type: "number",
            field: "amount",
            operator: "gt",
            valueRef: "limit",
         };
         const result = evaluateCondition(condition, {
            data: { amount: 100, limit: 50 },
         });
         expect(result.metadata?.valueSource).toBe("reference");
         expect(result.metadata?.resolvedRef).toBe("limit");
      });

      it("does not include resolvedRef when using static value", () => {
         const condition: Condition = {
            id: "7",
            type: "number",
            field: "amount",
            operator: "gt",
            value: 50,
         };
         const result = evaluateCondition(condition, { data: { amount: 100 } });
         expect(result.metadata?.resolvedRef).toBeUndefined();
      });
   });

   describe("diff field - numeric", () => {
      it("calculates numeric diff for number comparisons", () => {
         const condition: Condition = {
            id: "8",
            type: "number",
            field: "score",
            operator: "gt",
            value: 100,
         };
         const result = evaluateCondition(condition, { data: { score: 95 } });
         expect(result.diff?.type).toBe("numeric");
         if (result.diff?.type === "numeric" && result.diff.applicable) {
            expect(result.diff.numericDistance).toBe(-5);
            expect(result.diff.proximity).toBeCloseTo(0.95);
         }
      });

      it("calculates positive distance when actual > expected", () => {
         const condition: Condition = {
            id: "9",
            type: "number",
            field: "score",
            operator: "gt",
            value: 100,
         };
         const result = evaluateCondition(condition, { data: { score: 150 } });
         if (result.diff?.type === "numeric" && result.diff.applicable) {
            expect(result.diff.numericDistance).toBe(50);
         }
      });

      it("handles zero expected value", () => {
         const condition: Condition = {
            id: "10",
            type: "number",
            field: "count",
            operator: "eq",
            value: 0,
         };
         const result = evaluateCondition(condition, { data: { count: 0 } });
         if (result.diff?.type === "numeric" && result.diff.applicable) {
            expect(result.diff.proximity).toBe(1);
         }
      });

      it("marks diff as not applicable for between operator", () => {
         const condition: Condition = {
            id: "11",
            type: "number",
            field: "value",
            operator: "between",
            value: [10, 20],
         };
         const result = evaluateCondition(condition, { data: { value: 15 } });
         if (result.diff?.type === "numeric") {
            expect(result.diff.applicable).toBe(false);
         }
      });
   });

   describe("diff field - date", () => {
      it("calculates date diff for date comparisons", () => {
         const condition: Condition = {
            id: "12",
            type: "date",
            field: "eventDate",
            operator: "after",
            value: "2025-01-01",
         };
         const result = evaluateCondition(condition, {
            data: { eventDate: "2025-01-03" },
         });
         expect(result.diff?.type).toBe("date");
         if (result.diff?.type === "date" && result.diff.applicable) {
            expect(result.diff.humanReadable).toContain("after");
            expect(result.diff.milliseconds).toBeGreaterThan(0);
         }
      });

      it("shows days in humanReadable when difference is in days", () => {
         const condition: Condition = {
            id: "13",
            type: "date",
            field: "date",
            operator: "before",
            value: "2025-01-10",
         };
         const result = evaluateCondition(condition, {
            data: { date: "2025-01-01" },
         });
         if (result.diff?.type === "date" && result.diff.applicable) {
            expect(result.diff.humanReadable).toContain("day");
            expect(result.diff.humanReadable).toContain("before");
         }
      });

      it("handles same date", () => {
         const condition: Condition = {
            id: "14",
            type: "date",
            field: "date",
            operator: "eq",
            value: "2025-01-01T00:00:00.000Z",
         };
         const result = evaluateCondition(condition, {
            data: { date: "2025-01-01T00:00:00.000Z" },
         });
         if (result.diff?.type === "date" && result.diff.applicable) {
            expect(result.diff.humanReadable).toBe("same time");
            expect(result.diff.milliseconds).toBe(0);
         }
      });

      it("marks diff as not applicable for is_weekend operator", () => {
         const condition: Condition = {
            id: "15",
            type: "date",
            field: "date",
            operator: "is_weekend",
         };
         const result = evaluateCondition(condition, {
            data: { date: "2025-01-04" },
         });
         if (result.diff?.type === "date") {
            expect(result.diff.applicable).toBe(false);
         }
      });
   });

   describe("diff field - other types", () => {
      it("returns undefined diff for string type", () => {
         const condition: Condition = {
            id: "16",
            type: "string",
            field: "name",
            operator: "contains",
            value: "test",
         };
         const result = evaluateCondition(condition, {
            data: { name: "testing" },
         });
         expect(result.diff).toBeUndefined();
      });

      it("returns undefined diff for boolean type", () => {
         const condition: Condition = {
            id: "17",
            type: "boolean",
            field: "active",
            operator: "is_true",
         };
         const result = evaluateCondition(condition, {
            data: { active: true },
         });
         expect(result.diff).toBeUndefined();
      });

      it("returns undefined diff for array type", () => {
         const condition: Condition = {
            id: "18",
            type: "array",
            field: "tags",
            operator: "contains",
            value: "test",
         };
         const result = evaluateCondition(condition, {
            data: { tags: ["test"] },
         });
         expect(result.diff).toBeUndefined();
      });
   });
});
