import type { RuleChangeType } from "@packages/database/schema";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { CollapsibleTrigger } from "@packages/ui/components/collapsible";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   ArrowLeft,
   ChevronDown,
   Clock,
   FileText,
   History,
   Pencil,
   Plus,
   RotateCcw,
   Trash2,
   User,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

type VersionHistoryViewProps = {
   automationId: string;
   onBackToEditor?: () => void;
};

type Version = {
   id: string;
   ruleId: string;
   version: number;
   snapshot: unknown;
   changeType: RuleChangeType;
   changedBy: string | null;
   changedAt: Date | string;
   diff: VersionDiffItem[] | null;
   changeDescription: string | null;
   changedByUser: {
      id: string;
      name: string | null;
      email: string;
   } | null;
};

type VersionDiffItem = {
   field: string;
   oldValue: unknown;
   newValue: unknown;
};

const CHANGE_TYPE_CONFIG: Record<
   RuleChangeType,
   { label: string; className: string; icon: typeof Plus }
> = {
   created: {
      className: "border-green-500 text-green-500",
      icon: Plus,
      label: "Criado",
   },
   deleted: {
      className: "border-red-500 text-red-500",
      icon: Trash2,
      label: "Excluído",
   },
   restored: {
      className: "border-amber-500 text-amber-500",
      icon: RotateCcw,
      label: "Restaurado",
   },
   updated: {
      className: "border-blue-500 text-blue-500",
      icon: Pencil,
      label: "Atualizado",
   },
};

const FIELD_LABELS: Record<string, string> = {
   actions: "Ações",
   category: "Categoria",
   conditions: "Condições",
   description: "Descrição",
   flowData: "Dados do Fluxo",
   isActive: "Status",
   metadata: "Metadados",
   name: "Nome",
   priority: "Prioridade",
   stopOnFirstMatch: "Parar na Primeira Correspondência",
   tags: "Tags",
   triggerConfig: "Configuração do Gatilho",
   triggerType: "Tipo do Gatilho",
};

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
   }).format(new Date(date));
}

function formatValue(value: unknown): string {
   if (value === null || value === undefined) return "null";
   if (typeof value === "boolean") return value ? "Sim" : "Não";
   if (typeof value === "object") {
      if (Array.isArray(value)) return `[${value.length} itens]`;
      return JSON.stringify(value, null, 2);
   }
   return String(value);
}

function createVersionColumns(): ColumnDef<Version>[] {
   return [
      {
         accessorKey: "version",
         cell: ({ row }) => {
            const version = row.original;
            return (
               <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                     <History className="size-4" />
                  </div>
                  <span className="font-mono font-medium">
                     v{version.version}
                  </span>
               </div>
            );
         },
         header: "Versão",
      },
      {
         accessorKey: "changeType",
         cell: ({ row }) => {
            const changeType = row.original.changeType;
            const config = CHANGE_TYPE_CONFIG[changeType];
            const Icon = config.icon;
            return (
               <Badge
                  className={cn("gap-1", config.className)}
                  variant="outline"
               >
                  <Icon className="size-3" />
                  {config.label}
               </Badge>
            );
         },
         header: "Tipo",
      },
      {
         accessorKey: "changedByUser",
         cell: ({ row }) => {
            const user = row.original.changedByUser;
            return (
               <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">
                     {user?.name || user?.email || "Sistema"}
                  </span>
               </div>
            );
         },
         header: "Alterado por",
      },
      {
         accessorKey: "changedAt",
         cell: ({ row }) => {
            return (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  {formatDate(row.original.changedAt)}
               </div>
            );
         },
         header: "Data",
      },
      {
         accessorKey: "changeDescription",
         cell: ({ row }) => {
            const description = row.original.changeDescription;
            const diff = row.original.diff;
            if (description) {
               return <span className="text-sm">{description}</span>;
            }
            if (diff && diff.length > 0) {
               return (
                  <span className="text-sm text-muted-foreground">
                     {diff.length}{" "}
                     {diff.length === 1 ? "campo alterado" : "campos alterados"}
                  </span>
               );
            }
            return <span className="text-sm text-muted-foreground">-</span>;
         },
         header: "Descrição",
      },
   ];
}

function VersionExpandedContent({ row }: { row: Row<Version> }) {
   const version = row.original;
   const isMobile = useIsMobile();
   const diff = version.diff;

   if (!diff || diff.length === 0) {
      return (
         <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma alteração registrada para esta versão.
         </div>
      );
   }

   if (isMobile) {
      return (
         <div className="p-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
               Alterações
            </p>
            <div className="space-y-3">
               {diff.map((item, idx) => (
                  <div className="space-y-2" key={`${item.field}-${idx}`}>
                     <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                           {FIELD_LABELS[item.field] || item.field}
                        </span>
                     </div>
                     <div className="grid gap-2 pl-5">
                        <div className="rounded-md bg-red-500/10 p-2">
                           <p className="text-xs text-red-600 font-medium mb-1">
                              Antes:
                           </p>
                           <pre className="text-xs text-red-500 whitespace-pre-wrap break-all">
                              {formatValue(item.oldValue)}
                           </pre>
                        </div>
                        <div className="rounded-md bg-green-500/10 p-2">
                           <p className="text-xs text-green-600 font-medium mb-1">
                              Depois:
                           </p>
                           <pre className="text-xs text-green-500 whitespace-pre-wrap break-all">
                              {formatValue(item.newValue)}
                           </pre>
                        </div>
                     </div>
                     {idx < diff.length - 1 && <Separator />}
                  </div>
               ))}
            </div>
         </div>
      );
   }

   return (
      <div className="p-4">
         <p className="text-xs font-medium text-muted-foreground mb-3">
            Alterações
         </p>
         <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
               <thead className="bg-muted/50">
                  <tr>
                     <th className="text-left px-3 py-2 font-medium">Campo</th>
                     <th className="text-left px-3 py-2 font-medium">Antes</th>
                     <th className="text-left px-3 py-2 font-medium">Depois</th>
                  </tr>
               </thead>
               <tbody>
                  {diff.map((item, idx) => (
                     <tr
                        className={cn(idx % 2 === 0 && "bg-muted/20")}
                        key={`${item.field}-${idx}`}
                     >
                        <td className="px-3 py-2 font-medium">
                           {FIELD_LABELS[item.field] || item.field}
                        </td>
                        <td className="px-3 py-2">
                           <pre className="text-xs text-red-500 whitespace-pre-wrap break-all max-w-xs">
                              {formatValue(item.oldValue)}
                           </pre>
                        </td>
                        <td className="px-3 py-2">
                           <pre className="text-xs text-green-500 whitespace-pre-wrap break-all max-w-xs">
                              {formatValue(item.newValue)}
                           </pre>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}

function VersionMobileCard({
   row,
   isExpanded,
   toggleExpanded,
}: {
   row: Row<Version>;
   isExpanded: boolean;
   toggleExpanded: () => void;
}) {
   const version = row.original;
   const config = CHANGE_TYPE_CONFIG[version.changeType];
   const Icon = config.icon;
   const diff = version.diff;

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                  <History className="size-5" />
               </div>
               <div className="flex-1">
                  <CardTitle className="text-base font-mono">
                     Versão {version.version}
                  </CardTitle>
                  <CardDescription>
                     {formatDate(version.changedAt)}
                  </CardDescription>
               </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">
                  {version.changedByUser?.name ||
                     version.changedByUser?.email ||
                     "Sistema"}
               </span>
               <Badge
                  className={cn("gap-1", config.className)}
                  variant="outline"
               >
                  <Icon className="size-3" />
                  {config.label}
               </Badge>
            </div>
            {version.changeDescription && (
               <p className="text-sm text-muted-foreground">
                  {version.changeDescription}
               </p>
            )}
            {diff && diff.length > 0 && (
               <Badge variant="secondary">
                  {diff.length} {diff.length === 1 ? "alteração" : "alterações"}
               </Badge>
            )}
         </CardContent>
         <CardFooter>
            <CollapsibleTrigger asChild>
               <Button
                  className="w-full"
                  onClick={(e) => {
                     e.stopPropagation();
                     toggleExpanded();
                  }}
                  variant="outline"
               >
                  {isExpanded ? "Menos informações" : "Ver alterações"}
                  <ChevronDown
                     className={cn(
                        "size-4 transition-transform duration-200",
                        isExpanded && "rotate-180",
                     )}
                  />
               </Button>
            </CollapsibleTrigger>
         </CardFooter>
      </Card>
   );
}

function VersionHistoryHeader({
   totalCount,
   onBackToEditor,
}: {
   totalCount: number;
   onBackToEditor?: () => void;
}) {
   return (
      <div className="flex items-center justify-between gap-4 mb-4">
         <div className="flex items-center gap-3">
            <History className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Histórico de Versões</h2>
            <Badge variant="secondary">{totalCount}</Badge>
         </div>
         {onBackToEditor && (
            <Button onClick={onBackToEditor} variant="outline">
               <ArrowLeft className="size-4" />
               Voltar ao Editor
            </Button>
         )}
      </div>
   );
}

function VersionHistoryContent({
   automationId,
   onBackToEditor,
}: VersionHistoryViewProps) {
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   const { data } = useSuspenseQuery(
      trpc.automations.versions.getHistory.queryOptions({
         limit: pageSize,
         page: currentPage,
         ruleId: automationId,
      }),
   );

   const versions = data.versions as Version[];
   const { totalPages, totalCount } = data.pagination;

   return (
      <div className="p-4">
         <VersionHistoryHeader
            onBackToEditor={onBackToEditor}
            totalCount={totalCount}
         />

         {versions.length === 0 ? (
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <History className="size-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma versão encontrada</EmptyTitle>
                  <EmptyDescription>
                     O histórico de versões aparecerá aqui quando a automação
                     for modificada.
                  </EmptyDescription>
               </EmptyContent>
            </Empty>
         ) : (
            <DataTable
               columns={createVersionColumns()}
               data={versions}
               getRowId={(row) => row.id}
               pagination={{
                  currentPage,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: setPageSize,
                  pageSize,
                  totalCount,
                  totalPages,
               }}
               renderMobileCard={(props) => <VersionMobileCard {...props} />}
               renderSubComponent={(props) => (
                  <VersionExpandedContent {...props} />
               )}
            />
         )}
      </div>
   );
}

function VersionHistorySkeleton() {
   return (
      <div className="p-4">
         <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
               <Skeleton className="size-5 rounded" />
               <Skeleton className="h-6 w-40" />
               <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <Skeleton className="h-9 w-36" />
         </div>
         <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
               <Skeleton
                  className="h-16 w-full"
                  key={`version-skeleton-${i + 1}`}
               />
            ))}
         </div>
      </div>
   );
}

function VersionHistoryErrorFallback({
   error,
   resetErrorBoundary,
}: FallbackProps) {
   return (
      <div className="p-4">
         <Empty>
            <EmptyContent>
               <EmptyMedia variant="icon">
                  <History className="size-12 text-destructive" />
               </EmptyMedia>
               <EmptyTitle>Erro ao carregar histórico</EmptyTitle>
               <EmptyDescription>
                  {error.message ||
                     "Não foi possível carregar o histórico de versões."}
               </EmptyDescription>
               <Button
                  className="mt-4"
                  onClick={resetErrorBoundary}
                  variant="outline"
               >
                  Tentar novamente
               </Button>
            </EmptyContent>
         </Empty>
      </div>
   );
}

export function AutomationVersionHistoryView(props: VersionHistoryViewProps) {
   return (
      <div className="h-full w-full bg-background overflow-auto">
         <ErrorBoundary FallbackComponent={VersionHistoryErrorFallback}>
            <Suspense fallback={<VersionHistorySkeleton />}>
               <VersionHistoryContent {...props} />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
