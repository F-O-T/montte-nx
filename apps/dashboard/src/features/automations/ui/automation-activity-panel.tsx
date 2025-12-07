import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
   Activity,
   AlertTriangle,
   CheckCircle2,
   ChevronUp,
   SkipForward,
   XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/integrations/clients";

type AutomationActivityPanelProps = {
   automationId: string;
};

type ExecutionStatus = "success" | "partial" | "failed" | "skipped";

const STATUS_CONFIG: Record<
   ExecutionStatus,
   { color: string; icon: typeof CheckCircle2; label: string }
> = {
   failed: {
      color: "text-red-500",
      icon: XCircle,
      label: "Falhou",
   },
   partial: {
      color: "text-yellow-500",
      icon: AlertTriangle,
      label: "Parcial",
   },
   skipped: {
      color: "text-muted-foreground",
      icon: SkipForward,
      label: "Ignorado",
   },
   success: {
      color: "text-green-500",
      icon: CheckCircle2,
      label: "Sucesso",
   },
};

function formatTriggerEvent(triggerEvent: unknown): string {
   if (typeof triggerEvent === "object" && triggerEvent !== null) {
      return `${JSON.stringify(triggerEvent).slice(0, 100)}...`;
   }
   return `${String(triggerEvent)}...`;
}

export function AutomationActivityPanel({
   automationId,
}: AutomationActivityPanelProps) {
   const [isExpanded, setIsExpanded] = useState(false);
   const trpc = useTRPC();

   const { data: executionsData, isLoading } = useQuery({
      ...trpc.automations.logs.getByRuleId.queryOptions({
         limit: 20,
         page: 1,
         ruleId: automationId,
      }),
      enabled: isExpanded,
   });

   const executions = executionsData?.logs ?? [];

   return (
      <div
         className={cn(
            "absolute bottom-4 right-4 z-20 overflow-hidden rounded-lg border bg-background shadow-lg transition-all duration-300",
            isExpanded ? "h-[350px] w-[400px]" : "h-auto w-auto",
         )}
      >
         <Button
            className="flex w-full items-center justify-between gap-2 rounded-none border-b-0 px-4 py-2"
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
         >
            <div className="flex items-center gap-2">
               <Activity className="size-4" />
               <span className="text-sm font-medium">Atividade</span>
            </div>
            <ChevronUp
               className={cn(
                  "size-4 transition-transform",
                  !isExpanded && "rotate-180",
               )}
            />
         </Button>

         {isExpanded && (
            <ScrollArea className="h-[calc(100%-40px)]">
               <div className="p-4">
                  {isLoading ? (
                     <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <div className="space-y-2" key={i}>
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-12 w-full" />
                           </div>
                        ))}
                     </div>
                  ) : executions && executions.length > 0 ? (
                     <div className="space-y-3">
                        {executions.map((execution) => {
                           const status = execution.status as ExecutionStatus;
                           const config =
                              STATUS_CONFIG[status] ?? STATUS_CONFIG.skipped;
                           const Icon = config.icon;

                           return (
                              <div
                                 className="rounded-md border p-3"
                                 key={execution.id}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <Icon
                                          className={cn("size-4", config.color)}
                                       />
                                       <Badge variant="outline">
                                          {config.label}
                                       </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                       {formatDistanceToNow(
                                          new Date(execution.createdAt),
                                          {
                                             addSuffix: true,
                                             locale: ptBR,
                                          },
                                       )}
                                    </span>
                                 </div>

                                 {Boolean(execution.triggerEvent) && (
                                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                       {formatTriggerEvent(
                                          execution.triggerEvent,
                                       )}
                                    </p>
                                 )}

                                 {execution.errorMessage && (
                                    <p className="mt-2 text-xs text-red-500">
                                       {execution.errorMessage}
                                    </p>
                                 )}

                                 {execution.durationMs && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                       Tempo: {execution.durationMs}ms
                                    </p>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Activity className="size-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                           Nenhuma execução ainda
                        </p>
                        <p className="text-xs text-muted-foreground">
                           As execuções aparecerão aqui quando a automação for
                           acionada
                        </p>
                     </div>
                  )}
               </div>
            </ScrollArea>
         )}
      </div>
   );
}
