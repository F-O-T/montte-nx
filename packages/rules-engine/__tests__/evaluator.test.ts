import { describe, expect, it } from "bun:test";
import {
   evaluateCondition,
   evaluateConditionGroup,
   evaluateConditions,
} from "../src/engine/evaluator";
import type { Condition, ConditionGroup } from "../src/types/conditions";

function createCondition(overrides: Partial<Condition> = {}): Condition {
   return {
      field: "amount",
      id: crypto.randomUUID(),
      operator: "eq",
      value: 100,
      ...overrides,
   };
}

function createConditionGroup(
   overrides: Partial<ConditionGroup> = {},
): ConditionGroup {
   return {
      conditions: [],
      id: crypto.randomUUID(),
      operator: "AND",
      ...overrides,
   };
}

function createContext(eventData: Record<string, unknown> = {}) {
   return {
      eventData,
      organizationId: "org-123",
   };
}

describe("evaluator", () => {
   describe("evaluateCondition", () => {
      describe("string operators", () => {
         it("should evaluate equals operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "equals",
               value: "test",
            });
            const context = createContext({ description: "test" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
            expect(result.actualValue).toBe("test");
         });

         it("should evaluate equals operator with case insensitivity", () => {
            const condition = createCondition({
               field: "description",
               operator: "equals",
               value: "TEST",
            });
            const context = createContext({ description: "test" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate equals operator with case sensitivity", () => {
            const condition = createCondition({
               field: "description",
               operator: "equals",
               options: { caseSensitive: true },
               value: "TEST",
            });
            const context = createContext({ description: "test" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });

         it("should evaluate not_equals operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "not_equals",
               value: "other",
            });
            const context = createContext({ description: "test" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate contains operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "contains",
               value: "world",
            });
            const context = createContext({ description: "hello world" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate not_contains operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "not_contains",
               value: "foo",
            });
            const context = createContext({ description: "hello world" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate starts_with operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "starts_with",
               value: "hello",
            });
            const context = createContext({ description: "hello world" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate ends_with operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "ends_with",
               value: "world",
            });
            const context = createContext({ description: "hello world" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate regex operator with valid pattern", () => {
            const condition = createCondition({
               field: "description",
               operator: "regex",
               value: "^hello.*world$",
            });
            const context = createContext({
               description: "hello beautiful world",
            });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should return false for regex operator with invalid pattern", () => {
            const condition = createCondition({
               field: "description",
               operator: "regex",
               value: "[invalid(regex",
            });
            const context = createContext({ description: "test" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });

         it("should evaluate is_empty operator for empty string", () => {
            const condition = createCondition({
               field: "description",
               operator: "is_empty",
               value: null,
            });
            const context = createContext({ description: "" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_empty operator for null", () => {
            const condition = createCondition({
               field: "description",
               operator: "is_empty",
               value: null,
            });
            const context = createContext({ description: null });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_empty operator for undefined", () => {
            const condition = createCondition({
               field: "description",
               operator: "is_empty",
               value: null,
            });
            const context = createContext({});

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_not_empty operator", () => {
            const condition = createCondition({
               field: "description",
               operator: "is_not_empty",
               value: null,
            });
            const context = createContext({ description: "test" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });
      });

      describe("number operators", () => {
         it("should evaluate eq operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "eq",
               value: 100,
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate neq operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "neq",
               value: 100,
            });
            const context = createContext({ amount: 200 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate gt operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "gt",
               value: 100,
            });
            const context = createContext({ amount: 150 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate gt operator when equal (false)", () => {
            const condition = createCondition({
               field: "amount",
               operator: "gt",
               value: 100,
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });

         it("should evaluate gte operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "gte",
               value: 100,
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate lt operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "lt",
               value: 100,
            });
            const context = createContext({ amount: 50 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate lte operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "lte",
               value: 100,
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate between operator", () => {
            const condition = createCondition({
               field: "amount",
               operator: "between",
               value: [50, 150],
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate between operator at boundaries", () => {
            const condition = createCondition({
               field: "amount",
               operator: "between",
               value: [100, 200],
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should return false for between operator with invalid array", () => {
            const condition = createCondition({
               field: "amount",
               operator: "between",
               value: [100],
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });

         it("should return false for NaN actual value", () => {
            const condition = createCondition({
               field: "amount",
               operator: "eq",
               value: 100,
            });
            const context = createContext({ amount: "not a number" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });
      });

      describe("date operators", () => {
         it("should evaluate before operator", () => {
            const condition = createCondition({
               field: "date",
               operator: "before",
               value: "2024-06-01",
            });
            const context = createContext({ date: "2024-05-15" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate after operator", () => {
            const condition = createCondition({
               field: "date",
               operator: "after",
               value: "2024-05-01",
            });
            const context = createContext({ date: "2024-05-15" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_weekend operator for Saturday", () => {
            const condition = createCondition({
               field: "date",
               operator: "is_weekend",
               value: null,
            });
            const context = createContext({ date: "2024-06-15" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_weekend operator for Sunday", () => {
            const condition = createCondition({
               field: "date",
               operator: "is_weekend",
               value: null,
            });
            const context = createContext({ date: "2024-06-16" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_weekend operator for weekday (false)", () => {
            const condition = createCondition({
               field: "date",
               operator: "is_weekend",
               value: null,
            });
            const context = createContext({ date: "2024-06-17" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });

         it("should evaluate is_business_day operator", () => {
            const condition = createCondition({
               field: "date",
               operator: "is_business_day",
               value: null,
            });
            const context = createContext({ date: "2024-06-17" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate day_of_month operator with single value", () => {
            const condition = createCondition({
               field: "date",
               operator: "day_of_month",
               value: 15,
            });
            const context = createContext({ date: "2024-06-15" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate day_of_month operator with array", () => {
            const condition = createCondition({
               field: "date",
               operator: "day_of_month",
               value: [1, 15, 30],
            });
            const context = createContext({ date: "2024-06-15" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate day_of_week operator", () => {
            const condition = createCondition({
               field: "date",
               operator: "day_of_week",
               value: 1,
            });
            const context = createContext({ date: "2024-06-17" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should return false for invalid date", () => {
            const condition = createCondition({
               field: "date",
               operator: "before",
               value: "2024-06-01",
            });
            const context = createContext({ date: "invalid-date" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });
      });

      describe("array operators", () => {
         it("should evaluate contains operator for arrays", () => {
            const condition = createCondition({
               field: "tagIds",
               operator: "contains",
               value: "tag-1",
            });
            const context = createContext({ tagIds: ["tag-1", "tag-2"] });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate contains operator with array expected value", () => {
            const condition = createCondition({
               field: "tagIds",
               operator: "contains",
               value: ["tag-1", "tag-3"],
            });
            const context = createContext({ tagIds: ["tag-1", "tag-2"] });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate not_contains operator for arrays", () => {
            const condition = createCondition({
               field: "tagIds",
               operator: "not_contains",
               value: "tag-3",
            });
            const context = createContext({ tagIds: ["tag-1", "tag-2"] });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_empty operator for empty array", () => {
            const condition = createCondition({
               field: "tagIds",
               operator: "is_empty",
               value: null,
            });
            const context = createContext({ tagIds: [] });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate is_not_empty operator for non-empty array", () => {
            const condition = createCondition({
               field: "tagIds",
               operator: "is_not_empty",
               value: null,
            });
            const context = createContext({ tagIds: ["tag-1"] });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });
      });

      describe("list operators", () => {
         it("should evaluate in_list operator", () => {
            const condition = createCondition({
               field: "type",
               operator: "in_list",
               value: ["income", "expense", "transfer"],
            });
            const context = createContext({ type: "income" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should evaluate not_in_list operator", () => {
            const condition = createCondition({
               field: "type",
               operator: "not_in_list",
               value: ["income", "expense"],
            });
            const context = createContext({ type: "transfer" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });

         it("should return false for in_list with non-array expected value", () => {
            const condition = createCondition({
               field: "type",
               operator: "in_list",
               value: "income",
            });
            const context = createContext({ type: "income" });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });
      });

      describe("nested value access", () => {
         it("should access nested properties with dot notation", () => {
            const condition = createCondition({
               field: "payload.customer.email",
               operator: "equals",
               value: "test@example.com",
            });
            const context = createContext({
               payload: {
                  customer: {
                     email: "test@example.com",
                  },
               },
            });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
            expect(result.actualValue).toBe("test@example.com");
         });

         it("should return undefined for missing nested path", () => {
            const condition = createCondition({
               field: "payload.customer.email",
               operator: "is_empty",
               value: null,
            });
            const context = createContext({ payload: {} });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
            expect(result.actualValue).toBeUndefined();
         });

         it("should handle null in nested path", () => {
            const condition = createCondition({
               field: "payload.customer.email",
               operator: "is_empty",
               value: null,
            });
            const context = createContext({ payload: { customer: null } });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });
      });

      describe("negate option", () => {
         it("should negate the result when negate option is true", () => {
            const condition = createCondition({
               field: "amount",
               operator: "eq",
               options: { negate: true },
               value: 100,
            });
            const context = createContext({ amount: 100 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(false);
         });

         it("should negate false to true", () => {
            const condition = createCondition({
               field: "amount",
               operator: "eq",
               options: { negate: true },
               value: 100,
            });
            const context = createContext({ amount: 200 });

            const result = evaluateCondition(condition, context);

            expect(result.passed).toBe(true);
         });
      });
   });

   describe("evaluateConditionGroup", () => {
      it("should evaluate AND group - all pass", () => {
         const group = createConditionGroup({
            conditions: [
               createCondition({ field: "amount", operator: "gt", value: 50 }),
               createCondition({ field: "amount", operator: "lt", value: 150 }),
            ],
            operator: "AND",
         });
         const context = createContext({ amount: 100 });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });

      it("should evaluate AND group - one fails", () => {
         const group = createConditionGroup({
            conditions: [
               createCondition({ field: "amount", operator: "gt", value: 50 }),
               createCondition({ field: "amount", operator: "lt", value: 80 }),
            ],
            operator: "AND",
         });
         const context = createContext({ amount: 100 });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(false);
      });

      it("should evaluate OR group - one passes", () => {
         const group = createConditionGroup({
            conditions: [
               createCondition({ field: "amount", operator: "eq", value: 100 }),
               createCondition({ field: "amount", operator: "eq", value: 200 }),
            ],
            operator: "OR",
         });
         const context = createContext({ amount: 100 });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });

      it("should evaluate OR group - all fail", () => {
         const group = createConditionGroup({
            conditions: [
               createCondition({ field: "amount", operator: "eq", value: 200 }),
               createCondition({ field: "amount", operator: "eq", value: 300 }),
            ],
            operator: "OR",
         });
         const context = createContext({ amount: 100 });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(false);
      });

      it("should return true for empty AND group", () => {
         const group = createConditionGroup({
            conditions: [],
            operator: "AND",
         });
         const context = createContext({ amount: 100 });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });

      it("should return true for empty OR group", () => {
         const group = createConditionGroup({
            conditions: [],
            operator: "OR",
         });
         const context = createContext({ amount: 100 });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });

      it("should evaluate nested groups", () => {
         const innerGroup = createConditionGroup({
            conditions: [
               createCondition({
                  field: "type",
                  operator: "equals",
                  value: "income",
               }),
            ],
            operator: "AND",
         });
         const group = createConditionGroup({
            conditions: [
               createCondition({ field: "amount", operator: "gt", value: 50 }),
               innerGroup,
            ],
            operator: "AND",
         });
         const context = createContext({ amount: 100, type: "income" });

         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });
   });

   describe("evaluateConditions", () => {
      it("should return true for empty conditions array", () => {
         const context = createContext({ amount: 100 });

         const result = evaluateConditions([], context);

         expect(result.passed).toBe(true);
         expect(result.results).toHaveLength(0);
      });

      it("should return true when all groups pass", () => {
         const groups = [
            createConditionGroup({
               conditions: [
                  createCondition({
                     field: "amount",
                     operator: "gt",
                     value: 50,
                  }),
               ],
               operator: "AND",
            }),
            createConditionGroup({
               conditions: [
                  createCondition({
                     field: "type",
                     operator: "equals",
                     value: "income",
                  }),
               ],
               operator: "AND",
            }),
         ];
         const context = createContext({ amount: 100, type: "income" });

         const result = evaluateConditions(groups, context);

         expect(result.passed).toBe(true);
         expect(result.results).toHaveLength(2);
      });

      it("should return false when any group fails", () => {
         const groups = [
            createConditionGroup({
               conditions: [
                  createCondition({
                     field: "amount",
                     operator: "gt",
                     value: 50,
                  }),
               ],
               operator: "AND",
            }),
            createConditionGroup({
               conditions: [
                  createCondition({
                     field: "type",
                     operator: "equals",
                     value: "expense",
                  }),
               ],
               operator: "AND",
            }),
         ];
         const context = createContext({ amount: 100, type: "income" });

         const result = evaluateConditions(groups, context);

         expect(result.passed).toBe(false);
      });
   });
});
