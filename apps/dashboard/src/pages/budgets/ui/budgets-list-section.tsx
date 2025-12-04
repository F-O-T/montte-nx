import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
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
import { formatDecimalCurrency } from "@packages/utils/money";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import {
   Check,
   CheckCircle,
   CircleDashed,
   Filter,
   Inbox,
   Search,
   Trash2,
   X,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { BudgetFilterSheet } from "../features/budget-filter-sheet";
import { useBudgetList } from "../features/budget-list-context";
import { useBudgetBulkActions } from "../features/use-budget-bulk-actions";
import {
   BudgetExpandedContent,
   BudgetMobileCard,
   createBudgetColumns,
} from "./budgets-table-columns";

function BudgetsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.budgets.list-section.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.budgets.list-section.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function BudgetsListSkeleton() {
   return (
      <Card>
         <CardContent className="pt-6 grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Skeleton className="h-9 w-full sm:max-w-md" />
               <Skeleton className="h-9 w-9" />
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-8 w-20" />
               <Skeleton className="h-8 w-20" />
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`budget-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded-lg" />
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

function BudgetsListContent() {
   const isMobile = useIsMobile();
   const { periodType } = useBudgetList();
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("");
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
   const [pageSize, setPageSize] = useState(10);
   const [orderBy, setOrderBy] = useState<
      "name" | "amount" | "createdAt" | "updatedAt"
   >("name");
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page when filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [statusFilter, periodType, pageSize]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.budgets.getAllPaginated.queryOptions(
         {
            isActive:
               statusFilter === "active"
                  ? true
                  : statusFilter === "inactive"
                    ? false
                    : undefined,
            limit: pageSize,
            orderBy,
            orderDirection,
            page: currentPage,
            periodType: periodType || undefined,
            search: debouncedSearchTerm || undefined,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { budgets, pagination } = paginatedData;
   const { totalPages, totalCount } = pagination;

   const hasActiveFilters = debouncedSearchTerm || statusFilter;

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );
   const selectedBudgets = budgets.filter((budget) =>
      selectedIds.includes(budget.id),
   );
   const selectedTotal = selectedBudgets.reduce(
      (sum, budget) => sum + parseFloat(budget.amount),
      0,
   );

   const { markAsActive, markAsInactive, deleteSelected, isLoading } =
      useBudgetBulkActions({
         onSuccess: () => setRowSelection({}),
      });

   const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
   const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleClearFilters = () => {
      setStatusFilter("");
      setSearchTerm("");
   };

   return (
      <>
         <Card>
            <CardContent className="pt-6 grid gap-4">
               <div className="flex gap-6">
                  <InputGroup className="flex-1 sm:max-w-md">
                     <InputGroupInput
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        onClick={() => setIsFilterSheetOpen(true)}
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
                           {translate(
                              "dashboard.routes.budgets.filters.status",
                           )}
                           :
                        </span>
                        <ToggleGroup
                           onValueChange={setStatusFilter}
                           size="sm"
                           spacing={2}
                           type="single"
                           value={statusFilter}
                           variant="outline"
                        >
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                              value="active"
                           >
                              <CheckCircle className="size-3.5" />
                              {translate(
                                 "dashboard.routes.budgets.status.active",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-muted-foreground data-[state=on]:text-muted-foreground"
                              value="inactive"
                           >
                              <CircleDashed className="size-3.5" />
                              {translate(
                                 "dashboard.routes.budgets.status.inactive",
                              )}
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
                              {translate("common.actions.clear-filters")}
                           </Button>
                        </>
                     )}
                  </div>
               )}

               {budgets.length === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.budgets.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {translate(
                              "dashboard.routes.budgets.list-section.state.empty.description",
                           )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createBudgetColumns()}
                     data={budgets}
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
                        <BudgetMobileCard {...props} />
                     )}
                     renderSubComponent={(props) => (
                        <BudgetExpandedContent {...props} />
                     )}
                     rowSelection={rowSelection}
                  />
               )}
            </CardContent>
         </Card>

         <SelectionActionBar
            onClear={handleClearSelection}
            selectedCount={selectedIds.length}
            summary={formatDecimalCurrency(selectedTotal)}
         >
            <SelectionActionButton
               disabled={isLoading}
               icon={<Check className="size-3.5" />}
               onClick={() => setIsActivateDialogOpen(true)}
            >
               {translate("dashboard.routes.budgets.bulk-actions.activate")}
            </SelectionActionButton>
            <SelectionActionButton
               disabled={isLoading}
               icon={<X className="size-3.5" />}
               onClick={() => setIsDeactivateDialogOpen(true)}
            >
               {translate("dashboard.routes.budgets.bulk-actions.deactivate")}
            </SelectionActionButton>
            <SelectionActionButton
               disabled={isLoading}
               icon={<Trash2 className="size-3.5" />}
               onClick={() => setIsDeleteDialogOpen(true)}
               variant="destructive"
            >
               {translate("dashboard.routes.budgets.bulk-actions.delete")}
            </SelectionActionButton>
         </SelectionActionBar>

         <AlertDialog
            onOpenChange={setIsActivateDialogOpen}
            open={isActivateDialogOpen}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.activate-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.activate-confirm-description",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>
                     {translate("common.actions.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => {
                        markAsActive(selectedIds);
                        setIsActivateDialogOpen(false);
                     }}
                  >
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.confirm",
                     )}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <AlertDialog
            onOpenChange={setIsDeactivateDialogOpen}
            open={isDeactivateDialogOpen}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.deactivate-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.deactivate-confirm-description",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>
                     {translate("common.actions.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => {
                        markAsInactive(selectedIds);
                        setIsDeactivateDialogOpen(false);
                     }}
                  >
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.confirm",
                     )}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <AlertDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.delete-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.budgets.bulk-actions.delete-confirm-description",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>
                     {translate("common.actions.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                     className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     onClick={() => {
                        deleteSelected(selectedIds);
                        setIsDeleteDialogOpen(false);
                     }}
                  >
                     {translate("dashboard.routes.budgets.bulk-actions.delete")}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <BudgetFilterSheet
            activeFilter={
               statusFilter === "active"
                  ? true
                  : statusFilter === "inactive"
                    ? false
                    : undefined
            }
            isOpen={isFilterSheetOpen}
            onActiveFilterChange={(value) => {
               if (value === true) setStatusFilter("active");
               else if (value === false) setStatusFilter("inactive");
               else setStatusFilter("");
            }}
            onOpenChange={setIsFilterSheetOpen}
            onOrderByChange={setOrderBy}
            onOrderDirectionChange={setOrderDirection}
            onPageSizeChange={setPageSize}
            orderBy={orderBy}
            orderDirection={orderDirection}
            pageSize={pageSize}
         />
      </>
   );
}

export function BudgetsListSection() {
   return (
      <ErrorBoundary FallbackComponent={BudgetsListErrorFallback}>
         <Suspense fallback={<BudgetsListSkeleton />}>
            <BudgetsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
