import type {
   Action,
   ActionConfig,
   ActionType,
   ConditionGroup,
   FlowData,
   TriggerConfig,
   TriggerType,
} from "@packages/database/schema";
import type {
   ActionNodeData,
   AutomationEdge,
   AutomationNode,
   ConditionNodeData,
   TriggerNodeData,
} from "./types";

export function flowDataToNodesAndEdges(
   flowData: FlowData | null | undefined,
): {
   nodes: AutomationNode[];
   edges: AutomationEdge[];
} {
   if (!flowData) {
      return { edges: [], nodes: [] };
   }

   const nodes = (flowData.nodes ?? []) as AutomationNode[];
   const edges = (flowData.edges ?? []) as AutomationEdge[];

   return { edges, nodes };
}

export function nodesToFlowData(
   nodes: AutomationNode[],
   edges: AutomationEdge[],
   viewport?: { x: number; y: number; zoom: number },
): FlowData {
   return {
      edges: edges as unknown[],
      nodes: nodes as unknown[],
      viewport,
   };
}

export function extractRuleDataFromNodes(
   nodes: AutomationNode[],
   edges: AutomationEdge[],
): {
   triggerType: TriggerType;
   triggerConfig: TriggerConfig;
   conditions: ConditionGroup[];
   actions: Action[];
} {
   const triggerNodes = nodes.filter((n) => n.type === "trigger");
   const conditionNodes = nodes.filter((n) => n.type === "condition");
   const actionNodes = nodes.filter((n) => n.type === "action");

   if (triggerNodes.length === 0) {
      throw new Error("É necessário pelo menos um nó de gatilho");
   }

   if (actionNodes.length === 0) {
      throw new Error("É necessário pelo menos um nó de ação");
   }

   const triggerNode = triggerNodes[0];
   if (!triggerNode) {
      throw new Error("Nó de gatilho não encontrado");
   }
   const triggerData = triggerNode.data as TriggerNodeData;

   const conditions: ConditionGroup[] = conditionNodes.map((node) => {
      const data = node.data as ConditionNodeData;
      return {
         conditions: data.conditions,
         id: node.id,
         operator: data.operator,
      };
   });

   const orderedActionNodes = topologicalSort(actionNodes, edges);

   const actions: Action[] = orderedActionNodes.map((node) => {
      const data = node.data as ActionNodeData;
      return {
         config: data.config,
         continueOnError: data.continueOnError,
         id: node.id,
         type: data.actionType,
      };
   });

   return {
      actions,
      conditions,
      triggerConfig: triggerData.config,
      triggerType: triggerData.triggerType,
   };
}

function topologicalSort(
   nodes: AutomationNode[],
   edges: AutomationEdge[],
): AutomationNode[] {
   const nodeIds = new Set(nodes.map((n) => n.id));
   const relevantEdges = edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
   );

   const inDegree = new Map<string, number>();
   const adjacency = new Map<string, string[]>();

   for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
   }

   for (const edge of relevantEdges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      adjacency.get(edge.source)?.push(edge.target);
   }

   const queue: string[] = [];
   for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
         queue.push(id);
      }
   }

   const sorted: AutomationNode[] = [];
   const nodeMap = new Map(nodes.map((n) => [n.id, n]));

   while (queue.length > 0) {
      const id = queue.shift();
      if (!id) continue;
      const node = nodeMap.get(id);
      if (node) {
         sorted.push(node);
      }

      for (const neighbor of adjacency.get(id) ?? []) {
         const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
         inDegree.set(neighbor, newDegree);
         if (newDegree === 0) {
            queue.push(neighbor);
         }
      }
   }

   return sorted;
}

export function ruleDataToNodes(
   triggerType: TriggerType,
   triggerConfig: TriggerConfig,
   conditions: ConditionGroup[],
   actions: Action[],
): { nodes: AutomationNode[]; edges: AutomationEdge[] } {
   const nodes: AutomationNode[] = [];
   const edges: AutomationEdge[] = [];

   const triggerId = `trigger-${crypto.randomUUID()}`;
   nodes.push({
      data: {
         config: triggerConfig,
         label: "Gatilho",
         triggerType,
      },
      id: triggerId,
      position: { x: 250, y: 0 },
      type: "trigger",
   });

   let lastNodeId = triggerId;
   let yPosition = 150;

   for (const condition of conditions) {
      const conditionId = condition.id || `condition-${crypto.randomUUID()}`;
      nodes.push({
         data: {
            conditions: condition.conditions.map((c) => {
               if ("field" in c) {
                  return c;
               }
               return {
                  field: "",
                  id: c.id,
                  operator: "equals" as const,
                  value: "",
               };
            }),
            label: `Condição ${condition.operator}`,
            operator: condition.operator,
         },
         id: conditionId,
         position: { x: 250, y: yPosition },
         type: "condition",
      });

      edges.push({
         id: `edge-${lastNodeId}-${conditionId}`,
         source: lastNodeId,
         target: conditionId,
      });

      lastNodeId = conditionId;
      yPosition += 150;
   }

   for (const action of actions) {
      const actionId = action.id || `action-${crypto.randomUUID()}`;
      nodes.push({
         data: {
            actionType: action.type,
            config: action.config,
            continueOnError: action.continueOnError,
            label: getActionLabel(action.type),
         },
         id: actionId,
         position: { x: 250, y: yPosition },
         type: "action",
      });

      edges.push({
         id: `edge-${lastNodeId}-${actionId}`,
         source: lastNodeId,
         target: actionId,
      });

      lastNodeId = actionId;
      yPosition += 150;
   }

   return { edges, nodes };
}

function getActionLabel(actionType: ActionType): string {
   const labels: Record<ActionType, string> = {
      add_tag: "Adicionar Tag",
      create_transaction: "Criar Transação",
      remove_tag: "Remover Tag",
      send_email: "Enviar E-mail",
      send_push_notification: "Enviar Notificação",
      set_category: "Definir Categoria",
      set_cost_center: "Definir Centro de Custo",
      stop_execution: "Parar",
      update_description: "Atualizar Descrição",
   };
   return labels[actionType] ?? actionType;
}

export function createDefaultTriggerNode(
   triggerType: TriggerType = "transaction.created",
): AutomationNode {
   return {
      data: {
         config: {},
         label: "Gatilho",
         triggerType,
      },
      id: `trigger-${crypto.randomUUID()}`,
      position: { x: 250, y: 0 },
      type: "trigger",
   };
}

export function createDefaultConditionNode(
   operator: "AND" | "OR" = "AND",
   position: { x: number; y: number } = { x: 250, y: 150 },
): AutomationNode {
   return {
      data: {
         conditions: [],
         label: `Condição ${operator}`,
         operator,
      },
      id: `condition-${crypto.randomUUID()}`,
      position,
      type: "condition",
   };
}

export function createDefaultActionNode(
   actionType: ActionType = "set_category",
   config: ActionConfig = {},
   position: { x: number; y: number } = { x: 250, y: 300 },
): AutomationNode {
   return {
      data: {
         actionType,
         config,
         label: getActionLabel(actionType),
      },
      id: `action-${crypto.randomUUID()}`,
      position,
      type: "action",
   };
}

export function schemaToFlowData(
   triggerType: TriggerType,
   conditions: ConditionGroup[],
   actions: Action[],
   existingFlowData: { nodes: unknown[]; edges: unknown[] } | null,
): { nodes: AutomationNode[]; edges: AutomationEdge[] } {
   if (existingFlowData?.nodes?.length) {
      return flowDataToNodesAndEdges(existingFlowData as FlowData);
   }
   return ruleDataToNodes(triggerType, {}, conditions, actions);
}

export function flowDataToSchema(
   nodes: AutomationNode[],
   edges: AutomationEdge[],
): {
   conditions: ConditionGroup[];
   actions: Action[];
} {
   const result = extractRuleDataFromNodes(nodes, edges);
   return {
      actions: result.actions,
      conditions: result.conditions,
   };
}
