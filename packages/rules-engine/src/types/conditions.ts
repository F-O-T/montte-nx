import type {
   Condition,
   ConditionGroup,
   ConditionOperator,
   LogicalOperator,
} from "@packages/database/schema";

export type { Condition, ConditionGroup, ConditionOperator, LogicalOperator };

export type ConditionField =
   | "amount"
   | "description"
   | "type"
   | "status"
   | "date"
   | "categoryId"
   | "costCenterId"
   | "counterpartyId"
   | "bankAccountId"
   | "tagIds"
   | "metadata"
   | "webhookSource"
   | "webhookEventType"
   | "webhookPayload";

export type ConditionFieldType =
   | "string"
   | "number"
   | "boolean"
   | "date"
   | "array"
   | "object";

export type ConditionFieldDefinition = {
   key: ConditionField;
   label: string;
   type: ConditionFieldType;
   operators: ConditionOperator[];
   category: "transaction" | "webhook" | "common";
};

export const CONDITION_FIELD_DEFINITIONS: ConditionFieldDefinition[] = [
   {
      category: "transaction",
      key: "amount",
      label: "Amount",
      operators: ["eq", "neq", "gt", "gte", "lt", "lte", "between"],
      type: "number",
   },
   {
      category: "transaction",
      key: "description",
      label: "Description",
      operators: [
         "equals",
         "not_equals",
         "contains",
         "not_contains",
         "starts_with",
         "ends_with",
         "regex",
         "is_empty",
         "is_not_empty",
      ],
      type: "string",
   },
   {
      category: "transaction",
      key: "type",
      label: "Type",
      operators: ["equals", "not_equals", "in_list", "not_in_list"],
      type: "string",
   },
   {
      category: "transaction",
      key: "status",
      label: "Status",
      operators: ["equals", "not_equals", "in_list", "not_in_list"],
      type: "string",
   },
   {
      category: "transaction",
      key: "date",
      label: "Date",
      operators: [
         "before",
         "after",
         "between",
         "is_weekend",
         "is_business_day",
         "day_of_month",
         "day_of_week",
      ],
      type: "date",
   },
   {
      category: "transaction",
      key: "categoryId",
      label: "Category",
      operators: [
         "equals",
         "not_equals",
         "is_empty",
         "is_not_empty",
         "in_list",
      ],
      type: "string",
   },
   {
      category: "transaction",
      key: "costCenterId",
      label: "Cost Center",
      operators: [
         "equals",
         "not_equals",
         "is_empty",
         "is_not_empty",
         "in_list",
      ],
      type: "string",
   },
   {
      category: "transaction",
      key: "counterpartyId",
      label: "Counterparty",
      operators: [
         "equals",
         "not_equals",
         "is_empty",
         "is_not_empty",
         "in_list",
      ],
      type: "string",
   },
   {
      category: "transaction",
      key: "bankAccountId",
      label: "Bank Account",
      operators: ["equals", "not_equals", "in_list", "not_in_list"],
      type: "string",
   },
   {
      category: "transaction",
      key: "tagIds",
      label: "Tags",
      operators: ["contains", "not_contains", "is_empty", "is_not_empty"],
      type: "array",
   },
   {
      category: "webhook",
      key: "webhookSource",
      label: "Webhook Source",
      operators: ["equals", "not_equals", "in_list"],
      type: "string",
   },
   {
      category: "webhook",
      key: "webhookEventType",
      label: "Webhook Event Type",
      operators: ["equals", "not_equals", "contains", "starts_with", "in_list"],
      type: "string",
   },
   {
      category: "webhook",
      key: "webhookPayload",
      label: "Webhook Payload",
      operators: ["contains", "not_contains", "is_empty", "is_not_empty"],
      type: "object",
   },
];

export type ConditionEvaluationContext = {
   organizationId: string;
   eventData: Record<string, unknown>;
   metadata?: Record<string, unknown>;
};

export type ConditionEvaluationResult = {
   conditionId: string;
   passed: boolean;
   operator: ConditionOperator;
   field: string;
   actualValue: unknown;
   expectedValue: unknown;
   error?: string;
};

export type ConditionGroupEvaluationResult = {
   groupId: string;
   operator: LogicalOperator;
   passed: boolean;
   results: (ConditionEvaluationResult | ConditionGroupEvaluationResult)[];
};

export function createCondition(
   field: string,
   operator: ConditionOperator,
   value: unknown,
   options?: Condition["options"],
): Condition {
   return {
      field,
      id: crypto.randomUUID(),
      operator,
      options,
      value,
   };
}

export function createConditionGroup(
   operator: LogicalOperator,
   conditions: (Condition | ConditionGroup)[],
): ConditionGroup {
   return {
      conditions,
      id: crypto.randomUUID(),
      operator,
   };
}

export function isConditionGroup(
   item: Condition | ConditionGroup,
): item is ConditionGroup {
   return "operator" in item && "conditions" in item;
}
