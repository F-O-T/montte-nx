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
   ChevronRight,
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
import { useCallback, useMemo, useRef, useState } from "react";
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

type MenuState = {
   type: "canvas" | "node";
   node?: AutomationNode;
   x: number;
   y: number;
   flowX: number;
   flowY: number;
} | null;

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
   const ref = useRef<HTMLDivElement>(null);
   const [menu, setMenu] = useState<MenuState>(null);
   const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

   const handleNodeClick = useCallback(
      (event: React.MouseEvent, node: AutomationNode) => {
         event.stopPropagation();
         onNodeSelect?.(node.id);
      },
      [onNodeSelect],
   );

   const handlePaneClick = useCallback(() => {
      onNodeSelect?.(null);
      setMenu(null);
      setOpenSubmenu(null);
   }, [onNodeSelect]);

   const handlePaneContextMenu = useCallback(
      (event: React.MouseEvent | MouseEvent) => {
         event.preventDefault();
         const flowPosition = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
         });
         setMenu({
            type: "canvas",
            x: event.clientX,
            y: event.clientY,
            flowX: flowPosition.x,
            flowY: flowPosition.y,
         });
         setOpenSubmenu(null);
      },
      [screenToFlowPosition],
   );

   const handleNodeContextMenu = useCallback(
      (event: React.MouseEvent, node: AutomationNode) => {
         event.preventDefault();
         const flowPosition = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
         });
         setMenu({
            type: "node",
            node,
            x: event.clientX,
            y: event.clientY,
            flowX: flowPosition.x,
            flowY: flowPosition.y,
         });
         setOpenSubmenu(null);
      },
      [screenToFlowPosition],
   );

   const handleAddNode = useCallback(
      (
         type: "trigger" | "condition" | "action",
         data: {
            triggerType?: TriggerType;
            actionType?: ActionType;
            operator?: "AND" | "OR";
         },
      ) => {
         if (menu) {
            onAddNode?.(type, data, { x: menu.flowX, y: menu.flowY });
         }
         setMenu(null);
         setOpenSubmenu(null);
      },
      [menu, onAddNode],
   );

   const handleConfigureNode = useCallback(() => {
      if (menu?.node) {
         onNodeSelect?.(menu.node.id);
      }
      setMenu(null);
   }, [menu, onNodeSelect]);

   const handleDeleteNode = useCallback(() => {
      if (menu?.node) {
         onDeleteNode?.(menu.node.id);
      }
      setMenu(null);
   }, [menu, onDeleteNode]);

   const handleDuplicateNode = useCallback(() => {
      if (menu?.node) {
         onDuplicateNode?.(menu.node.id);
      }
      setMenu(null);
   }, [menu, onDuplicateNode]);

   const defaultEdgeOptions = useMemo(
      () => ({
         animated: true,
         style: { strokeWidth: 2 },
      }),
      [],
   );

   const menuItemClass =
      "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground";
   const menuItemDestructiveClass =
      "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none text-destructive hover:bg-destructive/10 hover:text-destructive";
   const submenuTriggerClass =
      "flex cursor-default items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground";
   const separatorClass = "bg-border -mx-1 my-1 h-px";
   const labelClass = "px-2 py-1.5 text-sm font-medium flex items-center gap-2";

   if (readOnly) {
      return (
         <div className="relative size-full">
            <ReactFlow
               className="bg-muted/30"
               defaultEdgeOptions={defaultEdgeOptions}
               deleteKeyCode={null}
               edges={edges}
               elementsSelectable={false}
               fitView
               fitViewOptions={{ padding: 0.2 }}
               nodes={nodes}
               nodesConnectable={false}
               nodesDraggable={false}
               nodeTypes={nodeTypes}
               onConnect={onConnect}
               onEdgesChange={onEdgesChange}
               onNodesChange={onNodesChange}
            >
               <Background gap={16} size={1} variant={BackgroundVariant.Dots} />
               <ZoomSlider className="hidden md:flex" position="bottom-left" />
            </ReactFlow>
         </div>
      );
   }

   return (
      <div className="relative size-full" ref={ref}>
         <ReactFlow
            className="bg-muted/30"
            defaultEdgeOptions={defaultEdgeOptions}
            deleteKeyCode={["Backspace", "Delete"]}
            edges={edges}
            elementsSelectable
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodes={nodes}
            nodesConnectable
            nodesDraggable
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            onNodesChange={onNodesChange}
            onPaneClick={handlePaneClick}
            onPaneContextMenu={handlePaneContextMenu}
         >
            <Background gap={16} size={1} variant={BackgroundVariant.Dots} />

            <ZoomSlider className="hidden md:flex" position="bottom-left" />

            {!nodes.length && (
               <Panel className="mt-20" position="top-center">
                  <div className="rounded-lg border bg-background p-6 text-center shadow-sm">
                     <div className="text-sm text-muted-foreground">
                        Clique com o botão direito para adicionar nós
                     </div>
                  </div>
               </Panel>
            )}
         </ReactFlow>

         {menu && menu.type === "canvas" && (
            <div
               className="fixed z-50 min-w-[220px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
               style={{ top: menu.y, left: menu.x }}
            >
               <div className={labelClass}>
                  <Plus className="size-4" />
                  Adicionar Nó
               </div>
               <div className={separatorClass} />

               {!hasTrigger && (
                  <div
                     className="relative"
                     onMouseEnter={() => setOpenSubmenu("trigger")}
                     onMouseLeave={() => setOpenSubmenu(null)}
                  >
                     <div className={submenuTriggerClass}>
                        <span className="flex items-center gap-2">
                           <Zap className="size-4 text-yellow-500" />
                           Gatilho
                        </span>
                        <ChevronRight className="size-4" />
                     </div>
                     {openSubmenu === "trigger" && (
                        <div className="absolute left-full top-0 z-50 ml-1 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                           <div
                              className={menuItemClass}
                              onClick={() =>
                                 handleAddNode("trigger", {
                                    triggerType: "transaction.created",
                                 })
                              }
                           >
                              <Play className="size-4" />
                              Transação Criada
                           </div>
                           <div
                              className={menuItemClass}
                              onClick={() =>
                                 handleAddNode("trigger", {
                                    triggerType: "transaction.updated",
                                 })
                              }
                           >
                              <FileText className="size-4" />
                              Transação Atualizada
                           </div>
                        </div>
                     )}
                  </div>
               )}

               <div
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu("condition")}
                  onMouseLeave={() => setOpenSubmenu(null)}
               >
                  <div className={submenuTriggerClass}>
                     <span className="flex items-center gap-2">
                        <GitBranch className="size-4 text-blue-500" />
                        Condição
                     </span>
                     <ChevronRight className="size-4" />
                  </div>
                  {openSubmenu === "condition" && (
                     <div className="absolute left-full top-0 z-50 ml-1 min-w-[220px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("condition", { operator: "AND" })
                           }
                        >
                           <GitBranch className="size-4" />E (todas devem
                           corresponder)
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("condition", { operator: "OR" })
                           }
                        >
                           <GitBranch className="size-4" />
                           OU (qualquer pode corresponder)
                        </div>
                     </div>
                  )}
               </div>

               <div
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu("action")}
                  onMouseLeave={() => setOpenSubmenu(null)}
               >
                  <div className={submenuTriggerClass}>
                     <span className="flex items-center gap-2">
                        <Play className="size-4 text-green-500" />
                        Ação
                     </span>
                     <ChevronRight className="size-4" />
                  </div>
                  {openSubmenu === "action" && (
                     <div className="absolute left-full top-0 z-50 ml-1 min-w-[220px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "set_category",
                              })
                           }
                        >
                           <FolderTree className="size-4" />
                           Definir Categoria
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", { actionType: "add_tag" })
                           }
                        >
                           <Tag className="size-4" />
                           Adicionar Tag
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "remove_tag",
                              })
                           }
                        >
                           <Tag className="size-4" />
                           Remover Tag
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "set_cost_center",
                              })
                           }
                        >
                           <Building className="size-4" />
                           Definir Centro de Custo
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "update_description",
                              })
                           }
                        >
                           <FileText className="size-4" />
                           Atualizar Descrição
                        </div>
                        <div className={separatorClass} />
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "send_push_notification",
                              })
                           }
                        >
                           <Bell className="size-4" />
                           Enviar Notificação Push
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "send_email",
                              })
                           }
                        >
                           <Mail className="size-4" />
                           Enviar E-mail
                        </div>
                        <div className={separatorClass} />
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "create_transaction",
                              })
                           }
                        >
                           <Plus className="size-4" />
                           Criar Transação
                        </div>
                        <div
                           className={menuItemClass}
                           onClick={() =>
                              handleAddNode("action", {
                                 actionType: "stop_execution",
                              })
                           }
                        >
                           <StopCircle className="size-4" />
                           Parar Execução
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}

         {menu && menu.type === "node" && menu.node && (
            <div
               className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
               style={{ top: menu.y, left: menu.x }}
            >
               <div className={menuItemClass} onClick={handleConfigureNode}>
                  <Settings className="size-4" />
                  Configurar
               </div>
               {menu.node.type !== "trigger" && (
                  <div className={menuItemClass} onClick={handleDuplicateNode}>
                     <Copy className="size-4" />
                     Duplicar
                  </div>
               )}
               <div className={separatorClass} />
               <div
                  className={menuItemDestructiveClass}
                  onClick={handleDeleteNode}
               >
                  <Trash2 className="size-4" />
                  Excluir
               </div>
            </div>
         )}
      </div>
   );
}
