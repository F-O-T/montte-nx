import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { ZoomSlider } from "@packages/ui/components/zoom-slider";
import {
   Background,
   BackgroundVariant,
   type Connection,
   type NodeTypes,
   type OnEdgesChange,
   type OnNodesChange,
   Panel,
   ReactFlow,
   useReactFlow,
} from "@xyflow/react";
import {
   Bell,
   Building,
   Copy,
   FileText,
   FolderTree,
   GitBranch,
   Mail,
   Play,
   Plus,
   Settings,
   StopCircle,
   Tag,
   Trash2,
   Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { ActionType, TriggerType } from "@packages/database/schema";
import type { AutomationEdge, AutomationNode } from "../lib/types";
import { ActionNode } from "../nodes/action-node";
import { ConditionNode } from "../nodes/condition-node";
import { TriggerNode } from "../nodes/trigger-node";

const nodeTypes: NodeTypes = {
   action: ActionNode,
   condition: ConditionNode,
   trigger: TriggerNode,
};

type ContextMenuState = {
   type: "canvas" | "node";
   x: number;
   y: number;
   flowX: number;
   flowY: number;
   nodeId?: string;
};

type AutomationCanvasProps = {
   nodes: AutomationNode[];
   edges: AutomationEdge[];
   onNodesChange: OnNodesChange<AutomationNode>;
   onEdgesChange: OnEdgesChange<AutomationEdge>;
   onConnect: (connection: Connection) => void;
   onNodeSelect?: (nodeId: string | null) => void;
   onAddNode?: (
      type: "trigger" | "condition" | "action",
      data: {
         triggerType?: TriggerType;
         actionType?: ActionType;
         operator?: "AND" | "OR";
      },
      position: { x: number; y: number },
   ) => void;
   onDeleteNode?: (nodeId: string) => void;
   onDuplicateNode?: (nodeId: string) => void;
   readOnly?: boolean;
   hasTrigger?: boolean;
};

export function AutomationCanvas({
   nodes,
   edges,
   onNodesChange,
   onEdgesChange,
   onConnect,
   onNodeSelect,
   onAddNode,
   onDeleteNode,
   onDuplicateNode,
   readOnly = false,
   hasTrigger = false,
}: AutomationCanvasProps) {
   const { screenToFlowPosition } = useReactFlow();
   const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
      null,
   );
   const [menuOpen, setMenuOpen] = useState(false);

   useEffect(() => {
      if (contextMenu) {
         setMenuOpen(true);
      }
   }, [contextMenu]);

   const handleMenuOpenChange = useCallback((open: boolean) => {
      setMenuOpen(open);
      if (!open) {
         setContextMenu(null);
      }
   }, []);

   const handleNodeClick = useCallback(
      (event: React.MouseEvent, node: AutomationNode) => {
         event.stopPropagation();
         onNodeSelect?.(node.id);
      },
      [onNodeSelect],
   );

   const handlePaneClick = useCallback(() => {
      onNodeSelect?.(null);
      setContextMenu(null);
      setMenuOpen(false);
   }, [onNodeSelect]);

   const handlePaneContextMenu = useCallback(
      (event: React.MouseEvent) => {
         if (readOnly) return;
         event.preventDefault();

         const flowPosition = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
         });

         setContextMenu({
            flowX: flowPosition.x,
            flowY: flowPosition.y,
            type: "canvas",
            x: event.clientX,
            y: event.clientY,
         });
      },
      [readOnly, screenToFlowPosition],
   );

   const handleNodeContextMenu = useCallback(
      (event: React.MouseEvent, node: AutomationNode) => {
         if (readOnly) return;
         event.preventDefault();
         event.stopPropagation();

         const flowPosition = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
         });

         setContextMenu({
            flowX: flowPosition.x,
            flowY: flowPosition.y,
            nodeId: node.id,
            type: "node",
            x: event.clientX,
            y: event.clientY,
         });
      },
      [readOnly, screenToFlowPosition],
   );

   const handleAddNodeFromMenu = useCallback(
      (
         type: "trigger" | "condition" | "action",
         data: {
            triggerType?: TriggerType;
            actionType?: ActionType;
            operator?: "AND" | "OR";
         },
      ) => {
         if (contextMenu && onAddNode) {
            onAddNode(type, data, {
               x: contextMenu.flowX,
               y: contextMenu.flowY,
            });
         }
         setContextMenu(null);
         setMenuOpen(false);
      },
      [contextMenu, onAddNode],
   );

   const handleConfigureNode = useCallback(() => {
      if (contextMenu?.nodeId) {
         onNodeSelect?.(contextMenu.nodeId);
      }
      setContextMenu(null);
      setMenuOpen(false);
   }, [contextMenu, onNodeSelect]);

   const handleDeleteNode = useCallback(() => {
      if (contextMenu?.nodeId) {
         onDeleteNode?.(contextMenu.nodeId);
      }
      setContextMenu(null);
      setMenuOpen(false);
   }, [contextMenu, onDeleteNode]);

   const handleDuplicateNode = useCallback(() => {
      if (contextMenu?.nodeId) {
         onDuplicateNode?.(contextMenu.nodeId);
      }
      setContextMenu(null);
      setMenuOpen(false);
   }, [contextMenu, onDuplicateNode]);

   const defaultEdgeOptions = useMemo(
      () => ({
         animated: true,
         style: { strokeWidth: 2 },
      }),
      [],
   );

   const selectedNodeType = contextMenu?.nodeId
      ? nodes.find((n) => n.id === contextMenu.nodeId)?.type
      : null;

   return (
      <div className="relative size-full ">
         <ReactFlow
            className="bg-muted/30"
            defaultEdgeOptions={defaultEdgeOptions}
            deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
            edges={edges}
            elementsSelectable={!readOnly}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodes={nodes}
            nodesConnectable={!readOnly}
            nodesDraggable={!readOnly}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            onContextMenu={handlePaneContextMenu}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            onNodesChange={onNodesChange}
            onPaneClick={handlePaneClick}
         >
            <Background gap={16} size={1} variant={BackgroundVariant.Dots} />

            <ZoomSlider className="hidden md:flex" position="bottom-left" />

            {!nodes.length && !readOnly && (
               <Panel className="mt-20" position="top-center">
                  <div className="rounded-lg border bg-background p-6 text-center shadow-sm">
                     <div className="text-sm text-muted-foreground">
                        Clique com o botão direito para adicionar nós
                     </div>
                  </div>
               </Panel>
            )}
         </ReactFlow>

         <DropdownMenu onOpenChange={handleMenuOpenChange} open={menuOpen}>
            <DropdownMenuTrigger asChild>
               <div
                  className="pointer-events-none fixed size-0"
                  style={{
                     left: contextMenu?.x ?? 0,
                     top: contextMenu?.y ?? 0,
                  }}
               />
            </DropdownMenuTrigger>

            {contextMenu?.type === "canvas" ? (
               <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                     <Plus className="size-4" />
                     Adicionar Nó
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {!hasTrigger && (
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2">
                           <Zap className="size-4 text-yellow-500" />
                           Gatilho
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                           <DropdownMenuItem
                              onClick={() =>
                                 handleAddNodeFromMenu("trigger", {
                                    triggerType: "transaction.created",
                                 })
                              }
                           >
                              <Play className="mr-2 size-4" />
                              Transação Criada
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onClick={() =>
                                 handleAddNodeFromMenu("trigger", {
                                    triggerType: "transaction.updated",
                                 })
                              }
                           >
                              <FileText className="mr-2 size-4" />
                              Transação Atualizada
                           </DropdownMenuItem>
                        </DropdownMenuSubContent>
                     </DropdownMenuSub>
                  )}

                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <GitBranch className="size-4 text-blue-500" />
                        Condição
                     </DropdownMenuSubTrigger>
                     <DropdownMenuSubContent className="w-48">
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("condition", {
                                 operator: "AND",
                              })
                           }
                        >
                           <GitBranch className="mr-2 size-4" />E (todas devem
                           corresponder)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("condition", {
                                 operator: "OR",
                              })
                           }
                        >
                           <GitBranch className="mr-2 size-4" />
                           OU (qualquer pode corresponder)
                        </DropdownMenuItem>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <Play className="size-4 text-green-500" />
                        Ação
                     </DropdownMenuSubTrigger>
                     <DropdownMenuSubContent className="w-56">
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "set_category",
                              })
                           }
                        >
                           <FolderTree className="mr-2 size-4" />
                           Definir Categoria
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "add_tag",
                              })
                           }
                        >
                           <Tag className="mr-2 size-4" />
                           Adicionar Tag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "remove_tag",
                              })
                           }
                        >
                           <Tag className="mr-2 size-4" />
                           Remover Tag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "set_cost_center",
                              })
                           }
                        >
                           <Building className="mr-2 size-4" />
                           Definir Centro de Custo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "update_description",
                              })
                           }
                        >
                           <FileText className="mr-2 size-4" />
                           Atualizar Descrição
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "send_push_notification",
                              })
                           }
                        >
                           <Bell className="mr-2 size-4" />
                           Enviar Notificação Push
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "send_email",
                              })
                           }
                        >
                           <Mail className="mr-2 size-4" />
                           Enviar E-mail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "create_transaction",
                              })
                           }
                        >
                           <Plus className="mr-2 size-4" />
                           Criar Transação
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() =>
                              handleAddNodeFromMenu("action", {
                                 actionType: "stop_execution",
                              })
                           }
                        >
                           <StopCircle className="mr-2 size-4" />
                           Parar Execução
                        </DropdownMenuItem>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>
               </DropdownMenuContent>
            ) : (
               <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={handleConfigureNode}>
                     <Settings className="mr-2 size-4" />
                     Configurar
                  </DropdownMenuItem>
                  {selectedNodeType !== "trigger" && (
                     <DropdownMenuItem onClick={handleDuplicateNode}>
                        <Copy className="mr-2 size-4" />
                        Duplicar
                     </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                     className="text-destructive focus:text-destructive"
                     onClick={handleDeleteNode}
                  >
                     <Trash2 className="mr-2 size-4" />
                     Excluir
                  </DropdownMenuItem>
               </DropdownMenuContent>
            )}
         </DropdownMenu>
      </div>
   );
}
