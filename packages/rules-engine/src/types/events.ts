import type { TriggerType } from "@packages/database/schema";

export type TransactionEventType =
   | "transaction.created"
   | "transaction.updated";

export type EventType = TransactionEventType;

export type TransactionEventData = {
   id: string;
   organizationId: string;
   bankAccountId?: string | null;
   description: string;
   amount: number;
   type: "income" | "expense" | "transfer";
   date: string;
   categoryIds?: string[];
   costCenterId?: string | null;
   counterpartyId?: string | null;
   tagIds?: string[];
   metadata?: Record<string, unknown>;
   previousData?: Partial<TransactionEventData>;
};

export type BaseEvent<T extends EventType, D> = {
   id: string;
   type: T;
   timestamp: string;
   organizationId: string;
   data: D;
};

export type TransactionCreatedEvent = BaseEvent<
   "transaction.created",
   TransactionEventData
>;

export type TransactionUpdatedEvent = BaseEvent<
   "transaction.updated",
   TransactionEventData
>;

export type AutomationEvent = TransactionCreatedEvent | TransactionUpdatedEvent;

export function createTransactionCreatedEvent(
   organizationId: string,
   data: TransactionEventData,
): TransactionCreatedEvent {
   return {
      data,
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date().toISOString(),
      type: "transaction.created",
   };
}

export function createTransactionUpdatedEvent(
   organizationId: string,
   data: TransactionEventData,
): TransactionUpdatedEvent {
   return {
      data,
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date().toISOString(),
      type: "transaction.updated",
   };
}

export function isTransactionEvent(
   event: AutomationEvent,
): event is TransactionCreatedEvent | TransactionUpdatedEvent {
   return (
      event.type === "transaction.created" ||
      event.type === "transaction.updated"
   );
}

export function eventTypeToTriggerType(eventType: EventType): TriggerType {
   return eventType as TriggerType;
}
