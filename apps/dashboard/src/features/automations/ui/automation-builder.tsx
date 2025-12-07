import type { ActionType, TriggerType } from "@packages/database/schema";
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import {
   addEdge,
   type Connection,
   ReactFlowProvider,
   useEdgesState,
   useNodesState,
   useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";
import { useCallback, useState } from "react";
import {
   createDefaultActionNode,
   createDefaultConditionNode,
   createDefaultTriggerNode,
} from "../lib/flow-serialization";
import type { AutomationEdge, AutomationNode } from "../lib/types";
import { AutomationActivityPanel } from "./automation-activity-panel";
import { AutomationCanvas } from "./automation-canvas";
import { NodeConfigurationPanel } from "./node-configuration-panel";

type AutomationBuilderProps = {
   automationId?: string;
   initialNodes?: AutomationNode[];
   initialEdges?: AutomationEdge[];
   onChange?: (nodes: AutomationNode[], edges: AutomationEdge[]) => void;
   readOnly?: boolean;
};

function AutomationBuilderContent({
   automationId,
   initialNodes = [],
   initialEdges = [],
   onChange,
   readOnly = false,
}: AutomationBuilderProps) {
   const [nodes, setNodes, onNodesChange] =
      useNodesState<AutomationNode>(initialNodes);
   const [edges, setEdges, onEdgesChange] =
      useEdgesState<AutomationEdge>(initialEdges);
   const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
   const { fitView } = useReactFlow();

   const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
   const hasTrigger = nodes.some((n) => n.type === "trigger");

   const onConnect = useCallback(
      (connection: Connection) => {
         if (readOnly) return;
         setEdges((eds) => {
            const newEdges = addEdge(connection, eds);
            onChange?.(nodes, newEdges);
            return newEdges;
         });
      },
      [setEdges, readOnly, nodes, onChange],
   );

   const handleNodeSelect = useCallback((nodeId: string | null) => {
      setSelectedNodeId(nodeId);
   }, []);

   const handleNodeUpdate = useCallback(
      (nodeId: string, data: Partial<AutomationNode["data"]>) => {
         setNodes((nds) => {
            const newNodes = nds.map((n) =>
               n.id === nodeId
                  ? ({ ...n, data: { ...n.data, ...data } } as AutomationNode)
                  : n,
            );
            onChange?.(newNodes, edges);
            return newNodes;
         });
      },
      [setNodes, edges, onChange],
   );

   const handleAddNode = useCallback(
      (
         type: "trigger" | "condition" | "action",
         data: {
            triggerType?: TriggerType;
            actionType?: ActionType;
            operator?: "AND" | "OR";
         },
         position: { x: number; y: number },
      ) => {
         let newNode: AutomationNode | null = null;

         if (type === "trigger" && data.triggerType) {
            newNode = createDefaultTriggerNode(data.triggerType);
            newNode.position = position;
         } else if (type === "condition" && data.operator) {
            newNode = createDefaultConditionNode(data.operator, position);
         } else if (type === "action" && data.actionType) {
            newNode = createDefaultActionNode(data.actionType, {}, position);
         }

         if (newNode) {
            const newNodes = [...nodes, newNode];
            setNodes(newNodes);
            onChange?.(newNodes, edges);
            setTimeout(() => fitView({ duration: 300 }), 50);
         }
      },
      [nodes, edges, setNodes, onChange, fitView],
   );

   const handleDeleteNode = useCallback(
      (nodeId: string) => {
         const newNodes = nodes.filter((n) => n.id !== nodeId);
         const newEdges = edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
         );
         setNodes(newNodes);
         setEdges(newEdges);
         onChange?.(newNodes, newEdges);
         if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
         }
      },
      [nodes, edges, setNodes, setEdges, onChange, selectedNodeId],
   );

   const handleDuplicateNode = useCallback(
      (nodeId: string) => {
         const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
         if (!nodeToDuplicate || nodeToDuplicate.type === "trigger") return;

         const newPosition = {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50,
         };

         let duplicatedNode: AutomationNode | null = null;

         if (nodeToDuplicate.type === "condition") {
            duplicatedNode = createDefaultConditionNode(
               nodeToDuplicate.data.operator,
               newPosition,
            );
            duplicatedNode.data = { ...nodeToDuplicate.data };
         } else if (nodeToDuplicate.type === "action") {
            duplicatedNode = createDefaultActionNode(
               nodeToDuplicate.data.actionType,
               nodeToDuplicate.data.config ?? {},
               newPosition,
            );
            duplicatedNode.data = { ...nodeToDuplicate.data };
         }

         if (duplicatedNode) {
            const newNodes = [...nodes, duplicatedNode];
            setNodes(newNodes);
            onChange?.(newNodes, edges);
         }
      },
      [nodes, edges, setNodes, onChange],
   );

   const handleClosePanel = useCallback(() => {
      setSelectedNodeId(null);
   }, []);

   return (
      <div className="relative flex h-full w-full">
         <div
            className={cn(
               "flex-1 transition-all duration-300",
               selectedNode && "mr-[400px]",
            )}
         >
            <AutomationCanvas
               edges={edges}
               hasTrigger={hasTrigger}
               nodes={nodes}
               onAddNode={handleAddNode}
               onConnect={onConnect}
               onDeleteNode={handleDeleteNode}
               onDuplicateNode={handleDuplicateNode}
               onEdgesChange={onEdgesChange}
               onNodeSelect={handleNodeSelect}
               onNodesChange={onNodesChange}
               readOnly={readOnly}
            />
         </div>

         {selectedNode && !readOnly && (
            <div className="absolute right-0 top-0 z-10 h-full w-[400px] border-l bg-background shadow-lg">
               <div className="flex h-12 items-center justify-between border-b px-4">
                  <h3 className="font-semibold">Configuração do Nó</h3>
                  <Button
                     onClick={handleClosePanel}
                     size="icon"
                     variant="ghost"
                  >
                     <X className="size-4" />
                  </Button>
               </div>
               <ScrollArea className="h-[calc(100%-3rem)]">
                  <div className="p-4">
                     <NodeConfigurationPanel
                        node={selectedNode}
                        onClose={handleClosePanel}
                        onUpdate={handleNodeUpdate}
                     />
                  </div>
               </ScrollArea>
            </div>
         )}

         {automationId && (
            <AutomationActivityPanel automationId={automationId} />
         )}
      </div>
   );
}

export function AutomationBuilder(props: AutomationBuilderProps) {
   return (
      <ReactFlowProvider>
         <AutomationBuilderContent {...props} />
      </ReactFlowProvider>
   );
}
