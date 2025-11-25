import { translate } from "@packages/localization";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";

function HomeStatsSectionErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {createErrorFallback({
            errorDescription:
               "Failed to load financial summary. Please try again later.",
            errorTitle: "Error loading summary",
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function HomeStatsSectionSkeleton() {
   return (
      <div className="grid gap-4 md:grid-cols-4 ">
         {[1, 2, 3, 4].map((index) => (
            <Skeleton
               className="h-24 w-full"
               key={`home-stats-skeleton-${index + 1}`}
            />
         ))}
      </div>
   );
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

function HomeStatsSectionContent() {
   const { end: endDate, start: startDate } = getCurrentMonthDates();

   const { data: summary } = useSuspenseQuery(
      trpc.reports.getFinancialSummary.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const { data: performance } = useSuspenseQuery(
      trpc.reports.getPaymentPerformance.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <div className="grid gap-4 md:grid-cols-4 ">
         <StatsCard
            description={translate(
               "dashboard.routes.home.financial-summary.total-income.description",
            )}
            title={translate(
               "dashboard.routes.home.financial-summary.total-income.title",
            )}
            value={formatDecimalCurrency(summary.totalIncome)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.home.financial-summary.total-expenses.description",
            )}
            title={translate(
               "dashboard.routes.home.financial-summary.total-expenses.title",
            )}
            value={formatDecimalCurrency(summary.totalExpenses)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.home.financial-summary.net-balance.description",
            )}
            title={translate(
               "dashboard.routes.home.financial-summary.net-balance.title",
            )}
            value={formatDecimalCurrency(summary.netBalance)}
         />

         <StatsCard
            description={`${performance.paidOnTime + performance.paidLate} ${translate("dashboard.routes.home.financial-summary.payment-rate.description")} ${performance.totalBills} ${translate("dashboard.routes.home.financial-summary.payment-rate.bills-paid")}`}
            title={translate(
               "dashboard.routes.home.financial-summary.payment-rate.title",
            )}
            value={`${performance.paymentRate.toFixed(1)}%`}
         />
      </div>
   );
}

export function HomeStatsSection() {
   return (
      <ErrorBoundary FallbackComponent={HomeStatsSectionErrorFallback}>
         <Suspense fallback={<HomeStatsSectionSkeleton />}>
            <HomeStatsSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
