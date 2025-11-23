import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
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
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import { Filter, Search, Wallet } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { TransactionItem } from "@/features/transaction/ui/transaction-item";
import { trpc } from "@/integrations/clients";
import { FilterSheet } from "../features/filter-sheet";
import { useTransactionList } from "../features/transaction-list-context";

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
   const pageSize = 5;

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

   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions(
         {
            bankAccountId:
               bankAccountFilter === "all" ? undefined : bankAccountFilter,
            category: categoryFilter === "all" ? undefined : categoryFilter,
            limit: pageSize,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
            type:
               typeFilter === "all"
                  ? undefined
                  : (typeFilter as "income" | "expense" | "transfer"),
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { transactions, pagination } = data;
   const { totalPages } = pagination;

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: bankAccounts = [] } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters =
      categoryFilter !== "all" ||
      typeFilter !== "all" ||
      bankAccountFilter !== "all";

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
            </CardContent>
            {totalPages > 1 && (
               <CardFooter>
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
         </Card>
         <FilterSheet
            bankAccountFilter={bankAccountFilter}
            bankAccounts={bankAccounts}
            categories={categories}
            categoryFilter={categoryFilter}
            isOpen={isFilterSheetOpen}
            onBankAccountFilterChange={(value) => {
               setBankAccountFilter(value);
               handleFilterChange();
            }}
            onCategoryFilterChange={(value) => {
               setCategoryFilter(value);
               handleFilterChange();
            }}
            onOpenChange={setIsFilterSheetOpen}
            onTypeFilterChange={(value) => {
               setTypeFilter(value);
               handleFilterChange();
            }}
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
