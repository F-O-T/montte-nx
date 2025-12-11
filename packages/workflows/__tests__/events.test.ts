import { describe, expect, it } from "bun:test";
import {
   createTransactionCreatedEvent,
   createTransactionUpdatedEvent,
   eventTypeToTriggerType,
   isTransactionEvent,
   type TransactionEventData,
   type WorkflowEvent,
} from "../src/types/events";

describe("workflow events", () => {
   const sampleEventData: TransactionEventData = {
      id: "tx-123",
      organizationId: "org-456",
      description: "Test transaction",
      amount: 100.5,
      type: "expense",
      date: "2024-01-15T10:00:00Z",
      bankAccountId: "bank-789",
      categoryIds: ["cat-1", "cat-2"],
      costCenterId: "cost-1",
      tagIds: ["tag-1"],
   };

   describe("createTransactionCreatedEvent", () => {
      it("should create a transaction.created event", () => {
         const event = createTransactionCreatedEvent(
            "org-456",
            sampleEventData,
         );

         expect(event.type).toBe("transaction.created");
         expect(event.organizationId).toBe("org-456");
         expect(event.data).toEqual(sampleEventData);
         expect(event.id).toBeTruthy();
         expect(event.timestamp).toBeTruthy();
      });

      it("should generate unique IDs for each event", () => {
         const event1 = createTransactionCreatedEvent("org-1", sampleEventData);
         const event2 = createTransactionCreatedEvent("org-1", sampleEventData);

         expect(event1.id).not.toBe(event2.id);
      });

      it("should include ISO timestamp", () => {
         const event = createTransactionCreatedEvent("org-1", sampleEventData);
         const timestamp = new Date(event.timestamp);

         expect(timestamp instanceof Date).toBe(true);
         expect(Number.isNaN(timestamp.getTime())).toBe(false);
      });
   });

   describe("createTransactionUpdatedEvent", () => {
      it("should create a transaction.updated event", () => {
         const event = createTransactionUpdatedEvent(
            "org-456",
            sampleEventData,
         );

         expect(event.type).toBe("transaction.updated");
         expect(event.organizationId).toBe("org-456");
         expect(event.data).toEqual(sampleEventData);
      });

      it("should include previousData when provided", () => {
         const dataWithPrevious: TransactionEventData = {
            ...sampleEventData,
            previousData: {
               amount: 50,
               description: "Old description",
            },
         };

         const event = createTransactionUpdatedEvent("org-1", dataWithPrevious);

         expect(event.data.previousData).toBeDefined();
         expect(event.data.previousData?.amount).toBe(50);
         expect(event.data.previousData?.description).toBe("Old description");
      });
   });

   describe("isTransactionEvent", () => {
      it("should return true for transaction.created event", () => {
         const event = createTransactionCreatedEvent("org-1", sampleEventData);
         expect(isTransactionEvent(event)).toBe(true);
      });

      it("should return true for transaction.updated event", () => {
         const event = createTransactionUpdatedEvent("org-1", sampleEventData);
         expect(isTransactionEvent(event)).toBe(true);
      });

      it("should handle both event types correctly", () => {
         const createdEvent = createTransactionCreatedEvent(
            "org-1",
            sampleEventData,
         );
         const updatedEvent = createTransactionUpdatedEvent(
            "org-1",
            sampleEventData,
         );

         const events: WorkflowEvent[] = [createdEvent, updatedEvent];

         for (const event of events) {
            expect(isTransactionEvent(event)).toBe(true);
         }
      });
   });

   describe("eventTypeToTriggerType", () => {
      it("should convert transaction.created to trigger type", () => {
         expect(eventTypeToTriggerType("transaction.created")).toBe(
            "transaction.created",
         );
      });

      it("should convert transaction.updated to trigger type", () => {
         expect(eventTypeToTriggerType("transaction.updated")).toBe(
            "transaction.updated",
         );
      });
   });

   describe("TransactionEventData", () => {
      it("should allow optional fields to be undefined", () => {
         const minimalData: TransactionEventData = {
            id: "tx-1",
            organizationId: "org-1",
            description: "Minimal",
            amount: 10,
            type: "income",
            date: "2024-01-01",
         };

         const event = createTransactionCreatedEvent("org-1", minimalData);

         expect(event.data.bankAccountId).toBeUndefined();
         expect(event.data.categoryIds).toBeUndefined();
         expect(event.data.costCenterId).toBeUndefined();
         expect(event.data.tagIds).toBeUndefined();
      });

      it("should support all transaction types", () => {
         const types: Array<"income" | "expense" | "transfer"> = [
            "income",
            "expense",
            "transfer",
         ];

         for (const type of types) {
            const data: TransactionEventData = {
               ...sampleEventData,
               type,
            };
            const event = createTransactionCreatedEvent("org-1", data);
            expect(event.data.type).toBe(type);
         }
      });
   });
});
