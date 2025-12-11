import { describe, expect, it } from "bun:test";
import {
   adaptConditionGroupsToEvaluator,
   adaptEventDataToContext,
   getContextValue,
} from "../src/engine/adapter";
import type { TransactionEventData } from "../src/types/events";

describe("engine adapter", () => {
   describe("adaptConditionGroupsToEvaluator", () => {
      it("should return empty condition group for empty array", () => {
         const result = adaptConditionGroupsToEvaluator([]);

         expect(result.operator).toBe("AND");
         expect(result.conditions).toEqual([]);
         expect(result.id).toBeTruthy();
      });

      it("should return single condition group as-is", () => {
         const singleGroup = {
            id: "cond-1",
            operator: "OR" as const,
            conditions: [
               {
                  id: "c1",
                  type: "number" as const,
                  field: "amount",
                  operator: "gt" as const,
                  value: 100,
               },
            ],
         };

         const result = adaptConditionGroupsToEvaluator([singleGroup]);

         expect(result.operator).toBe("OR");
         expect(result.id).toBe("cond-1");
      });

      it("should wrap multiple condition groups with AND", () => {
         const groups = [
            {
               id: "cond-1",
               operator: "AND" as const,
               conditions: [
                  {
                     id: "c1",
                     type: "number" as const,
                     field: "amount",
                     operator: "gt" as const,
                     value: 100,
                  },
               ],
            },
            {
               id: "cond-2",
               operator: "AND" as const,
               conditions: [
                  {
                     id: "c2",
                     type: "string" as const,
                     field: "type",
                     operator: "eq" as const,
                     value: "expense",
                  },
               ],
            },
         ];

         const result = adaptConditionGroupsToEvaluator(groups);

         expect(result.operator).toBe("AND");
         expect(result.conditions).toHaveLength(2);
      });

      it("should filter out undefined and null values", () => {
         const groups = [
            undefined,
            null,
            {
               id: "cond-1",
               operator: "AND" as const,
               conditions: [],
            },
         ] as unknown[];

         const result = adaptConditionGroupsToEvaluator(groups as never[]);

         expect(result.id).toBe("cond-1");
      });

      it("should filter out non-objects", () => {
         const groups = [
            "string",
            123,
            {
               id: "cond-1",
               operator: "AND" as const,
               conditions: [],
            },
         ] as unknown[];

         const result = adaptConditionGroupsToEvaluator(groups as never[]);

         expect(result.id).toBe("cond-1");
      });

      it("should filter objects without id property", () => {
         const groups = [
            { operator: "AND", conditions: [] },
            {
               id: "valid",
               operator: "AND" as const,
               conditions: [],
            },
         ] as unknown[];

         const result = adaptConditionGroupsToEvaluator(groups as never[]);

         expect(result.id).toBe("valid");
      });
   });

   describe("adaptEventDataToContext", () => {
      const fullEventData: TransactionEventData = {
         id: "tx-123",
         organizationId: "org-456",
         description: "Test transaction",
         amount: 100.5,
         type: "expense",
         date: "2024-01-15",
         bankAccountId: "bank-789",
         categoryIds: ["cat-1", "cat-2"],
         costCenterId: "cost-1",
         tagIds: ["tag-1"],
         counterpartyId: "cp-1",
         metadata: { custom: "value" },
      };

      it("should adapt all event data fields", () => {
         const context = adaptEventDataToContext(fullEventData);

         expect(context.id).toBe("tx-123");
         expect(context.organizationId).toBe("org-456");
         expect(context.description).toBe("Test transaction");
         expect(context.amount).toBe(100.5);
         expect(context.type).toBe("expense");
         expect(context.date).toBe("2024-01-15");
         expect(context.bankAccountId).toBe("bank-789");
         expect(context.categoryIds).toEqual(["cat-1", "cat-2"]);
         expect(context.costCenterId).toBe("cost-1");
         expect(context.tagIds).toEqual(["tag-1"]);
         expect(context.counterpartyId).toBe("cp-1");
         expect(context.metadata).toEqual({ custom: "value" });
      });

      it("should default categoryIds to empty array when undefined", () => {
         const eventData: TransactionEventData = {
            id: "tx-1",
            organizationId: "org-1",
            description: "Test",
            amount: 50,
            type: "income",
            date: "2024-01-01",
         };

         const context = adaptEventDataToContext(eventData);

         expect(context.categoryIds).toEqual([]);
      });

      it("should default tagIds to empty array when undefined", () => {
         const eventData: TransactionEventData = {
            id: "tx-1",
            organizationId: "org-1",
            description: "Test",
            amount: 50,
            type: "income",
            date: "2024-01-01",
         };

         const context = adaptEventDataToContext(eventData);

         expect(context.tagIds).toEqual([]);
      });

      it("should default metadata to empty object when undefined", () => {
         const eventData: TransactionEventData = {
            id: "tx-1",
            organizationId: "org-1",
            description: "Test",
            amount: 50,
            type: "income",
            date: "2024-01-01",
         };

         const context = adaptEventDataToContext(eventData);

         expect(context.metadata).toEqual({});
      });

      it("should handle all transaction types", () => {
         const types: Array<"income" | "expense" | "transfer"> = [
            "income",
            "expense",
            "transfer",
         ];

         for (const type of types) {
            const eventData: TransactionEventData = {
               id: "tx-1",
               organizationId: "org-1",
               description: "Test",
               amount: 50,
               type,
               date: "2024-01-01",
            };

            const context = adaptEventDataToContext(eventData);
            expect(context.type).toBe(type);
         }
      });
   });

   describe("getContextValue", () => {
      it("should get simple top-level value", () => {
         const context = { name: "test", amount: 100 };

         expect(getContextValue(context, "name")).toBe("test");
         expect(getContextValue(context, "amount")).toBe(100);
      });

      it("should get nested value", () => {
         const context = {
            user: {
               profile: {
                  name: "John",
               },
            },
         };

         expect(getContextValue(context, "user.profile.name")).toBe("John");
      });

      it("should return undefined for missing path", () => {
         const context = { name: "test" };

         expect(getContextValue(context, "missing")).toBeUndefined();
      });

      it("should return undefined for partial missing path", () => {
         const context = { user: { name: "test" } };

         expect(getContextValue(context, "user.email")).toBeUndefined();
         expect(getContextValue(context, "user.profile.name")).toBeUndefined();
      });

      it("should return undefined when traversing null", () => {
         const context = { user: null };

         expect(getContextValue(context, "user.name")).toBeUndefined();
      });

      it("should return undefined when traversing undefined", () => {
         const context = { user: undefined };

         expect(getContextValue(context, "user.name")).toBeUndefined();
      });

      it("should return undefined when traversing primitive", () => {
         const context = { value: 42 };

         expect(getContextValue(context, "value.something")).toBeUndefined();
      });

      it("should handle deeply nested paths", () => {
         const context = {
            a: { b: { c: { d: { e: "deep" } } } },
         };

         expect(getContextValue(context, "a.b.c.d.e")).toBe("deep");
      });

      it("should get array values", () => {
         const context = { items: [1, 2, 3] };

         expect(getContextValue(context, "items")).toEqual([1, 2, 3]);
      });

      it("should get object values", () => {
         const context = { data: { key: "value" } };

         expect(getContextValue(context, "data")).toEqual({ key: "value" });
      });
   });
});
