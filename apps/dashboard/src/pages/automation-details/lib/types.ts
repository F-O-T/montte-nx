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
   after: "Depois",
   before: "Antes",
   between: "Entre",
   contains: "Contém",
   day_of_month: "Dia do Mês",
   day_of_week: "Dia da Semana",
   ends_with: "Termina Com",
   eq: "=",
   equals: "Igual a",
   gt: ">",
   gte: "≥",
   in_list: "Na Lista",
   is_business_day: "É Dia Útil",
   is_empty: "Está Vazio",
   is_not_empty: "Não Está Vazio",
   is_weekend: "É Fim de Semana",
   lt: "<",
   lte: "≤",
   neq: "≠",
   not_contains: "Não Contém",
   not_equals: "Diferente de",
   not_in_list: "Fora da Lista",
   regex: "Corresponde a Regex",
   starts_with: "Começa Com",
};

export const TRANSACTION_FIELDS = [
   { label: "Descrição", type: "string", value: "description" },
   { label: "Valor", type: "number", value: "amount" },
   { label: "Tipo", type: "enum", value: "type" },
   { label: "Data", type: "date", value: "date" },
   { label: "Conta Bancária", type: "reference", value: "bankAccountId" },
   { label: "Categorias", type: "array", value: "categoryIds" },
   { label: "Centro de Custo", type: "reference", value: "costCenterId" },
   { label: "Tags", type: "array", value: "tagIds" },
   { label: "Contraparte", type: "reference", value: "counterpartyId" },
] as const;

export type TransactionField = (typeof TRANSACTION_FIELDS)[number]["value"];
