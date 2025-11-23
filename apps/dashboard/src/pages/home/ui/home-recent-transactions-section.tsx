import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TransactionItem } from "@/features/transaction/ui/transaction-item";
import { trpc } from "@/integrations/clients";

function HomeRecentTransactionsErrorFallback() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="py-4 text-center text-muted-foreground">
               Failed to load transactions
            </div>
         </CardContent>
      </Card>
   );
}

function HomeRecentTransactionsSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {[1, 2, 3].map((index) => (
                  <Fragment key={index}>
                     <div className="flex items-center justify-between gap-4 py-2">
                        <Skeleton className="h-8 w-8 rounded-sm" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-40" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                     </div>
                     {index !== 3 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function HomeRecentTransactionsContent() {
   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions({
         limit: 5,
         orderBy: "date",
         orderDirection: "desc",
         page: 1,
      }),
   );

   const { transactions } = data;

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
         </CardHeader>
         <CardContent>
            {transactions.length === 0 ? (
               <div className="py-8 text-center text-muted-foreground">
                  No transactions yet for your account.
               </div>
            ) : (
               <ItemGroup>
                  {transactions.map((transaction, index) => (
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
      </Card>
   );
}

export function HomeRecentTransactionsSection() {
   return (
      <ErrorBoundary FallbackComponent={HomeRecentTransactionsErrorFallback}>
         <Suspense fallback={<HomeRecentTransactionsSkeleton />}>
            <HomeRecentTransactionsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
