import type {
   Action,
   ConditionGroup,
   TriggerType,
} from "@packages/database/schema";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { flowDataToSchema, schemaToFlowData } from "../lib/flow-serialization";
import type { AutomationEdge, AutomationNode } from "../lib/types";
import { AutomationBuilder } from "./automation-builder";
import { AutomationSettingsForm } from "./automation-settings-form";

type AutomationSettings = {
   description: string;
   isActive: boolean;
   name: string;
   priority: number;
   stopOnFirstMatch: boolean;
   triggerType: TriggerType;
};

function AutomationDetailsSkeleton() {
   return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
         <Skeleton className="h-full w-full" />
      </div>
   );
}

function AutomationDetailsErrorFallback({
   error,
   resetErrorBoundary,
}: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">
               Erro ao carregar automação: {error.message}
            </p>
            <Button onClick={resetErrorBoundary}>Tentar novamente</Button>
         </CardContent>
      </Card>
   );
}

function AutomationDetailsContent({ automationId }: { automationId: string }) {
   const { activeOrganization } = useActiveOrganization();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { openSheet } = useSheet();

   const { data: automation } = useSuspenseQuery(
      trpc.automations.getById.queryOptions({ id: automationId }),
   );

   const [settings, setSettings] = useState<AutomationSettings>({
      description: automation.description || "",
      isActive: automation.isActive,
      name: automation.name,
      priority: automation.priority,
      stopOnFirstMatch: automation.stopOnFirstMatch ?? false,
      triggerType: automation.triggerType as TriggerType,
   });

   const initialFlowData = schemaToFlowData(
      automation.triggerType as TriggerType,
      automation.conditions as ConditionGroup[],
      automation.actions as Action[],
      automation.flowData as { nodes: unknown[]; edges: unknown[] } | null,
   );

   const [nodes, setNodes] = useState<AutomationNode[]>(initialFlowData.nodes);
   const [edges, setEdges] = useState<AutomationEdge[]>(initialFlowData.edges);

   const updateMutation = useMutation(
      trpc.automations.update.mutationOptions({
         onError: (error) => {
            toast.error(`Erro ao salvar: ${error.message}`);
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: [["automations"]],
            });
            toast.success("Automação salva com sucesso");
         },
      }),
   );

   const handleFlowChange = useCallback(
      (newNodes: AutomationNode[], newEdges: AutomationEdge[]) => {
         setNodes(newNodes);
         setEdges(newEdges);
      },
      [],
   );

   const handleSettingsChange = useCallback(
      (newSettings: Partial<AutomationSettings>) => {
         setSettings((prev) => ({ ...prev, ...newSettings }));
      },
      [],
   );

   const handleOpenSettings = useCallback(() => {
      openSheet({
         children: (
            <AutomationSettingsForm
               onSettingsChange={handleSettingsChange}
               settings={settings}
            />
         ),
      });
   }, [openSheet, settings, handleSettingsChange]);

   const handleSave = () => {
      if (!settings.name.trim()) {
         toast.error("Nome é obrigatório");
         handleOpenSettings();
         return;
      }

      const schemaData = flowDataToSchema(nodes, edges);

      if (schemaData.actions.length === 0) {
         toast.error("Adicione pelo menos uma ação à automação");
         return;
      }

      updateMutation.mutate({
         data: {
            actions: schemaData.actions as Action[],
            conditions: schemaData.conditions as ConditionGroup[],
            description: settings.description || null,
            flowData: {
               edges: edges as unknown[],
               nodes: nodes as unknown[],
            },
            isActive: settings.isActive,
            name: settings.name,
            priority: settings.priority,
            stopOnFirstMatch: settings.stopOnFirstMatch,
            triggerType: settings.triggerType,
         },
         id: automationId,
      });
   };

   return (
      <div className="relative -m-4 flex h-full flex-col">
         <div className="absolute left-4 top-4 z-10 flex gap-2">
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  to="/$slug/automations"
               >
                  <ArrowLeft className="size-4" />
                  Voltar
               </Link>
            </Button>
         </div>

         <div className="absolute right-4 top-4 z-10 flex gap-2">
            <Button onClick={handleOpenSettings} size="sm" variant="outline">
               <Settings className="size-4" />
               Configurações
            </Button>

            <Button
               disabled={updateMutation.isPending}
               onClick={handleSave}
               size="sm"
            >
               <Save className="size-4" />
               {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
         </div>

         <div className="relative flex-1">
            <AutomationBuilder
               automationId={automationId}
               initialEdges={edges}
               initialNodes={nodes}
               onChange={handleFlowChange}
            />
         </div>
      </div>
   );
}

export function AutomationDetailsPage() {
   const { automationId } = useParams({
      from: "/$slug/_dashboard/automations/$automationId",
   });

   return (
      <ErrorBoundary FallbackComponent={AutomationDetailsErrorFallback}>
         <Suspense fallback={<AutomationDetailsSkeleton />}>
            <AutomationDetailsContent automationId={automationId} />
         </Suspense>
      </ErrorBoundary>
   );
}
