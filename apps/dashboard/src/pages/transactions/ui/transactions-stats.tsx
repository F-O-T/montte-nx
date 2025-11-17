import { StatsCard } from "@packages/ui/components/stats-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";

function TransactionsStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription:
               "Failed to load transactions stats. Please try again later.",
            errorTitle: "Error loading stats",
            retryText: "Retry",
         })(props)}
      </div>
   );
}

function TransactionsStatsSkeleton() {
   return (
      <div className="grid gap-4 h-min">
         {[1, 2, 3].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`stats-skeleton-card-${index + 1}`}
            >
               <CardHeader>
                  <CardTitle>
                     <Skeleton className="h-6 w-24" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-4 w-32" />
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <Skeleton className="h-10 w-16" />
               </CardContent>
            </Card>
         ))}
      </div>
   );
}

function TransactionsStatsContent() {
   const { data: stats } = useSuspenseQuery(
      trpc.transactions.getStats.queryOptions(),
   );

   return (
      <div className="grid gap-4 h-min">
         <StatsCard
            description="All transactions"
            title="Total Transactions"
            value={stats.totalTransactions}
         />
         <StatsCard
            description="This month"
            title="Total Income"
            value={`R$${stats.totalIncome.toFixed(2)}`}
         />
         <StatsCard
            description="This month"
            title="Total Expenses"
            value={`R$${stats.totalExpenses.toFixed(2)}`}
         />
      </div>
   );
}

export function TransactionsStats() {
   return (
      <ErrorBoundary FallbackComponent={TransactionsStatsErrorFallback}>
         <Suspense fallback={<TransactionsStatsSkeleton />}>
            <TransactionsStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}

