import { describe, expect, it } from "bun:test";
import {
   evaluateCondition,
   evaluateConditionGroup,
   evaluateConditions,
} from "../src/evaluator";
import type {
   Condition,
   ConditionGroup,
   EvaluationContext,
} from "../src/schemas";

describe("Evaluator", () => {
   describe("evaluateCondition", () => {
      it("evaluates a string condition", () => {
         const condition: Condition = {
            id: "1",
            type: "string",
            field: "name",
            operator: "eq",
            value: "John",
         };
         const context: EvaluationContext = {
            data: { name: "John" },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
         expect(result.actualValue).toBe("John");
      });

      it("evaluates a number condition", () => {
         const condition: Condition = {
            id: "2",
            type: "number",
            field: "age",
            operator: "gt",
            value: 18,
         };
         const context: EvaluationContext = {
            data: { age: 25 },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
      });

      it("handles nested field paths", () => {
         const condition: Condition = {
            id: "3",
            type: "string",
            field: "user.profile.name",
            operator: "eq",
            value: "Jane",
         };
         const context: EvaluationContext = {
            data: {
               user: {
                  profile: {
                     name: "Jane",
                  },
               },
            },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
      });

      it("respects negate option", () => {
         const condition: Condition = {
            id: "4",
            type: "string",
            field: "status",
            operator: "eq",
            value: "active",
            options: { negate: true },
         };
         const context: EvaluationContext = {
            data: { status: "inactive" },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
      });

      it("returns error for invalid condition", () => {
         const invalidCondition = {
            id: "5",
            type: "invalid",
            field: "test",
            operator: "eq",
         } as unknown as Condition;
         const context: EvaluationContext = { data: {} };

         const result = evaluateCondition(invalidCondition, context);
         expect(result.passed).toBe(false);
         expect(result.error).toBeDefined();
      });
   });

   describe("evaluateConditionGroup", () => {
      it("evaluates AND group - all pass", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            conditions: [
               {
                  id: "1",
                  type: "string",
                  field: "name",
                  operator: "eq",
                  value: "John",
               },
               {
                  id: "2",
                  type: "number",
                  field: "age",
                  operator: "gt",
                  value: 18,
               },
            ],
         };
         const context: EvaluationContext = {
            data: { name: "John", age: 25 },
         };

         const result = evaluateConditionGroup(group, context);
         expect(result.passed).toBe(true);
         expect(result.results).toHaveLength(2);
      });

      it("evaluates AND group - one fails", () => {
         const group: ConditionGroup = {
            id: "g2",
            operator: "AND",
            conditions: [
               {
                  id: "1",
                  type: "string",
                  field: "name",
                  operator: "eq",
                  value: "John",
               },
               {
                  id: "2",
                  type: "number",
                  field: "age",
                  operator: "gt",
                  value: 30,
               },
            ],
         };
         const context: EvaluationContext = {
            data: { name: "John", age: 25 },
         };

         const result = evaluateConditionGroup(group, context);
         expect(result.passed).toBe(false);
      });

      it("evaluates OR group - one passes", () => {
         const group: ConditionGroup = {
            id: "g3",
            operator: "OR",
            conditions: [
               {
                  id: "1",
                  type: "string",
                  field: "name",
                  operator: "eq",
                  value: "Jane",
               },
               {
                  id: "2",
                  type: "number",
                  field: "age",
                  operator: "gt",
                  value: 18,
               },
            ],
         };
         const context: EvaluationContext = {
            data: { name: "John", age: 25 },
         };

         const result = evaluateConditionGroup(group, context);
         expect(result.passed).toBe(true);
      });

      it("evaluates OR group - all fail", () => {
         const group: ConditionGroup = {
            id: "g4",
            operator: "OR",
            conditions: [
               {
                  id: "1",
                  type: "string",
                  field: "name",
                  operator: "eq",
                  value: "Jane",
               },
               {
                  id: "2",
                  type: "number",
                  field: "age",
                  operator: "gt",
                  value: 30,
               },
            ],
         };
         const context: EvaluationContext = {
            data: { name: "John", age: 25 },
         };

         const result = evaluateConditionGroup(group, context);
         expect(result.passed).toBe(false);
      });

      it("handles empty OR group as passed", () => {
         const group: ConditionGroup = {
            id: "g5",
            operator: "OR",
            conditions: [],
         };
         const context: EvaluationContext = { data: {} };

         const result = evaluateConditionGroup(group, context);
         expect(result.passed).toBe(true);
      });

      it("handles nested groups", () => {
         const group: ConditionGroup = {
            id: "g6",
            operator: "AND",
            conditions: [
               {
                  id: "1",
                  type: "string",
                  field: "status",
                  operator: "eq",
                  value: "active",
               },
               {
                  id: "g7",
                  operator: "OR",
                  conditions: [
                     {
                        id: "2",
                        type: "number",
                        field: "score",
                        operator: "gt",
                        value: 90,
                     },
                     {
                        id: "3",
                        type: "string",
                        field: "role",
                        operator: "eq",
                        value: "admin",
                     },
                  ],
               },
            ],
         };
         const context: EvaluationContext = {
            data: { status: "active", score: 85, role: "admin" },
         };

         const result = evaluateConditionGroup(group, context);
         expect(result.passed).toBe(true);
      });
   });

   describe("evaluateConditions", () => {
      it("evaluates multiple groups", () => {
         const groups: ConditionGroup[] = [
            {
               id: "g1",
               operator: "AND",
               conditions: [
                  {
                     id: "1",
                     type: "string",
                     field: "name",
                     operator: "eq",
                     value: "John",
                  },
               ],
            },
            {
               id: "g2",
               operator: "AND",
               conditions: [
                  {
                     id: "2",
                     type: "number",
                     field: "age",
                     operator: "gt",
                     value: 18,
                  },
               ],
            },
         ];
         const context: EvaluationContext = {
            data: { name: "John", age: 25 },
         };

         const result = evaluateConditions(groups, context);
         expect(result.passed).toBe(true);
         expect(result.results).toHaveLength(2);
      });

      it("returns passed=true for empty conditions", () => {
         const result = evaluateConditions([], { data: {} });
         expect(result.passed).toBe(true);
         expect(result.results).toHaveLength(0);
      });

      it("fails if any group fails", () => {
         const groups: ConditionGroup[] = [
            {
               id: "g1",
               operator: "AND",
               conditions: [
                  {
                     id: "1",
                     type: "string",
                     field: "name",
                     operator: "eq",
                     value: "John",
                  },
               ],
            },
            {
               id: "g2",
               operator: "AND",
               conditions: [
                  {
                     id: "2",
                     type: "number",
                     field: "age",
                     operator: "gt",
                     value: 30,
                  },
               ],
            },
         ];
         const context: EvaluationContext = {
            data: { name: "John", age: 25 },
         };

         const result = evaluateConditions(groups, context);
         expect(result.passed).toBe(false);
      });
   });

   describe("all condition types", () => {
      it("evaluates boolean condition", () => {
         const condition: Condition = {
            id: "1",
            type: "boolean",
            field: "isActive",
            operator: "is_true",
         };
         const context: EvaluationContext = {
            data: { isActive: true },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
      });

      it("evaluates date condition", () => {
         const condition: Condition = {
            id: "1",
            type: "date",
            field: "createdAt",
            operator: "after",
            value: "2020-01-01",
         };
         const context: EvaluationContext = {
            data: { createdAt: "2023-06-15" },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
      });

      it("evaluates array condition", () => {
         const condition: Condition = {
            id: "1",
            type: "array",
            field: "tags",
            operator: "contains",
            value: "important",
         };
         const context: EvaluationContext = {
            data: { tags: ["urgent", "important", "review"] },
         };

         const result = evaluateCondition(condition, context);
         expect(result.passed).toBe(true);
      });
   });
});
