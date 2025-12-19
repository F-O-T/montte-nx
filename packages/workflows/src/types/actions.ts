import type {
	ActionConfig,
	ActionType,
	Consequence,
} from "@packages/database/schema";

export type { ActionConfig, ActionType, Consequence };

export type ActionCategory =
   | "categorization"
   | "tagging"
   | "modification"
   | "creation"
   | "notification"
   | "control";

export type ActionDefinition = {
   type: ActionType;
   label: string;
   description: string;
   category: ActionCategory;
   configSchema: ActionConfigField[];
   appliesTo: "transaction"[];
};

export type ActionConfigField = {
   key: keyof ActionConfig;
   label: string;
   type:
      | "string"
      | "number"
      | "boolean"
      | "select"
      | "multiselect"
      | "template"
      | "category-split";
   required?: boolean;
   defaultValue?: unknown;
   options?: { value: string; label: string }[];
   placeholder?: string;
   helpText?: string;
   dependsOn?: {
      field: keyof ActionConfig;
      value: unknown;
   };
};

export const ACTION_DEFINITIONS: ActionDefinition[] = [
   {
      appliesTo: ["transaction"],
      category: "categorization",
      configSchema: [
         {
            defaultValue: "equal",
            helpText: "Como dividir o valor entre as categorias",
            key: "categorySplitMode",
            label: "Modo de Divisao",
            options: [
               { label: "Categoria Unica / Divisao Igual", value: "equal" },
               { label: "Por Percentual", value: "percentage" },
               { label: "Por Valor Fixo", value: "fixed" },
               { label: "Extrair da Descricao", value: "dynamic" },
            ],
            required: true,
            type: "select",
         },
         {
            helpText: "Selecione as categorias para atribuir",
            key: "categoryIds",
            label: "Categorias",
            type: "category-split",
         },
         {
            helpText:
               "Regex para extrair categoria e percentual da descricao. Ex: alimentacao 80% limpeza 20%",
            key: "dynamicSplitPattern",
            label: "Padrao de Extracao (Regex)",
            placeholder: "(\\w+)\\s+(\\d+)%",
            type: "string",
            dependsOn: { field: "categorySplitMode", value: "dynamic" },
         },
      ],
      description:
         "Atribuir uma ou mais categorias a transacao, com opcao de divisao",
      label: "Definir Categoria",
      type: "set_category",
   },
   {
      appliesTo: ["transaction"],
      category: "tagging",
      configSchema: [
         {
            helpText: "Select tags to add",
            key: "tagIds",
            label: "Tags",
            required: true,
            type: "multiselect",
         },
      ],
      description: "Add one or more tags to the transaction",
      label: "Add Tags",
      type: "add_tag",
   },
   {
      appliesTo: ["transaction"],
      category: "tagging",
      configSchema: [
         {
            helpText: "Select tags to remove",
            key: "tagIds",
            label: "Tags",
            required: true,
            type: "multiselect",
         },
      ],
      description: "Remove one or more tags from the transaction",
      label: "Remove Tags",
      type: "remove_tag",
   },
   {
      appliesTo: ["transaction"],
      category: "categorization",
      configSchema: [
         {
            helpText: "Select the cost center to assign",
            key: "costCenterId",
            label: "Cost Center",
            required: true,
            type: "select",
         },
      ],
      description: "Assign a cost center to the transaction",
      label: "Set Cost Center",
      type: "set_cost_center",
   },
   {
      appliesTo: ["transaction"],
      category: "modification",
      configSchema: [
         {
            defaultValue: "replace",
            key: "mode",
            label: "Mode",
            options: [
               { label: "Replace", value: "replace" },
               { label: "Append", value: "append" },
               { label: "Prepend", value: "prepend" },
            ],
            required: true,
            type: "select",
         },
         {
            helpText: "Use {{field}} to insert dynamic values",
            key: "value",
            label: "Value",
            placeholder: "New description or {{variable}}",
            required: true,
            type: "template",
         },
         {
            defaultValue: true,
            key: "template",
            label: "Use template variables",
            type: "boolean",
         },
      ],
      description: "Modify the transaction description",
      label: "Update Description",
      type: "update_description",
   },
   {
      appliesTo: ["transaction"],
      category: "creation",
      configSchema: [
         {
            key: "type",
            label: "Transaction Type",
            options: [
               { label: "Income", value: "income" },
               { label: "Expense", value: "expense" },
            ],
            required: true,
            type: "select",
         },
         {
            key: "description",
            label: "Description",
            placeholder: "Transaction description",
            required: true,
            type: "template",
         },
         {
            helpText: "Path to the amount value in the event data",
            key: "amountField",
            label: "Amount Source Field",
            placeholder: "e.g., payload.amount",
            type: "string",
         },
         {
            helpText: "Use this if amount is not from event data",
            key: "amountFixed",
            label: "Fixed Amount",
            placeholder: "100.00",
            type: "number",
         },
         {
            key: "bankAccountId",
            label: "Bank Account",
            required: true,
            type: "select",
         },
         {
            key: "categoryId",
            label: "Category",
            type: "select",
         },
         {
            helpText: "Path to the date value, or leave empty for current date",
            key: "dateField",
            label: "Date Source Field",
            placeholder: "e.g., payload.created_at",
            type: "string",
         },
      ],
      description: "Create a new transaction based on this event",
      label: "Create Transaction",
      type: "create_transaction",
   },
   {
      appliesTo: ["transaction"],
      category: "notification",
      configSchema: [
         {
            key: "title",
            label: "Title",
            placeholder: "Notification title",
            required: true,
            type: "template",
         },
         {
            key: "body",
            label: "Body",
            placeholder: "Notification body",
            required: true,
            type: "template",
         },
         {
            key: "url",
            label: "Click URL",
            placeholder: "/transactions/{{id}}",
            type: "string",
         },
      ],
      description: "Send a push notification to device",
      label: "Send Push Notification",
      type: "send_push_notification",
   },
   {
      appliesTo: ["transaction"],
      category: "notification",
      configSchema: [
         {
            defaultValue: "owner",
            key: "to",
            label: "Recipient",
            options: [
               { label: "Organization Owner", value: "owner" },
               { label: "Custom Email", value: "custom" },
            ],
            required: true,
            type: "select",
         },
         {
            dependsOn: { field: "to", value: "custom" },
            key: "customEmail",
            label: "Custom Email",
            placeholder: "email@example.com",
            type: "string",
         },
         {
            key: "subject",
            label: "Subject",
            placeholder: "Email subject",
            required: true,
            type: "template",
         },
         {
            key: "body",
            label: "Body",
            placeholder: "Email body (supports HTML)",
            required: true,
            type: "template",
         },
      ],
      description: "Send an email notification",
      label: "Send Email",
      type: "send_email",
   },
   {
      appliesTo: ["transaction"],
      category: "control",
      configSchema: [
         {
            key: "reason",
            label: "Reason",
            placeholder: "Optional reason for stopping",
            type: "string",
         },
      ],
      description: "Stop processing further rules for this event",
      label: "Stop Execution",
      type: "stop_execution",
   },
   {
      appliesTo: ["transaction"],
      category: "modification",
      configSchema: [
         {
            helpText: "Select the destination account for the transfer",
            key: "toBankAccountId",
            label: "Destination Account",
            required: true,
            type: "select",
         },
      ],
      description: "Mark the transaction as a transfer to another account",
      label: "Mark as Transfer",
      type: "mark_as_transfer",
   },
];

export type ActionExecutionContext = {
   organizationId: string;
   eventData: Record<string, unknown>;
   ruleId: string;
   dryRun?: boolean;
};

export type ActionExecutionResult = {
	consequenceIndex?: number;
	type: string;
	success: boolean;
	result?: unknown;
	error?: string;
	skipped?: boolean;
	skipReason?: string;
};

export type ConsequenceExecutionResult = {
	consequenceIndex: number;
	type: string;
	success: boolean;
	result?: unknown;
	error?: string;
	skipped?: boolean;
	skipReason?: string;
};

export function createConsequence(
	type: ActionType,
	payload: ActionConfig,
): Consequence {
	return {
		payload,
		type,
	};
}

export function getActionDefinition(
   type: ActionType,
): ActionDefinition | undefined {
   return ACTION_DEFINITIONS.find((def) => def.type === type);
}

export function getActionsForTrigger(
   triggerType: "transaction",
): ActionDefinition[] {
   return ACTION_DEFINITIONS.filter((def) =>
      def.appliesTo.includes(triggerType),
   );
}
