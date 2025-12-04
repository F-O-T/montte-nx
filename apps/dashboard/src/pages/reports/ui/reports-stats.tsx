import { translate } from "@packages/localization";
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
import { useTRPC } from "@/integrations/clients";
import { useReports } from "../features/reports-context";

function ReportsStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription: translate(
               "dashboard.routes.reports.errors.stats.description",
            ),
            errorTitle: translate(
               "dashboard.routes.reports.errors.stats.title",
            ),
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function ReportsStatsSkeleton() {
   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`stats-skeleton-${index}`}
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
                  <Skeleton className="h-10 w-20" />
               </CardContent>
            </Card>
         ))}
      </div>
   );
}

function ReportsStatsContent() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: summary } = useSuspenseQuery(
      trpc.reports.getFinancialSummary.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatsCard
            description={translate(
               "dashboard.routes.reports.financial-summary.total-income.description",
            )}
            title={translate(
               "dashboard.routes.reports.financial-summary.total-income.title",
            )}
            value={formatDecimalCurrency(summary.totalIncome)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.reports.financial-summary.total-expenses.description",
            )}
            title={translate(
               "dashboard.routes.reports.financial-summary.total-expenses.title",
            )}
            value={formatDecimalCurrency(summary.totalExpenses)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.reports.financial-summary.net-balance.description",
            )}
            title={translate(
               "dashboard.routes.reports.financial-summary.net-balance.title",
            )}
            value={formatDecimalCurrency(summary.netBalance)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.reports.financial-summary.transactions.description",
            )}
            title={translate(
               "dashboard.routes.reports.financial-summary.transactions.title",
            )}
            value={summary.totalTransactions}
         />
      </div>
   );
}

export function ReportsStats() {
   return (
      <ErrorBoundary FallbackComponent={ReportsStatsErrorFallback}>
         <Suspense fallback={<ReportsStatsSkeleton />}>
            <ReportsStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
