import { describe, expect, it } from "bun:test";
import { evaluateCondition } from "../src/evaluator";
import type { Condition, EvaluationContext } from "../src/schemas";

describe("valueRef - Field to Field Comparisons", () => {
   describe("number comparisons", () => {
      it("compares two number fields with gt", () => {
         const condition: Condition = {
            id: "1",
            type: "number",
            field: "transaction.amount",
            operator: "gt",
            valueRef: "budget.limit",
         };
         const context: EvaluationContext = {
            data: {
               transaction: { amount: 150 },
               budget: { limit: 100 },
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });

      it("fails when amount is less than limit", () => {
         const condition: Condition = {
            id: "2",
            type: "number",
            field: "transaction.amount",
            operator: "gt",
            valueRef: "budget.limit",
         };
         const context: EvaluationContext = {
            data: {
               transaction: { amount: 50 },
               budget: { limit: 100 },
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(false);
      });

      it("handles eq comparison between fields", () => {
         const condition: Condition = {
            id: "3",
            type: "number",
            field: "balance.current",
            operator: "eq",
            valueRef: "balance.expected",
         };
         const context: EvaluationContext = {
            data: {
               balance: { current: 500, expected: 500 },
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });

      it("handles missing valueRef field gracefully", () => {
         const condition: Condition = {
            id: "4",
            type: "number",
            field: "amount",
            operator: "gt",
            valueRef: "nonexistent.field",
         };
         const context: EvaluationContext = { data: { amount: 100 } };
         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(false);
      });

      it("handles lte comparison", () => {
         const condition: Condition = {
            id: "5",
            type: "number",
            field: "spending",
            operator: "lte",
            valueRef: "budget",
         };
         const context: EvaluationContext = {
            data: { spending: 80, budget: 100 },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });
   });

   describe("string comparisons", () => {
      it("compares two string fields with eq", () => {
         const condition: Condition = {
            id: "6",
            type: "string",
            field: "user.status",
            operator: "eq",
            valueRef: "config.expectedStatus",
         };
         const context: EvaluationContext = {
            data: {
               user: { status: "active" },
               config: { expectedStatus: "active" },
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });

      it("compares strings case insensitively by default", () => {
         const condition: Condition = {
            id: "7",
            type: "string",
            field: "category",
            operator: "eq",
            valueRef: "expectedCategory",
         };
         const context: EvaluationContext = {
            data: {
               category: "FOOD",
               expectedCategory: "food",
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });

      it("handles contains with valueRef", () => {
         const condition: Condition = {
            id: "8",
            type: "string",
            field: "description",
            operator: "contains",
            valueRef: "searchTerm",
         };
         const context: EvaluationContext = {
            data: {
               description: "Payment for groceries at supermarket",
               searchTerm: "groceries",
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });
   });

   describe("date comparisons", () => {
      it("compares two date fields with after", () => {
         const condition: Condition = {
            id: "9",
            type: "date",
            field: "payment.date",
            operator: "after",
            valueRef: "invoice.dueDate",
         };
         const context: EvaluationContext = {
            data: {
               payment: { date: "2025-06-15" },
               invoice: { dueDate: "2025-06-01" },
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });

      it("compares dates with before", () => {
         const condition: Condition = {
            id: "10",
            type: "date",
            field: "orderDate",
            operator: "before",
            valueRef: "deliveryDate",
         };
         const context: EvaluationContext = {
            data: {
               orderDate: "2025-01-01",
               deliveryDate: "2025-01-15",
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });

      it("compares dates for equality", () => {
         const condition: Condition = {
            id: "11",
            type: "date",
            field: "actual",
            operator: "eq",
            valueRef: "expected",
         };
         const context: EvaluationContext = {
            data: {
               actual: "2025-06-15T00:00:00.000Z",
               expected: "2025-06-15T00:00:00.000Z",
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });
   });

   describe("boolean comparisons", () => {
      it("compares two boolean fields", () => {
         const condition: Condition = {
            id: "12",
            type: "boolean",
            field: "user.isVerified",
            operator: "eq",
            valueRef: "requirements.needsVerification",
         };
         const context: EvaluationContext = {
            data: {
               user: { isVerified: true },
               requirements: { needsVerification: true },
            },
         };
         expect(evaluateCondition(condition, context).passed).toBe(true);
      });
   });

   describe("metadata in result", () => {
      it("indicates reference valueSource when using valueRef", () => {
         const condition: Condition = {
            id: "13",
            type: "number",
            field: "amount",
            operator: "gt",
            valueRef: "limit",
         };
         const context: EvaluationContext = {
            data: { amount: 100, limit: 50 },
         };
         const result = evaluateCondition(condition, context);
         expect(result.metadata?.valueSource).toBe("reference");
         expect(result.metadata?.resolvedRef).toBe("limit");
      });

      it("indicates static valueSource when using value", () => {
         const condition: Condition = {
            id: "14",
            type: "number",
            field: "amount",
            operator: "gt",
            value: 50,
         };
         const context: EvaluationContext = { data: { amount: 100 } };
         const result = evaluateCondition(condition, context);
         expect(result.metadata?.valueSource).toBe("static");
         expect(result.metadata?.resolvedRef).toBeUndefined();
      });
   });
});
