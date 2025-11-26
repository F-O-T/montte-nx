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
import { DataTable } from "@packages/ui/components/data-table";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
   type Transaction,
   TransactionItem,
} from "@/features/transaction/ui/transaction-item";
import { useTRPC } from "@/integrations/clients";
import { createTransactionColumns } from "@/pages/transactions/ui/transactions-table-columns";

function RecentTransactionsErrorFallback() {
   return (
      <Card className="w-full">
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
            <div className="text-center py-4 text-muted-foreground">
               {translate(
                  "dashboard.routes.transactions.list-section.state.empty.title",
               )}
            </div>
         </CardContent>
      </Card>
   );
}

function RecentTransactionsSkeleton() {
   return (
      <Card className="w-full">
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
            <div className="space-y-4">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function RecentTransactionsContent({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
   const isMobile = useIsMobile();
   const [currentPage, setCurrentPage] = useState(1);
   const pageSize = 10;

   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.bankAccounts.getTransactions.queryOptions(
         {
            id: bankAccountId,
            limit: pageSize,
            page: currentPage,
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

   const hasTransactions = transactions.length > 0;

   return (
      <Card className="w-full">
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
            {!hasTransactions ? (
               <div className="text-center py-8 text-muted-foreground">
                  {translate(
                     "dashboard.routes.transactions.list-section.state.empty.title",
                  )}
               </div>
            ) : isMobile ? (
               <ItemGroup>
                  {transactions.map(
                     (transaction: Transaction, index: number) => (
                        <Fragment key={transaction.id}>
                           <TransactionItem
                              categories={categories}
                              transaction={transaction}
                           />
                           {index !== transactions.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ),
                  )}
               </ItemGroup>
            ) : (
               <DataTable
                  columns={createTransactionColumns(categories)}
                  data={transactions}
               />
            )}
         </CardContent>

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
                              setCurrentPage((prev) => Math.max(1, prev - 1));
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

         {totalPages > 1 && (
            <CardFooter className="hidden md:flex md:items-center md:justify-between">
               <div className="text-sm text-muted-foreground">
                  {translate(
                     "dashboard.routes.transactions.list-section.showing",
                     {
                        count: transactions.length,
                        total: pagination.totalCount,
                     },
                  )}
               </div>
               <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                     {translate(
                        "dashboard.routes.transactions.list-section.page",
                        {
                           current: currentPage,
                           total: totalPages,
                        },
                     )}
                  </div>
                  <div className="flex items-center space-x-2">
                     <Button
                        className="hidden h-8 w-8 p-0 lg:flex"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        variant="outline"
                     >
                        <span className="sr-only">
                           {translate("common.actions.first-page")}
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
                        <span className="sr-only">
                           {translate("common.actions.previous-page")}
                        </span>
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
                        <span className="sr-only">
                           {translate("common.actions.next-page")}
                        </span>
                        {">"}
                     </Button>
                     <Button
                        className="hidden h-8 w-8 p-0 lg:flex"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        variant="outline"
                     >
                        <span className="sr-only">
                           {translate("common.actions.last-page")}
                        </span>
                        {">>"}
                     </Button>
                  </div>
               </div>
            </CardFooter>
         )}
      </Card>
   );
}

export function RecentTransactions({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={RecentTransactionsErrorFallback}>
         <Suspense fallback={<RecentTransactionsSkeleton />}>
            <RecentTransactionsContent bankAccountId={bankAccountId} />
         </Suspense>
      </ErrorBoundary>
   );
}
