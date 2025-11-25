import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";

function BankAccountsStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription:
               "Failed to load bank accounts stats. Please try again later.",
            errorTitle: "Error loading stats",
            retryText: "Retry",
         })(props)}
      </div>
   );
}

function BankAccountsStatsSkeleton() {
   return (
      <div className="grid grid-cols-2 gap-4 h-min">
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

function BankAccountsStatsContent() {
   const { data: stats } = useSuspenseQuery(
      trpc.bankAccounts.getStats.queryOptions(),
   );

   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-min">
         <StatsCard
            description="Saldo total em todas as contas"
            title="Saldo Total"
            value={formatDecimalCurrency(stats.totalBalance)}
         />
         <StatsCard
            description="Número total de contas bancárias"
            title="Total de Contas"
            value={stats.totalAccounts}
         />
         <StatsCard
            description="Contas bancárias ativas"
            title="Contas Ativas"
            value={stats.activeAccounts}
         />
      </div>
   );
}

export function BankAccountsStats() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountsStatsErrorFallback}>
         <Suspense fallback={<BankAccountsStatsSkeleton />}>
            <BankAccountsStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
