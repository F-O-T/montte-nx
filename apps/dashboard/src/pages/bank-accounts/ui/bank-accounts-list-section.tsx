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
   Building,
   Check,
   CheckCircle,
   CircleDashed,
   CreditCard,
   Filter,
   PiggyBank,
   Search,
   Trash2,
   TrendingUp,
   X,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import { BankAccountsFilterSheet } from "../features/bank-accounts-filter-sheet";
import { useBankAccountBulkActions } from "../features/use-bank-account-bulk-actions";
import {
   BankAccountExpandedContent,
   BankAccountMobileCard,
   createBankAccountColumns,
} from "./bank-accounts-table-columns";

function BankAccountsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription:
                  "Failed to load bank accounts. Please try again later.",
               errorTitle: "Error loading bank accounts",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BankAccountsListSkeleton() {
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
               <Skeleton className="h-8 w-28" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`bank-account-skeleton-${index + 1}`}>
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

type SortOption = "name" | "balance" | "createdAt" | "bank";

function BankAccountsListContent() {
   const isMobile = useIsMobile();
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("");
   const [typeFilter, setTypeFilter] = useState<string>("");
   const [sortBy, setSortBy] = useState<SortOption>("name");
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
   const [pageSize, setPageSize] = useState(10);

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);
   //TODO: achar uma forma melhor de fazer isso
   // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page when filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [statusFilter, typeFilter, pageSize]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.bankAccounts.getAllPaginated.queryOptions(
         {
            limit: pageSize,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
            status: statusFilter
               ? (statusFilter as "active" | "inactive")
               : undefined,
            type: typeFilter
               ? (typeFilter as "checking" | "savings" | "investment")
               : undefined,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { data: balances } = useSuspenseQuery(
      trpc.bankAccounts.getBalances.queryOptions(),
   );

   const accountStatsMap = useMemo(() => {
      const map: Record<
         string,
         { balance: number; income: number; expenses: number }
      > = {};
      for (const item of balances) {
         map[item.id] = {
            balance: item.balance,
            expenses: item.expenses,
            income: item.income,
         };
      }
      return map;
   }, [balances]);

   const { bankAccounts, pagination } = paginatedData;
   const { totalPages, totalCount } = pagination;

   const hasActiveFilters = debouncedSearchTerm || statusFilter || typeFilter;

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );
   const selectedAccounts = bankAccounts.filter((account) =>
      selectedIds.includes(account.id),
   );
   const selectedBalance = selectedAccounts.reduce((sum, account) => {
      const stats = accountStatsMap[account.id];
      return sum + (stats?.balance || 0);
   }, 0);

   const { markAsActive, markAsInactive, deleteSelected, isLoading } =
      useBankAccountBulkActions({
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
      setTypeFilter("");
      setSearchTerm("");
   };

   return (
      <>
         <Card>
            <CardContent className="pt-6 grid gap-4">
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
                                 "dashboard.routes.bank-accounts.status.active",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-muted-foreground data-[state=on]:text-muted-foreground"
                              value="inactive"
                           >
                              <CircleDashed className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bank-accounts.status.inactive",
                              )}
                           </ToggleGroupItem>
                        </ToggleGroup>
                     </div>

                     <div className="h-4 w-px bg-border" />

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
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="checking"
                           >
                              <CreditCard className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bank-accounts.types.checking",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="savings"
                           >
                              <PiggyBank className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bank-accounts.types.savings",
                              )}
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="investment"
                           >
                              <TrendingUp className="size-3.5" />
                              {translate(
                                 "dashboard.routes.bank-accounts.types.investment",
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
                              Limpar filtros
                           </Button>
                        </>
                     )}
                  </div>
               )}

               {bankAccounts.length === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Building className="size-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {hasActiveFilters
                              ? translate(
                                   "dashboard.routes.bank-accounts.list-section.state.empty.title",
                                )
                              : translate(
                                   "dashboard.routes.bank-accounts.list-section.state.empty.title",
                                )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {hasActiveFilters
                              ? "Nenhuma conta encontrada com os filtros aplicados"
                              : translate(
                                   "dashboard.routes.bank-accounts.list-section.state.empty.description",
                                )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createBankAccountColumns()}
                     data={bankAccounts}
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
                     renderMobileCard={(props) => {
                        const stats = accountStatsMap[
                           props.row.original.id
                        ] ?? {
                           balance: 0,
                           expenses: 0,
                           income: 0,
                        };
                        return (
                           <BankAccountMobileCard
                              {...props}
                              balance={stats.balance}
                              expenses={stats.expenses}
                              income={stats.income}
                           />
                        );
                     }}
                     renderSubComponent={(props) => {
                        const stats = accountStatsMap[
                           props.row.original.id
                        ] ?? {
                           balance: 0,
                           expenses: 0,
                           income: 0,
                        };
                        return (
                           <BankAccountExpandedContent
                              {...props}
                              balance={stats.balance}
                              expenses={stats.expenses}
                              income={stats.income}
                           />
                        );
                     }}
                     rowSelection={rowSelection}
                  />
               )}
            </CardContent>
         </Card>

         <SelectionActionBar
            onClear={handleClearSelection}
            selectedCount={selectedIds.length}
            summary={formatDecimalCurrency(selectedBalance)}
         >
            <SelectionActionButton
               disabled={isLoading}
               icon={<Check className="size-3.5" />}
               onClick={() => setIsActivateDialogOpen(true)}
            >
               {translate(
                  "dashboard.routes.bank-accounts.bulk-actions.activate",
               )}
            </SelectionActionButton>
            <SelectionActionButton
               disabled={isLoading}
               icon={<X className="size-3.5" />}
               onClick={() => setIsDeactivateDialogOpen(true)}
            >
               {translate(
                  "dashboard.routes.bank-accounts.bulk-actions.deactivate",
               )}
            </SelectionActionButton>
            <SelectionActionButton
               disabled={isLoading}
               icon={<Trash2 className="size-3.5" />}
               onClick={() => setIsDeleteDialogOpen(true)}
               variant="destructive"
            >
               {translate("dashboard.routes.bank-accounts.bulk-actions.delete")}
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
                        "dashboard.routes.bank-accounts.bulk-actions.activate-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.bank-accounts.bulk-actions.activate-confirm-description",
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
                        "dashboard.routes.bank-accounts.bulk-actions.confirm",
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
                        "dashboard.routes.bank-accounts.bulk-actions.deactivate-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.bank-accounts.bulk-actions.deactivate-confirm-description",
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
                        "dashboard.routes.bank-accounts.bulk-actions.confirm",
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
                        "dashboard.routes.bank-accounts.bulk-actions.delete-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.bank-accounts.bulk-actions.delete-confirm-description",
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
                     {translate(
                        "dashboard.routes.bank-accounts.bulk-actions.delete",
                     )}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <BankAccountsFilterSheet
            isOpen={isFilterSheetOpen}
            onClearFilters={handleClearFilters}
            onOpenChange={setIsFilterSheetOpen}
            onSortByChange={(value) => setSortBy(value as SortOption)}
            onStatusFilterChange={setStatusFilter}
            onTypeFilterChange={setTypeFilter}
            sortBy={sortBy}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
         />
      </>
   );
}

export function BankAccountsListSection() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountsListErrorFallback}>
         <Suspense fallback={<BankAccountsListSkeleton />}>
            <BankAccountsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
