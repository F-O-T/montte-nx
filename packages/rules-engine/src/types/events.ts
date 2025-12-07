import type { TriggerType } from "@packages/database/schema";

export type TransactionEventType =
   | "transaction.created"
   | "transaction.updated";

export type WebhookEventType = "webhook.received";

export type EventType = TransactionEventType | WebhookEventType;

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

export type WebhookEventData = {
   source: "stripe" | "asaas" | "custom";
   eventType: string;
   payload: Record<string, unknown>;
   headers?: Record<string, string>;
   receivedAt: string;
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

export type WebhookReceivedEvent = BaseEvent<
   "webhook.received",
   WebhookEventData
>;

export type AutomationEvent =
   | TransactionCreatedEvent
   | TransactionUpdatedEvent
   | WebhookReceivedEvent;

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

export function createWebhookReceivedEvent(
   organizationId: string,
   data: WebhookEventData,
): WebhookReceivedEvent {
   return {
      data,
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date().toISOString(),
      type: "webhook.received",
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

export function isWebhookEvent(
   event: AutomationEvent,
): event is WebhookReceivedEvent {
   return event.type === "webhook.received";
}

export function eventTypeToTriggerType(eventType: EventType): TriggerType {
   return eventType as TriggerType;
}
