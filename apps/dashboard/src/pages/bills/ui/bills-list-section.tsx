import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
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
import { keepPreviousData, useSuspenseQueries } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import {
   AlertCircle,
   CheckCircle2,
   Clock,
   Filter,
   Receipt,
   Search,
   Trash2,
   Wallet,
   X,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { BillFilterSheet } from "../features/bill-filter-sheet";
import { useBillList } from "../features/bill-list-context";
import { useBillBulkActions } from "../features/use-bill-bulk-actions";
import {
   BillExpandedContent,
   BillMobileCard,
   createBillColumns,
} from "./bills-table-columns";

type BillsListSectionProps = {
   type?: "payable" | "receivable";
};

function BillsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription:
                  "Failed to load bills. Please try again later.",
               errorTitle: "Error loading bills",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BillsListSkeleton() {
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
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`bill-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded" />
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

function BillsListContent({ type }: BillsListSectionProps) {
   const trpc = useTRPC();
   const isMobile = useIsMobile();
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
   const [pageSize, setPageSize] = useState(10);

   const {
      setCurrentFilterType,
      currentPage,
      setCurrentPage,
      searchTerm,
      setSearchTerm,
      categoryFilter,
      statusFilter,
      setStatusFilter,
      typeFilter,
      setTypeFilter,
      setIsFilterSheetOpen,
      startDate,
      endDate,
      setCategoryFilter,
      timePeriod,
      handleTimePeriodChange,
   } = useBillList();

   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm, setCurrentPage]);

   useEffect(() => {
      setCurrentFilterType(type);
   }, [type, setCurrentFilterType]);

   // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page when filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [statusFilter, typeFilter, pageSize, startDate, endDate]);

   const billType =
      type === "payable"
         ? "expense"
         : type === "receivable"
           ? "income"
           : undefined;

   const [billsQuery, categoriesQuery] = useSuspenseQueries({
      queries: [
         trpc.bills.getAllPaginated.queryOptions(
            {
               endDate: endDate?.toISOString(),
               limit: pageSize,
               month: undefined,
               orderBy: "dueDate",
               orderDirection: "asc",
               page: currentPage,
               search: debouncedSearchTerm || undefined,
               startDate: startDate?.toISOString(),
               type:
                  billType ??
                  (typeFilter !== "all"
                     ? (typeFilter as "income" | "expense")
                     : undefined),
            },
            {
               placeholderData: keepPreviousData,
            },
         ),
         trpc.categories.getAll.queryOptions(),
      ],
   });

   const { bills, pagination } = billsQuery.data;
   const { totalPages, totalCount } = pagination;
   const categories = categoriesQuery.data ?? [];

   const filteredBills = bills.filter((bill) => {
      const matchesCategory =
         categoryFilter === "all" || bill.categoryId === categoryFilter;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue =
         bill.dueDate && !bill.completionDate && new Date(bill.dueDate) < today;
      const isPending = !bill.completionDate && !isOverdue;

      let matchesStatus = true;
      if (statusFilter === "pending") {
         matchesStatus = isPending;
      } else if (statusFilter === "overdue") {
         matchesStatus = isOverdue;
      } else if (statusFilter === "completed") {
         matchesStatus = !!bill.completionDate;
      }

      return matchesCategory && matchesStatus;
   });

   const hasActiveFilters =
      debouncedSearchTerm ||
      categoryFilter !== "all" ||
      statusFilter !== "all" ||
      (typeFilter !== "all" && !type) ||
      (timePeriod !== "this-month" && timePeriod !== null);

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );
   const selectedBills = filteredBills.filter((bill) =>
      selectedIds.includes(bill.id),
   );
   const selectedTotal = selectedBills.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0,
   );

   const { completeSelected, deleteSelected, isLoading } = useBillBulkActions({
      onSuccess: () => setRowSelection({}),
   });

   const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleClearFilters = () => {
      setStatusFilter("all");
      setTypeFilter("all");
      setCategoryFilter("all");
      setSearchTerm("");
      handleTimePeriodChange("this-month");
   };

   const pendingSelectedBills = selectedBills.filter(
      (bill) => !bill.completionDate,
   );

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
                           Status:
                        </span>
                        <ToggleGroup
                           onValueChange={(value) =>
                              setStatusFilter(value || "all")
                           }
                           size="sm"
                           spacing={2}
                           type="single"
                           value={statusFilter === "all" ? "" : statusFilter}
                           variant="outline"
                        >
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-amber-500 data-[state=on]:text-amber-600"
                              value="pending"
                           >
                              <Clock className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bills.features.filter.items.status-pending",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-destructive data-[state=on]:text-destructive"
                              value="overdue"
                           >
                              <AlertCircle className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bills.features.filter.items.status-overdue",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                              value="completed"
                           >
                              <CheckCircle2 className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bills.features.filter.items.status-completed",
                              )}
                           </ToggleGroupItem>
                        </ToggleGroup>
                     </div>

                     {!type && (
                        <>
                           <div className="h-4 w-px bg-border" />

                           <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {translate(
                                    "dashboard.routes.bills.table.columns.type",
                                 )}
                                 :
                              </span>
                              <ToggleGroup
                                 onValueChange={(value) =>
                                    setTypeFilter(value || "all")
                                 }
                                 size="sm"
                                 spacing={2}
                                 type="single"
                                 value={typeFilter === "all" ? "" : typeFilter}
                                 variant="outline"
                              >
                                 <ToggleGroupItem
                                    className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-destructive data-[state=on]:text-destructive"
                                    value="expense"
                                 >
                                    {translate(
                                       "dashboard.routes.bills.features.filter.items.type-payable",
                                    )}
                                 </ToggleGroupItem>
                                 <ToggleGroupItem
                                    className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                                    value="income"
                                 >
                                    {translate(
                                       "dashboard.routes.bills.features.filter.items.type-receivable",
                                    )}
                                 </ToggleGroupItem>
                              </ToggleGroup>
                           </div>
                        </>
                     )}

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
                                 "dashboard.routes.bills.features.filter.actions.clear-filters",
                              )}
                           </Button>
                        </>
                     )}
                  </div>
               )}

               {filteredBills.length === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Receipt className="size-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.bills.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {hasActiveFilters
                              ? "Nenhuma conta encontrada com os filtros aplicados"
                              : translate(
                                   "dashboard.routes.bills.list-section.state.empty.description",
                                )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createBillColumns(categories)}
                     data={filteredBills as BillWithRelations[]}
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
                        <BillMobileCard {...props} categories={categories} />
                     )}
                     renderSubComponent={(props) => (
                        <BillExpandedContent
                           {...props}
                           categories={categories}
                        />
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
            {pendingSelectedBills.length > 0 && (
               <SelectionActionButton
                  disabled={isLoading}
                  icon={<Wallet className="size-3.5" />}
                  onClick={() => setIsCompleteDialogOpen(true)}
               >
                  {translate("dashboard.routes.bills.bulk-actions.complete")}
               </SelectionActionButton>
            )}
            <SelectionActionButton
               disabled={isLoading}
               icon={<Trash2 className="size-3.5" />}
               onClick={() => setIsDeleteDialogOpen(true)}
               variant="destructive"
            >
               {translate("dashboard.routes.bills.bulk-actions.delete")}
            </SelectionActionButton>
         </SelectionActionBar>

         <AlertDialog
            onOpenChange={setIsCompleteDialogOpen}
            open={isCompleteDialogOpen}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {translate(
                        "dashboard.routes.bills.bulk-actions.complete-confirm-title",
                        { count: pendingSelectedBills.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.bills.bulk-actions.complete-confirm-description",
                        { count: pendingSelectedBills.length },
                     )}
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>
                     {translate("common.actions.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => {
                        completeSelected(pendingSelectedBills.map((b) => b.id));
                        setIsCompleteDialogOpen(false);
                     }}
                  >
                     {translate("dashboard.routes.bills.bulk-actions.confirm")}
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
                        "dashboard.routes.bills.bulk-actions.delete-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.bills.bulk-actions.delete-confirm-description",
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
                     {translate("dashboard.routes.bills.bulk-actions.delete")}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <BillFilterSheet categories={categories} />
      </>
   );
}

export function BillsListSection({ type }: BillsListSectionProps) {
   return (
      <ErrorBoundary FallbackComponent={BillsListErrorFallback}>
         <Suspense fallback={<BillsListSkeleton />}>
            <BillsListContent type={type} />
         </Suspense>
      </ErrorBoundary>
   );
}
