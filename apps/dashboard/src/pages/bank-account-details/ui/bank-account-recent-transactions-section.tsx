import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
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
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { TransactionItem } from "@/features/transaction/ui/transaction-item";
import { useTRPC } from "@/integrations/clients";

function RecentTransactionsErrorFallback() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
               Latest transactions for this account
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4 text-muted-foreground">
               Failed to load transactions
            </div>
         </CardContent>
      </Card>
   );
}

function RecentTransactionsSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
               Latest transactions for this account
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {[1, 2, 3].map((index) => (
                  <Fragment key={index}>
                     <Item>
                        <ItemMedia variant="icon">
                           <Skeleton className="size-8 rounded-sm" />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-3 w-32 mt-1" />
                        </ItemContent>
                        <ItemActions>
                           <Skeleton className="h-6 w-16" />
                        </ItemActions>
                     </Item>
                     {index !== 3 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function RecentTransactionsContent({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
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

   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
               Latest transactions for this account
            </CardDescription>
         </CardHeader>
         <CardContent>
            {transactions.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                  No transactions found for this account.
               </div>
            ) : (
               <ItemGroup>
                  {transactions.map((transaction: any, index: number) => (
                     <Fragment key={transaction.id}>
                        <TransactionItem
                           categories={categories}
                           transaction={transaction}
                        />
                        {index !== transactions.length - 1 && <ItemSeparator />}
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
