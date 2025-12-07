import type {
   Condition,
   ConditionGroup,
   ConditionOperator,
   EvaluationContext,
   EvaluationResult,
   GroupEvaluationResult,
   LogicalOperator,
} from "@packages/database/schema";

export type {
   Condition,
   ConditionGroup,
   ConditionOperator,
   EvaluationContext,
   EvaluationResult,
   GroupEvaluationResult,
   LogicalOperator,
};

export { isConditionGroup } from "@packages/database/schema";

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
   | "metadata";

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
   category: "transaction" | "common";
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
         "eq",
         "neq",
         "contains",
         "not_contains",
         "starts_with",
         "ends_with",
         "matches",
         "is_empty",
         "is_not_empty",
      ],
      type: "string",
   },
   {
      category: "transaction",
      key: "type",
      label: "Type",
      operators: ["eq", "neq", "in", "not_in"],
      type: "string",
   },
   {
      category: "transaction",
      key: "status",
      label: "Status",
      operators: ["eq", "neq", "in", "not_in"],
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
         "is_weekday",
         "day_of_month",
         "day_of_week",
      ],
      type: "date",
   },
   {
      category: "transaction",
      key: "categoryId",
      label: "Category",
      operators: ["eq", "neq", "is_empty", "is_not_empty", "in"],
      type: "string",
   },
   {
      category: "transaction",
      key: "costCenterId",
      label: "Cost Center",
      operators: ["eq", "neq", "is_empty", "is_not_empty", "in"],
      type: "string",
   },
   {
      category: "transaction",
      key: "counterpartyId",
      label: "Counterparty",
      operators: ["eq", "neq", "is_empty", "is_not_empty", "in"],
      type: "string",
   },
   {
      category: "transaction",
      key: "bankAccountId",
      label: "Bank Account",
      operators: ["eq", "neq", "in", "not_in"],
      type: "string",
   },
   {
      category: "transaction",
      key: "tagIds",
      label: "Tags",
      operators: ["contains", "not_contains", "is_empty", "is_not_empty"],
      type: "array",
   },
];

export type ConditionType = "string" | "number" | "boolean" | "date" | "array";

export type ConditionOptions = {
   caseSensitive?: boolean;
   negate?: boolean;
   trim?: boolean;
};

export function createCondition(
   type: ConditionType,
   field: string,
   operator: ConditionOperator,
   value?: unknown,
   options?: ConditionOptions,
): Condition {
   const base = {
      field,
      id: crypto.randomUUID(),
      options,
   };

   switch (type) {
      case "string":
         return {
            ...base,
            type: "string",
            operator: operator as Condition & { type: "string" } extends {
               operator: infer O;
            }
               ? O
               : never,
            value: value as string | string[] | undefined,
         };
      case "number":
         return {
            ...base,
            type: "number",
            operator: operator as Condition & { type: "number" } extends {
               operator: infer O;
            }
               ? O
               : never,
            value: value as number | [number, number] | undefined,
         };
      case "boolean":
         return {
            ...base,
            type: "boolean",
            operator: operator as Condition & { type: "boolean" } extends {
               operator: infer O;
            }
               ? O
               : never,
            value: value as boolean | undefined,
         };
      case "date":
         return {
            ...base,
            type: "date",
            operator: operator as Condition & { type: "date" } extends {
               operator: infer O;
            }
               ? O
               : never,
            value: value as
               | string
               | Date
               | number
               | [string | Date | number, string | Date | number]
               | number[]
               | undefined,
         };
      case "array":
         return {
            ...base,
            type: "array",
            operator: operator as Condition & { type: "array" } extends {
               operator: infer O;
            }
               ? O
               : never,
            value: value as unknown[] | unknown | number | undefined,
         };
   }
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
