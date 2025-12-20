import { Card, CardContent } from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
   SelectionActionBar,
   SelectionActionButton,
} from "@packages/ui/components/selection-action-bar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { Inbox, Search, Trash2 } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import type { ReportType } from "@packages/database/schemas/custom-reports";
import { useCustomReportList } from "../features/custom-report-list-context";
import { useDeleteManyCustomReports } from "../features/use-delete-many-custom-reports";
import {
   CustomReportExpandedContent,
   CustomReportMobileCard,
   createCustomReportColumns,
} from "./custom-reports-table-columns";

function CustomReportsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription:
                  "Falha ao carregar relatórios. Tente novamente mais tarde.",
               errorTitle: "Erro ao carregar relatórios",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function CustomReportsListSkeleton() {
   return (
      <Card>
         <CardContent className="pt-6 grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Skeleton className="h-9 w-full sm:max-w-md" />
               <Skeleton className="h-9 w-9" />
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`report-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                     </div>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
            <div className="flex items-center justify-end gap-2 pt-4">
               <Skeleton className="h-10 w-24" />
               <Skeleton className="h-10 w-10" />
               <Skeleton className="h-10 w-24" />
            </div>
         </CardContent>
      </Card>
   );
}

type CustomReportsListContentProps = {
   filterType?: ReportType;
};

function CustomReportsListContent({
   filterType,
}: CustomReportsListContentProps) {
   const trpc = useTRPC();
   const {
      searchTerm,
      setSearchTerm,
      typeFilter,
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
   } = useCustomReportList();

   const { activeOrganization } = useActiveOrganization();
   const { openAlertDialog } = useAlertDialog();
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

   const { deleteMany, isDeleting } = useDeleteManyCustomReports({
      onSuccess: () => setRowSelection({}),
   });

   const effectiveTypeFilter = filterType || typeFilter;

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm, setCurrentPage]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.customReports.getAllPaginated.queryOptions(
         {
            limit: pageSize,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
            type: effectiveTypeFilter,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { data: reports, totalPages, totalCount } = paginatedData;

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );

   const handleClearSelection = () => {
      setRowSelection({});
   };

   return (
      <>
         <Card>
            <CardContent className="pt-6 grid gap-4">
               <InputGroup className="max-w-md">
                  <InputGroupInput
                     onChange={(e) => setSearchTerm(e.target.value)}
                     placeholder="Buscar relatórios..."
                     value={searchTerm}
                  />
                  <InputGroupAddon>
                     <Search />
                  </InputGroupAddon>
               </InputGroup>

               {reports.length === 0 && totalCount === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>Nenhum relatório encontrado</EmptyTitle>
                        <EmptyDescription>
                           Crie seu primeiro relatório DRE para análise
                           financeira.
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createCustomReportColumns(
                        activeOrganization.slug,
                     )}
                     data={reports}
                     enableRowSelection
                     getRowId={(row) => row.id}
                     onRowSelectionChange={setRowSelection}
                     pagination={{
                        currentPage,
                        onPageChange: setCurrentPage,
                        onPageSizeChange: setPageSize,
                        pageSize,
                        totalCount,
                        totalPages,
                     }}
                     renderMobileCard={(props) => (
                        <CustomReportMobileCard {...props} />
                     )}
                     renderSubComponent={(props) => (
                        <CustomReportExpandedContent {...props} />
                     )}
                     rowSelection={rowSelection}
                  />
               )}
            </CardContent>
         </Card>

         <SelectionActionBar
            onClear={handleClearSelection}
            selectedCount={selectedIds.length}
         >
            <SelectionActionButton
               disabled={isDeleting}
               icon={<Trash2 className="size-3.5" />}
               onClick={() =>
                  openAlertDialog({
                     actionLabel: "Excluir",
                     cancelLabel: "Cancelar",
                     description: `Tem certeza que deseja excluir ${selectedIds.length} relatório(s)?`,
                     onAction: async () => {
                        await deleteMany(selectedIds);
                     },
                     title: "Excluir Relatórios",
                     variant: "destructive",
                  })
               }
               variant="destructive"
            >
               Excluir
            </SelectionActionButton>
         </SelectionActionBar>
      </>
   );
}

type CustomReportsListSectionProps = {
   filterType?: ReportType;
};

export function CustomReportsListSection({
   filterType,
}: CustomReportsListSectionProps) {
   return (
      <ErrorBoundary FallbackComponent={CustomReportsListErrorFallback}>
         <Suspense fallback={<CustomReportsListSkeleton />}>
            <CustomReportsListContent filterType={filterType} />
         </Suspense>
      </ErrorBoundary>
   );
}
