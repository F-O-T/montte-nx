import { translate } from "@packages/localization";
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
import { useTRPC } from "@/integrations/clients";

function TransactionsErrorFallback() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.details-section.transactions.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.details-section.transactions.description",
               )}
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

function TransactionsSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.details-section.transactions.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.details-section.transactions.description",
               )}
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

function TransactionsContent({ categoryId }: { categoryId: string }) {
   const [currentPage, setCurrentPage] = useState(1);
   const pageSize = 5;

   const trpc = useTRPC();

   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions(
         {
            categoryId,
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

   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.details-section.transactions.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.details-section.transactions.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {transactions.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                  No transactions found for this category.
               </div>
            ) : (
               <ItemGroup>
                  {transactions.map((transaction, index: number) => {
                     const transactionCategories =
                        transaction.transactionCategories || [];

                     const primaryCategory = transactionCategories[0]?.category;
                     const categoryColor = primaryCategory?.color || "#6b7280";
                     const categoryIcon = primaryCategory?.icon || "Wallet";

                     return (
                        <Fragment key={transaction.id}>
                           <Item>
                              <ItemMedia
                                 style={{
                                    backgroundColor: categoryColor,
                                 }}
                                 variant="icon"
                              >
                                 <IconDisplay
                                    iconName={categoryIcon as IconName}
                                    size={16}
                                 />
                              </ItemMedia>
                              <ItemContent>
                                 <ItemTitle className="truncate">
                                    {transaction.description}
                                 </ItemTitle>
                                 <ItemDescription>
                                    {new Date(
                                       transaction.date,
                                    ).toLocaleDateString()}
                                 </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                 <Badge
                                    variant={
                                       transaction.type === "income"
                                          ? "default"
                                          : "destructive"
                                    }
                                 >
                                    {transaction.type === "income" ? "+" : "-"}
                                    {new Intl.NumberFormat("pt-BR", {
                                       currency: "BRL",
                                       style: "currency",
                                    }).format(
                                       Math.abs(parseFloat(transaction.amount)),
                                    )}
                                 </Badge>
                              </ItemActions>
                           </Item>
                           {index !== transactions.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     );
                  })}
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

export function CategoryTransactions({ categoryId }: { categoryId: string }) {
   return (
      <ErrorBoundary FallbackComponent={TransactionsErrorFallback}>
         <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsContent categoryId={categoryId} />
         </Suspense>
      </ErrorBoundary>
   );
}
