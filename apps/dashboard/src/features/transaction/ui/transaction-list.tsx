import type { RouterOutput } from "@packages/api/client";
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
import { Fragment, useMemo, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { useSheet } from "@/hooks/use-sheet";
import { useTransactionBulkActions } from "../lib/use-transaction-bulk-actions";
import { CategorizeForm } from "./categorize-form";
import { MarkAsTransferForm } from "./mark-as-transfer-form";
import { TransactionExpandedContent } from "./transaction-expanded-content";
import { TransactionFilterCredenza } from "./transaction-filter-credenza";
import { TransactionMobileCard } from "./transaction-mobile-card";
import { createTransactionColumns } from "./transaction-table-columns";

export type Transaction =
   RouterOutput["transactions"]["getAllPaginated"]["transactions"][number];

export type Category = {
   id: string;
   name: string;
   color: string;
   icon: string | null;
};

export type BankAccount = {
   id: string;
   name: string | null;
   bank: string;
};

type TransactionListProps = {
   transactions: Transaction[];
   categories: Category[];
   bankAccounts?: BankAccount[];
   pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      pageSize: number;
      onPageChange: (page: number) => void;
      onPageSizeChange?: (size: number) => void;
   };
   filters: {
      searchTerm: string;
      onSearchChange: (value: string) => void;
      typeFilter: string;
      onTypeFilterChange: (value: string) => void;
      categoryFilter: string;
      onCategoryFilterChange: (value: string) => void;
      bankAccountFilter?: string;
      onBankAccountFilterChange?: (value: string) => void;
      onClearFilters: () => void;
   };
   bankAccountId?: string;
   showTypeToggle?: boolean;
   emptyStateTitle?: string;
   emptyStateDescription?: string;
};

export function TransactionListSkeleton() {
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

export function TransactionList({
   transactions,
   categories,
   bankAccounts = [],
   pagination,
   filters,
   bankAccountId,
   showTypeToggle = true,
   emptyStateTitle,
   emptyStateDescription,
}: TransactionListProps) {
   const isMobile = useIsMobile();
   const { activeOrganization } = useActiveOrganization();
   const { openCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
   const { openSheet } = useSheet();
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

   const { deleteSelected } = useTransactionBulkActions({
      bankAccountId,
      onSuccess: () => {
         setRowSelection({});
      },
   });

   const hasActiveFilters =
      filters.searchTerm ||
      (filters.typeFilter !== "" && filters.typeFilter !== "all") ||
      filters.categoryFilter !== "all" ||
      (filters.bankAccountFilter && filters.bankAccountFilter !== "all");

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
                        {emptyStateTitle ??
                           translate(
                              "dashboard.routes.transactions.list-section.state.empty.title",
                           )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {emptyStateDescription ??
                           translate(
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
                        onChange={(e) => filters.onSearchChange(e.target.value)}
                        placeholder={translate(
                           "common.form.search.placeholder",
                        )}
                        value={filters.searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>

                  {isMobile && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={() =>
                                 openCredenza({
                                    children: (
                                       <TransactionFilterCredenza
                                          bankAccountFilter={
                                             filters.bankAccountFilter
                                          }
                                          bankAccounts={bankAccounts}
                                          categories={categories}
                                          categoryFilter={
                                             filters.categoryFilter
                                          }
                                          onBankAccountFilterChange={
                                             filters.onBankAccountFilterChange
                                          }
                                          onCategoryFilterChange={
                                             filters.onCategoryFilterChange
                                          }
                                          onClearFilters={
                                             filters.onClearFilters
                                          }
                                          onTypeFilterChange={
                                             filters.onTypeFilterChange
                                          }
                                          typeFilter={filters.typeFilter}
                                       />
                                    ),
                                 })
                              }
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

               {!isMobile && showTypeToggle && (
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                           Tipo:
                        </span>
                        <ToggleGroup
                           onValueChange={filters.onTypeFilterChange}
                           size="sm"
                           spacing={2}
                           type="single"
                           value={filters.typeFilter}
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
                              onClick={filters.onClearFilters}
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
                        currentPage: pagination.currentPage,
                        onPageChange: pagination.onPageChange,
                        onPageSizeChange: pagination.onPageSizeChange,
                        pageSize: pagination.pageSize,
                        totalCount: pagination.totalCount,
                        totalPages: pagination.totalPages,
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
               onClick={() =>
                  openSheet({
                     children: (
                        <MarkAsTransferForm
                           onSuccess={() => setRowSelection({})}
                           transactions={selectedTransactions}
                        />
                     ),
                  })
               }
            >
               Transferência
            </SelectionActionButton>
            <SelectionActionButton
               icon={<FolderOpen className="size-3.5" />}
               onClick={() =>
                  openSheet({
                     children: (
                        <CategorizeForm
                           onSuccess={() => setRowSelection({})}
                           transactions={selectedTransactions}
                        />
                     ),
                  })
               }
            >
               Categorizar
            </SelectionActionButton>
            <SelectionActionButton
               icon={<Trash2 className="size-3.5" />}
               onClick={() =>
                  openAlertDialog({
                     actionLabel: translate(
                        "dashboard.routes.transactions.list-section.actions.delete",
                     ),
                     cancelLabel: translate("common.actions.cancel"),
                     description: translate(
                        "common.headers.delete-confirmation.description-bulk",
                        { count: selectedIds.length },
                     ),
                     onAction: () => deleteSelected(selectedIds),
                     title: translate(
                        "common.headers.delete-confirmation.title",
                     ),
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
