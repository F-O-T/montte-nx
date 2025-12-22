import type { TriggerConfig, TriggerType } from "@packages/database/schema";
import type { ConditionFieldDefinition } from "../types/conditions";
import { TRANSACTION_FIELDS } from "../types/conditions";

export type TriggerDefinition = {
   type: TriggerType;
   label: string;
   description: string;
   category: "transaction" | "scheduled" | "webhook";
   availableFields: ConditionFieldDefinition[];
   eventDataSchema: EventDataField[];
   supportsSimulation: boolean;
   configSchema?: TriggerConfigField[];
};

export type EventDataField = {
   field: string;
   label: string;
   type: "string" | "number" | "boolean" | "date" | "array" | "object";
   description?: string;
   required?: boolean;
};

export type TriggerConfigField = {
   key: keyof TriggerConfig;
   label: string;
   type: "string" | "number" | "boolean" | "select" | "multiselect";
   required?: boolean;
   defaultValue?: unknown;
   options?: { value: string; label: string }[];
   placeholder?: string;
   helpText?: string;
};

const TRANSACTION_EVENT_DATA_SCHEMA: EventDataField[] = [
   { field: "id", label: "Transaction ID", required: true, type: "string" },
   {
      field: "organizationId",
      label: "Organization ID",
      required: true,
      type: "string",
   },
   {
      field: "description",
      label: "Description",
      required: true,
      type: "string",
   },
   { field: "amount", label: "Amount", required: true, type: "number" },
   {
      description: "income, expense, or transfer",
      field: "type",
      label: "Type",
      required: true,
      type: "string",
   },
   { field: "date", label: "Date", required: true, type: "date" },
   { field: "bankAccountId", label: "Bank Account ID", type: "string" },
   { field: "categoryIds", label: "Category IDs", type: "array" },
   { field: "costCenterId", label: "Cost Center ID", type: "string" },
   { field: "counterpartyId", label: "Counterparty ID", type: "string" },
   { field: "tagIds", label: "Tag IDs", type: "array" },
   { field: "metadata", label: "Metadata", type: "object" },
];

export const TRIGGER_DEFINITIONS: TriggerDefinition[] = [
   {
      availableFields: TRANSACTION_FIELDS,
      category: "transaction",
      description: "Triggered when a new transaction is created",
      eventDataSchema: TRANSACTION_EVENT_DATA_SCHEMA,
      label: "Transaction Created",
      supportsSimulation: true,
      type: "transaction.created",
   },
   {
      availableFields: TRANSACTION_FIELDS,
      category: "transaction",
      description: "Triggered when an existing transaction is modified",
      eventDataSchema: [
         ...TRANSACTION_EVENT_DATA_SCHEMA,
         {
            description: "The previous values before update",
            field: "previousData",
            label: "Previous Data",
            type: "object",
         },
      ],
      label: "Transaction Updated",
      supportsSimulation: true,
      type: "transaction.updated",
   },
];

export function getTriggerDefinition(
   type: TriggerType,
): TriggerDefinition | undefined {
   return TRIGGER_DEFINITIONS.find((def) => def.type === type);
}

export function getTriggersByCategory(
   category: TriggerDefinition["category"],
): TriggerDefinition[] {
   return TRIGGER_DEFINITIONS.filter((def) => def.category === category);
}

export function getTriggerLabel(type: TriggerType): string {
   return getTriggerDefinition(type)?.label ?? type;
}

export function getFieldsForTrigger(
   type: TriggerType,
): ConditionFieldDefinition[] {
   return getTriggerDefinition(type)?.availableFields ?? [];
}
