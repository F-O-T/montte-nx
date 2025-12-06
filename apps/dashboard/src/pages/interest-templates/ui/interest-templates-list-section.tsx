import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
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
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import {
   ArrowDownAZ,
   ArrowUpAZ,
   Filter,
   Inbox,
   Search,
   Trash2,
   X,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { useTRPC } from "@/integrations/clients";
import { InterestTemplateFilterCredenza } from "../features/interest-template-filter-credenza";
import { useInterestTemplateList } from "../features/interest-template-list-context";
import { useInterestTemplateBulkActions } from "../features/use-interest-template-bulk-actions";
import {
   createInterestTemplateColumns,
   InterestTemplateExpandedContent,
   InterestTemplateMobileCard,
} from "./interest-templates-table-columns";

function InterestTemplatesListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.interest-templates.list-section.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.interest-templates.list-section.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function InterestTemplatesListSkeleton() {
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
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`interest-template-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded-sm" />
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

function InterestTemplatesListContent() {
   const trpc = useTRPC();
   const {
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
   } = useInterestTemplateList();

   const { activeOrganization } = useActiveOrganization();
   const isMobile = useIsMobile();
   const { openCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm, setCurrentPage]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.interestTemplates.getAllPaginated.queryOptions(
         {
            limit: pageSize,
            orderBy,
            orderDirection,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { templates, pagination } = paginatedData;
   const { totalPages, totalCount } = pagination;

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters =
      debouncedSearchTerm || orderBy !== "name" || orderDirection !== "asc";

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );

   const { deleteSelected, isLoading } = useInterestTemplateBulkActions({
      onSuccess: () => {
         setRowSelection({});
      },
   });

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleClearFilters = () => {
      setSearchTerm("");
      setOrderBy("name");
      setOrderDirection("asc");
   };

   return (
      <>
         <Card>
            <CardContent className="pt-6 grid gap-4">
               <div className="flex gap-6">
                  <InputGroup className="flex-1 sm:max-w-md">
                     <InputGroupInput
                        onChange={(e) => {
                           setSearchTerm(e.target.value);
                        }}
                        placeholder={translate(
                           "common.form.search.placeholder",
                        )}
                        value={searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>

                  {isMobile && (
                     <Button
                        onClick={() =>
                           openCredenza({
                              children: (
                                 <InterestTemplateFilterCredenza
                                    onOrderDirectionChange={(value) => {
                                       setOrderDirection(value);
                                       handleFilterChange();
                                    }}
                                    onPageSizeChange={(value) => {
                                       setPageSize(value);
                                       handleFilterChange();
                                    }}
                                    orderDirection={orderDirection}
                                    pageSize={pageSize}
                                 />
                              ),
                           })
                        }
                        size="icon"
                        variant="outline"
                     >
                        <Filter className="size-4" />
                     </Button>
                  )}
               </div>

               {!isMobile && (
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                           {translate("common.form.sort-by.label")}:
                        </span>
                        <ToggleGroup
                           onValueChange={(value) => {
                              if (value) {
                                 setOrderDirection(value as "asc" | "desc");
                                 handleFilterChange();
                              }
                           }}
                           size="sm"
                           spacing={2}
                           type="single"
                           value={orderDirection}
                           variant="outline"
                        >
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="asc"
                           >
                              <ArrowUpAZ className="size-3.5" />
                              A-Z
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="desc"
                           >
                              <ArrowDownAZ className="size-3.5" />
                              Z-A
                           </ToggleGroupItem>
                        </ToggleGroup>
                     </div>

                     {hasActiveFilters && (
                        <>
                           <div className="h-4 w-px bg-border" />
                           <Button
                              className="h-8 text-xs"
                              onClick={handleClearFilters}
                              size="sm"
                              variant="outline"
                           >
                              <X className="size-3" />
                              {translate(
                                 "dashboard.routes.interest-templates.features.filter.actions.clear-filters",
                              )}
                           </Button>
                        </>
                     )}
                  </div>
               )}

               {templates.length === 0 && pagination.totalCount === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.interest-templates.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {translate(
                              "dashboard.routes.interest-templates.list-section.state.empty.description",
                           )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createInterestTemplateColumns(
                        activeOrganization.slug,
                     )}
                     data={templates}
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
                        <InterestTemplateMobileCard {...props} />
                     )}
                     renderSubComponent={(props) => (
                        <InterestTemplateExpandedContent {...props} />
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
               disabled={isLoading}
               icon={<Trash2 className="size-3.5" />}
               onClick={() =>
                  openAlertDialog({
                     actionLabel: translate(
                        "dashboard.routes.interest-templates.bulk-actions.delete",
                     ),
                     cancelLabel: translate("common.actions.cancel"),
                     description: translate(
                        "dashboard.routes.interest-templates.bulk-actions.delete-confirm-description",
                        { count: selectedIds.length },
                     ),
                     onAction: () => deleteSelected(selectedIds),
                     title: translate(
                        "dashboard.routes.interest-templates.bulk-actions.delete-confirm-title",
                        { count: selectedIds.length },
                     ),
                     variant: "destructive",
                  })
               }
               variant="destructive"
            >
               {translate(
                  "dashboard.routes.interest-templates.bulk-actions.delete",
               )}
            </SelectionActionButton>
         </SelectionActionBar>
      </>
   );
}

export function InterestTemplatesListSection() {
   return (
      <ErrorBoundary FallbackComponent={InterestTemplatesListErrorFallback}>
         <Suspense fallback={<InterestTemplatesListSkeleton />}>
            <InterestTemplatesListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
