import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
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
import {
   Item,
   ItemActions,
   ItemContent,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
} from "@packages/ui/components/item";
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQueries } from "@tanstack/react-query";
import { Filter, Plus, Search, Wallet } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";
import { TransactionItem } from "@/features/transaction/ui/transaction-item";
import { trpc } from "@/integrations/clients";
import { FilterSheet } from "../features/filter-sheet";
import { useTransactionList } from "../features/transaction-list-context";
import { createTransactionColumns } from "./transactions-table-columns";

function TransactionsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.transactions.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.transactions.list-section.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Failed to load transactions. Please try again later.",
               errorTitle: "Error loading transactions",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function TransactionsListSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.transactions.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.transactions.list-section.description",
               )}
            </CardDescription>
            <div className="flex items-center gap-3 pt-4">
               <div className="relative flex-1 max-w-md">
                  <Skeleton className="h-10 w-full" />
               </div>
               <Skeleton className="ml-auto h-10 w-10" />
            </div>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`transaction-skeleton-${index + 1}`}>
                     <Item>
                        <ItemMedia variant="icon">
                           <div className="size-8 rounded-sm border group relative">
                              <Skeleton className="size-8 rounded-sm" />
                              <Skeleton className="absolute -top-1 -right-1 size-4 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
                        </ItemContent>
                        <ItemActions>
                           <div className="text-right">
                              <Skeleton className="h-4 w-16 ml-auto mb-2" />
                           </div>
                           <Skeleton className="size-8" />
                        </ItemActions>
                     </Item>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
         </CardFooter>
      </Card>
   );
}

function TransactionsListContent() {
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState("");
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
   const [pageSize, setPageSize] = useState(5);
   const [startDate, setStartDate] = useState<Date | undefined>();
   const [endDate, setEndDate] = useState<Date | undefined>();

   const {
      categoryFilter,
      setCategoryFilter,
      typeFilter,
      setTypeFilter,
      bankAccountFilter,
      setBankAccountFilter,
   } = useTransactionList();

   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   const [transactionsQuery, categoriesQuery, bankAccountsQuery] =
      useSuspenseQueries({
         queries: [
            trpc.transactions.getAllPaginated.queryOptions({
               bankAccountId:
                  bankAccountFilter === "all" ? undefined : bankAccountFilter,
               category: categoryFilter === "all" ? undefined : categoryFilter,
               endDate: endDate?.toISOString(),
               limit: pageSize,
               page: currentPage,
               search: debouncedSearchTerm || undefined,
               startDate: startDate?.toISOString(),
               type:
                  typeFilter === "all"
                     ? undefined
                     : (typeFilter as "income" | "expense" | "transfer"),
            }),
            trpc.categories.getAll.queryOptions(),
            trpc.bankAccounts.getAll.queryOptions(),
         ],
      });

   const { transactions, pagination } = transactionsQuery.data;
   const { totalPages } = pagination;
   const categories = categoriesQuery.data ?? [];
   const bankAccounts = bankAccountsQuery.data ?? [];

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters =
      categoryFilter !== "all" ||
      typeFilter !== "all" ||
      bankAccountFilter !== "all" ||
      startDate !== undefined ||
      endDate !== undefined;

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.transactions.list-section.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.transactions.list-section.description",
                  )}
               </CardDescription>
               <CardAction className="hidden md:flex">
                  <Button
                     onClick={() => setIsTransactionSheetOpen(true)}
                     size="sm"
                  >
                     <Plus className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.transactions.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               </CardAction>
            </CardHeader>
            <CardContent className="grid gap-2">
               <div className="flex items-center justify-between gap-8">
                  <InputGroup>
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
                        <p>Filter transactions</p>
                     </TooltipContent>
                  </Tooltip>
               </div>

               {/* Mobile View - menor que md */}
               <div className="block md:hidden">
                  {transactions.length === 0 ? (
                     <Empty>
                        <EmptyContent>
                           <EmptyMedia variant="icon">
                              <Wallet />
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
                  ) : (
                     <ItemGroup>
                        {transactions.map((transaction, index) => (
                           <Fragment key={transaction.id}>
                              <TransactionItem
                                 categories={categories}
                                 transaction={transaction}
                              />
                              {index !== transactions.length - 1 && (
                                 <ItemSeparator />
                              )}
                           </Fragment>
                        ))}
                     </ItemGroup>
                  )}
               </div>

               {/* Desktop View - md ou maior */}
               <div className="hidden md:block">
                  {transactions.length === 0 ? (
                     <Empty>
                        <EmptyContent>
                           <EmptyMedia variant="icon">
                              <Wallet />
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
                  ) : (
                     <DataTable
                        columns={createTransactionColumns(categories)}
                        data={transactions}
                     />
                  )}
               </div>
            </CardContent>
            {/* Paginação Mobile */}
            {totalPages > 1 && (
               <CardFooter className="block md:hidden">
                  <Pagination>
                     <PaginationContent>
                        <PaginationItem>
                           <PaginationPrevious
                              className={
                                 currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : ""
                              }
                              href="#"
                              onClick={(e) => {
                                 e.preventDefault();
                                 setCurrentPage((prev) =>
                                    Math.max(1, prev - 1),
                                 );
                              }}
                           />
                        </PaginationItem>

                        {Array.from(
                           { length: Math.min(5, totalPages) },
                           (_, i: number): number => {
                              if (totalPages <= 5) {
                                 return i + 1;
                              } else if (currentPage <= 3) {
                                 return i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                 return totalPages - 4 + i;
                              } else {
                                 return currentPage - 2 + i;
                              }
                           },
                        ).map((pageNum) => (
                           <PaginationItem key={pageNum}>
                              <PaginationLink
                                 href="#"
                                 isActive={pageNum === currentPage}
                                 onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(pageNum);
                                 }}
                              >
                                 {pageNum}
                              </PaginationLink>
                           </PaginationItem>
                        ))}

                        <PaginationItem>
                           <PaginationNext
                              className={
                                 currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : ""
                              }
                              href="#"
                              onClick={(e) => {
                                 e.preventDefault();
                                 setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1),
                                 );
                              }}
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}

            {/* Paginação Desktop */}
            {totalPages > 1 && (
               <CardFooter className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                     Mostrando {transactions.length} de {pagination.totalCount}{" "}
                     transações
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                     <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {currentPage} de {totalPages}
                     </div>
                     <div className="flex items-center space-x-2">
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(1)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              Ir para primeira página
                           </span>
                           {"<<"}
                        </Button>
                        <Button
                           className="h-8 w-8 p-0"
                           disabled={currentPage === 1}
                           onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                           }
                           variant="outline"
                        >
                           <span className="sr-only">Página anterior</span>
                           {"<"}
                        </Button>
                        <Button
                           className="h-8 w-8 p-0"
                           disabled={currentPage === totalPages}
                           onClick={() =>
                              setCurrentPage((prev) =>
                                 Math.min(totalPages, prev + 1),
                              )
                           }
                           variant="outline"
                        >
                           <span className="sr-only">Próxima página</span>
                           {">"}
                        </Button>
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(totalPages)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              Ir para última página
                           </span>
                           {">>"}
                        </Button>
                     </div>
                  </div>
               </CardFooter>
            )}
         </Card>

         {/* Mobile Floating Action Button */}
         <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden"
            onClick={() => setIsTransactionSheetOpen(true)}
            size="icon"
         >
            <Plus className="size-6" />
         </Button>

         <ManageTransactionSheet
            onOpen={isTransactionSheetOpen}
            onOpenChange={setIsTransactionSheetOpen}
         />

         <FilterSheet
            bankAccountFilter={bankAccountFilter}
            bankAccounts={bankAccounts}
            categories={categories}
            categoryFilter={categoryFilter}
            endDate={endDate}
            isOpen={isFilterSheetOpen}
            onBankAccountFilterChange={(value) => {
               setBankAccountFilter(value);
               handleFilterChange();
            }}
            onCategoryFilterChange={(value) => {
               setCategoryFilter(value);
               handleFilterChange();
            }}
            onEndDateChange={(date) => {
               setEndDate(date);
               handleFilterChange();
            }}
            onOpenChange={setIsFilterSheetOpen}
            onPageSizeChange={(size) => {
               setPageSize(size);
               setCurrentPage(1);
            }}
            onStartDateChange={(date) => {
               setStartDate(date);
               handleFilterChange();
            }}
            onTypeFilterChange={(value) => {
               setTypeFilter(value);
               handleFilterChange();
            }}
            pageSize={pageSize}
            startDate={startDate}
            typeFilter={typeFilter}
         />
      </>
   );
}

export function TransactionsListSection() {
   return (
      <ErrorBoundary FallbackComponent={TransactionsListErrorFallback}>
         <Suspense fallback={<TransactionsListSkeleton />}>
            <TransactionsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
