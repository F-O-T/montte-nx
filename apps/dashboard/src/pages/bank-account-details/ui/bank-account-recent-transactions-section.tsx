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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { formatDecimalCurrency } from "@packages/utils/money";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import {
   ArrowDownLeft,
   ArrowLeftRight,
   ArrowUpRight,
   Filter,
   FolderOpen,
   Search,
   Trash2,
   Wallet,
   X,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTransactionBulkActions } from "@/features/transaction/lib/use-transaction-bulk-actions";
import { CategorizeSheet } from "@/features/transaction/ui/categorize-sheet";
import { MarkAsTransferSheet } from "@/features/transaction/ui/mark-as-transfer-sheet";
import { TransactionExpandedContent } from "@/features/transaction/ui/transaction-expanded-content";
import { TransactionFilterSheet } from "@/features/transaction/ui/transaction-filter-sheet";
import { TransactionMobileCard } from "@/features/transaction/ui/transaction-mobile-card";
import { createTransactionColumns } from "@/features/transaction/ui/transaction-table-columns";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { trpc } from "@/integrations/clients";

function RecentTransactionsErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription:
                  "Falha ao carregar transações. Tente novamente mais tarde.",
               errorTitle: "Erro ao carregar transações",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function RecentTransactionsSkeleton() {
   return (
      <Card>
         <CardContent className="pt-6 grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Skeleton className="h-9 flex-1 sm:max-w-md" />
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-28" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`transaction-skeleton-${index + 1}`}>
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

function RecentTransactionsContent({
   bankAccountId,
   startDate,
   endDate,
}: {
   bankAccountId: string;
   startDate: Date | null;
   endDate: Date | null;
}) {
   const isMobile = useIsMobile();
   const { activeOrganization } = useActiveOrganization();
   const [currentPage, setCurrentPage] = useState(1);
   const pageSize = 10;
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const [isCategorizeOpen, setIsCategorizeOpen] = useState(false);
   const [isTransferOpen, setIsTransferOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState<string>("");

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
   }, [typeFilter, categoryFilter, startDate, endDate]);

   const { data } = useSuspenseQuery(
      trpc.bankAccounts.getTransactions.queryOptions(
         {
            categoryId: categoryFilter === "all" ? undefined : categoryFilter,
            endDate: endDate?.toISOString(),
            id: bankAccountId,
            limit: pageSize,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
            startDate: startDate?.toISOString(),
            type:
               typeFilter === ""
                  ? undefined
                  : (typeFilter as "income" | "expense" | "transfer"),
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { transactions, pagination } = data;
   const { totalPages, totalCount } = pagination;

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { deleteSelected, isLoading: isBulkActionLoading } =
      useTransactionBulkActions({
         bankAccountId,
         onSuccess: () => {
            setRowSelection({});
            setIsCategorizeOpen(false);
            setIsTransferOpen(false);
         },
      });

   const hasActiveFilters =
      debouncedSearchTerm || typeFilter !== "" || categoryFilter !== "all";

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );
   const selectedTransactions = transactions.filter((t) =>
      selectedIds.includes(t.id),
   );
   const selectedTotal = useMemo(() => {
      return selectedTransactions.reduce((sum, t) => {
         const amount = Number.parseFloat(t.amount);
         return t.type === "expense" ? sum - amount : sum + amount;
      }, 0);
   }, [selectedTransactions]);

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleClearFilters = () => {
      setTypeFilter("");
      setCategoryFilter("all");
      setSearchTerm("");
   };

   const handleBulkDelete = () => {
      deleteSelected(selectedIds);
      setIsDeleteDialogOpen(false);
   };

   const handleBulkChangeCategory = () => {
      setIsCategorizeOpen(true);
   };

   const handleBulkTransfer = () => {
      setIsTransferOpen(true);
   };

   if (transactions.length === 0 && !hasActiveFilters) {
      return (
         <Card>
            <CardContent className="pt-6">
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Wallet className="size-12 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.transactions.list-section.state.empty.title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.transactions.list-section.state.empty.description",
                        )}
                     </EmptyDescription>
                  </EmptyContent>
               </Empty>
            </CardContent>
         </Card>
      );
   }

   return (
      <>
         <Card>
            <CardContent className="space-y-4">
               <div className="flex flex-col sm:flex-row gap-3">
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
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={() => setIsFilterSheetOpen(true)}
                              size="icon"
                              variant={hasActiveFilters ? "default" : "outline"}
                           >
                              <Filter className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Filtrar transações</p>
                        </TooltipContent>
                     </Tooltip>
                  )}
               </div>

               {!isMobile && (
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                           Tipo:
                        </span>
                        <ToggleGroup
                           onValueChange={setTypeFilter}
                           size="sm"
                           spacing={2}
                           type="single"
                           value={typeFilter}
                           variant="outline"
                        >
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                              value="income"
                           >
                              <ArrowDownLeft className="size-3.5" />
                              {translate(
                                 "dashboard.routes.transactions.list-section.types.income",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-red-500 data-[state=on]:text-red-600"
                              value="expense"
                           >
                              <ArrowUpRight className="size-3.5" />
                              {translate(
                                 "dashboard.routes.transactions.list-section.types.expense",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-blue-500 data-[state=on]:text-blue-600"
                              value="transfer"
                           >
                              <ArrowLeftRight className="size-3.5" />
                              {translate(
                                 "dashboard.routes.transactions.list-section.types.transfer",
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

               {transactions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                     {translate(
                        "dashboard.routes.transactions.list-section.state.empty.title",
                     )}
                  </div>
               ) : (
                  <DataTable
                     columns={createTransactionColumns(
                        categories,
                        activeOrganization.slug,
                     )}
                     data={transactions}
                     enableRowSelection
                     getRowId={(row) => row.id}
                     onRowSelectionChange={setRowSelection}
                     pagination={{
                        currentPage,
                        onPageChange: setCurrentPage,
                        pageSize,
                        totalCount,
                        totalPages,
                     }}
                     renderMobileCard={(props) => (
                        <TransactionMobileCard
                           {...props}
                           categories={categories}
                        />
                     )}
                     renderSubComponent={(props) => (
                        <TransactionExpandedContent
                           {...props}
                           categories={categories}
                           slug={activeOrganization.slug}
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
            summary={formatDecimalCurrency(Math.abs(selectedTotal))}
         >
            <SelectionActionButton
               icon={<ArrowLeftRight className="size-3.5" />}
               onClick={handleBulkTransfer}
            >
               Transferência
            </SelectionActionButton>
            <SelectionActionButton
               icon={<FolderOpen className="size-3.5" />}
               onClick={handleBulkChangeCategory}
            >
               Categorizar
            </SelectionActionButton>
            <SelectionActionButton
               icon={<Trash2 className="size-3.5" />}
               onClick={() => setIsDeleteDialogOpen(true)}
               variant="destructive"
            >
               Excluir
            </SelectionActionButton>
         </SelectionActionBar>

         <AlertDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {translate("common.headers.delete-confirmation.title")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "common.headers.delete-confirmation.description-bulk",
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
                     disabled={isBulkActionLoading}
                     onClick={handleBulkDelete}
                  >
                     {translate(
                        "dashboard.routes.transactions.list-section.actions.delete",
                     )}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <TransactionFilterSheet
            categories={categories}
            categoryFilter={categoryFilter}
            isOpen={isFilterSheetOpen}
            onCategoryFilterChange={setCategoryFilter}
            onClearFilters={handleClearFilters}
            onOpenChange={setIsFilterSheetOpen}
            onTypeFilterChange={setTypeFilter}
            typeFilter={typeFilter}
         />

         <CategorizeSheet
            isOpen={isCategorizeOpen}
            onOpenChange={setIsCategorizeOpen}
            onSuccess={() => setRowSelection({})}
            transactions={selectedTransactions}
         />

         <MarkAsTransferSheet
            isOpen={isTransferOpen}
            onOpenChange={setIsTransferOpen}
            onSuccess={() => setRowSelection({})}
            transactions={selectedTransactions}
         />
      </>
   );
}

export function RecentTransactions({
   bankAccountId,
   startDate,
   endDate,
}: {
   bankAccountId: string;
   startDate: Date | null;
   endDate: Date | null;
}) {
   return (
      <ErrorBoundary FallbackComponent={RecentTransactionsErrorFallback}>
         <Suspense fallback={<RecentTransactionsSkeleton />}>
            <RecentTransactionsContent
               bankAccountId={bankAccountId}
               endDate={endDate}
               startDate={startDate}
            />
         </Suspense>
      </ErrorBoundary>
   );
}
