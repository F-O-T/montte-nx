import { describe, expect, it } from "bun:test";
import { extractDependencies } from "../src/dependencies";
import type { Condition, ConditionGroup } from "../src/schemas";

describe("extractDependencies", () => {
   it("extracts field from simple condition", () => {
      const condition: Condition = {
         id: "1",
         type: "string",
         field: "name",
         operator: "eq",
         value: "John",
      };
      const result = extractDependencies(condition);
      expect(result.fields).toEqual(["name"]);
      expect(result.references).toEqual([]);
      expect(result.allPaths).toEqual(["name"]);
   });

   it("extracts valueRef as reference", () => {
      const condition: Condition = {
         id: "2",
         type: "number",
         field: "amount",
         operator: "gt",
         valueRef: "budget.limit",
      };
      const result = extractDependencies(condition);
      expect(result.fields).toEqual(["amount"]);
      expect(result.references).toEqual(["budget.limit"]);
      expect(result.allPaths).toContain("amount");
      expect(result.allPaths).toContain("budget.limit");
   });

   it("extracts fields from condition group", () => {
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
      const result = extractDependencies(group);
      expect(result.fields).toContain("name");
      expect(result.fields).toContain("age");
   });

   it("handles nested groups", () => {
      const group: ConditionGroup = {
         id: "g1",
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
               id: "g2",
               operator: "OR",
               conditions: [
                  {
                     id: "2",
                     type: "number",
                     field: "score",
                     operator: "gt",
                     valueRef: "threshold",
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
      const result = extractDependencies(group);
      expect(result.fields).toContain("status");
      expect(result.fields).toContain("score");
      expect(result.fields).toContain("role");
      expect(result.references).toEqual(["threshold"]);
   });

   it("detects nested paths", () => {
      const condition: Condition = {
         id: "1",
         type: "string",
         field: "user.profile.name",
         operator: "eq",
         value: "John",
      };
      const result = extractDependencies(condition);
      expect(result.nested).toBe(true);
      expect(result.maxDepth).toBe(3);
   });

   it("detects non-nested paths", () => {
      const condition: Condition = {
         id: "1",
         type: "string",
         field: "name",
         operator: "eq",
         value: "John",
      };
      const result = extractDependencies(condition);
      expect(result.nested).toBe(false);
      expect(result.maxDepth).toBe(1);
   });

   it("calculates maxDepth correctly with multiple paths", () => {
      const group: ConditionGroup = {
         id: "g1",
         operator: "AND",
         conditions: [
            { id: "1", type: "string", field: "a", operator: "eq", value: "x" },
            {
               id: "2",
               type: "string",
               field: "a.b.c.d",
               operator: "eq",
               value: "y",
            },
         ],
      };
      const result = extractDependencies(group);
      expect(result.maxDepth).toBe(4);
   });

   it("deduplicates allPaths", () => {
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
               type: "string",
               field: "name",
               operator: "contains",
               value: "Jo",
            },
         ],
      };
      const result = extractDependencies(group);
      expect(result.allPaths.filter((p) => p === "name").length).toBe(1);
   });

   it("combines fields and references in allPaths", () => {
      const condition: Condition = {
         id: "1",
         type: "number",
         field: "current.balance",
         operator: "gte",
         valueRef: "minimum.required",
      };
      const result = extractDependencies(condition);
      expect(result.allPaths).toContain("current.balance");
      expect(result.allPaths).toContain("minimum.required");
      expect(result.allPaths.length).toBe(2);
   });

   it("handles deeply nested groups", () => {
      const group: ConditionGroup = {
         id: "g1",
         operator: "AND",
         conditions: [
            {
               id: "g2",
               operator: "OR",
               conditions: [
                  {
                     id: "g3",
                     operator: "AND",
                     conditions: [
                        {
                           id: "1",
                           type: "number",
                           field: "deep.field",
                           operator: "eq",
                           value: 1,
                        },
                     ],
                  },
               ],
            },
         ],
      };
      const result = extractDependencies(group);
      expect(result.fields).toContain("deep.field");
   });

   it("handles empty group", () => {
      const group: ConditionGroup = {
         id: "g1",
         operator: "AND",
         conditions: [],
      };
      const result = extractDependencies(group);
      expect(result.fields).toEqual([]);
      expect(result.references).toEqual([]);
      expect(result.allPaths).toEqual([]);
      expect(result.nested).toBe(false);
      expect(result.maxDepth).toBe(0);
   });
});
