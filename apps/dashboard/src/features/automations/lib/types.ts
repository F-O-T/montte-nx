import type {
   ActionConfig,
   ActionType,
   ConditionOperator,
   TriggerConfig,
   TriggerType,
} from "@packages/database/schema";
import type { Edge, Node } from "@xyflow/react";

export type TriggerNodeData = {
   label: string;
   triggerType: TriggerType;
   config: TriggerConfig;
};

export type ConditionNodeData = {
   label: string;
   operator: "AND" | "OR";
   conditions: {
      id: string;
      field: string;
      operator: ConditionOperator;
      value: unknown;
   }[];
};

export type ActionNodeData = {
   label: string;
   actionType: ActionType;
   config: ActionConfig;
   continueOnError?: boolean;
};

export type AutomationNodeData =
   | TriggerNodeData
   | ConditionNodeData
   | ActionNodeData;

export type TriggerNode = Node<TriggerNodeData, "trigger">;
export type ConditionNode = Node<ConditionNodeData, "condition">;
export type ActionNode = Node<ActionNodeData, "action">;

export type AutomationNode = TriggerNode | ConditionNode | ActionNode;
export type AutomationEdge = Edge;

export type AutomationFlowState = {
   nodes: AutomationNode[];
   edges: AutomationEdge[];
   selectedNodeId: string | null;
};

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
   "transaction.created": "Transação Criada",
   "transaction.updated": "Transação Atualizada",
   "webhook.received": "Webhook Recebido",
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
   add_tag: "Adicionar Tag",
   create_transaction: "Criar Transação",
   remove_tag: "Remover Tag",
   send_email: "Enviar E-mail",
   send_push_notification: "Enviar Notificação Push",
   set_category: "Definir Categoria",
   set_cost_center: "Definir Centro de Custo",
   stop_execution: "Parar Execução",
   update_description: "Atualizar Descrição",
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
   after: "After",
   before: "Before",
   between: "Between",
   contains: "Contains",
   day_of_month: "Day of Month",
   day_of_week: "Day of Week",
   ends_with: "Ends With",
   eq: "=",
   equals: "Equals",
   gt: ">",
   gte: "≥",
   in_list: "In List",
   is_business_day: "Is Business Day",
   is_empty: "Is Empty",
   is_not_empty: "Is Not Empty",
   is_weekend: "Is Weekend",
   lt: "<",
   lte: "≤",
   neq: "≠",
   not_contains: "Not Contains",
   not_equals: "Not Equals",
   not_in_list: "Not In List",
   regex: "Matches Regex",
   starts_with: "Starts With",
};

export const TRANSACTION_FIELDS = [
   { label: "Description", type: "string", value: "description" },
   { label: "Amount", type: "number", value: "amount" },
   { label: "Type", type: "enum", value: "type" },
   { label: "Date", type: "date", value: "date" },
   { label: "Bank Account", type: "reference", value: "bankAccountId" },
   { label: "Categories", type: "array", value: "categoryIds" },
   { label: "Cost Center", type: "reference", value: "costCenterId" },
   { label: "Tags", type: "array", value: "tagIds" },
   { label: "Counterparty", type: "reference", value: "counterpartyId" },
] as const;

export type TransactionField = (typeof TRANSACTION_FIELDS)[number]["value"];
