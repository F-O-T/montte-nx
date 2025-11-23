import { trpc } from "@/integrations/clients";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { FinancialSummaryChart } from "@/components/charts/financial-summary-chart";
import { PlannedVsActualChart } from "@/components/charts/planned-vs-actual-chart";
import { PeriodFilter } from "@/components/period-filter";
import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@packages/ui/components/button";

function HomePageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription:
         "Failed to load financial overview. Please try again later.",
      errorTitle: "Error loading overview",
      retryText: "Retry",
   })(props);
}

function HomePageSkeleton() {
   return (
      <div className="space-y-6">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
               <Skeleton key={i} className="h-32" />
            ))}
         </div>
         <Skeleton className="h-[400px]" />
         <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
         </div>
      </div>
   );
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { start, end };
}

function HomePageContent() {
   const initialDates = getCurrentMonthDates();
   const [startDate, setStartDate] = useState<Date>(initialDates.start);
   const [endDate, setEndDate] = useState<Date>(initialDates.end);

   const handlePeriodChange = (start: Date, end: Date) => {
      setStartDate(start);
      setEndDate(end);
   };

   const { data: summary } = useSuspenseQuery(
      trpc.reports.getFinancialSummary.queryOptions({
         startDate: startDate.toISOString(),
         endDate: endDate.toISOString(),
      }),
   );

   const { data: cashFlow } = useSuspenseQuery(
      trpc.reports.getCashFlow.queryOptions({
         startDate: startDate.toISOString(),
         endDate: endDate.toISOString(),
         groupBy: "day",
      }),
   );

   const { data: plannedVsActual } = useSuspenseQuery(
      trpc.reports.getPlannedVsActual.queryOptions({
         startDate: startDate.toISOString(),
         endDate: endDate.toISOString(),
      }),
   );

   const { data: performance } = useSuspenseQuery(
      trpc.reports.getPaymentPerformance.queryOptions({
         startDate: startDate.toISOString(),
         endDate: endDate.toISOString(),
      }),
   );

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-3xl font-bold tracking-tight">
                  {translate("dashboard.routes.home.title")}
               </h2>
               <p className="text-muted-foreground">
                  {translate("dashboard.routes.home.description")}
               </p>
            </div>
            <Button asChild>
               <Link to="/reports">
                  {translate("dashboard.routes.home.view-detailed-reports")}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
               </Link>
            </Button>
         </div>

         <PeriodFilter onPeriodChange={handlePeriodChange} />

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
               title={translate(
                  "dashboard.routes.home.financial-summary.total-income.title",
               )}
               value={`R$ ${summary.totalIncome.toFixed(2)}`}
               description={translate(
                  "dashboard.routes.home.financial-summary.total-income.description",
               )}
            />
            <StatsCard
               title={translate(
                  "dashboard.routes.home.financial-summary.total-expenses.title",
               )}
               value={`R$ ${summary.totalExpenses.toFixed(2)}`}
               description={translate(
                  "dashboard.routes.home.financial-summary.total-expenses.description",
               )}
            />
            <StatsCard
               title={translate(
                  "dashboard.routes.home.financial-summary.net-balance.title",
               )}
               value={`R$ ${summary.netBalance.toFixed(2)}`}
               description={translate(
                  "dashboard.routes.home.financial-summary.net-balance.description",
               )}
            />
            <StatsCard
               title={translate(
                  "dashboard.routes.home.financial-summary.payment-rate.title",
               )}
               value={`${performance.paymentRate.toFixed(1)}%`}
               description={`${performance.paidOnTime + performance.paidLate} ${translate("dashboard.routes.home.financial-summary.payment-rate.description")} ${performance.totalBills} ${translate("dashboard.routes.home.financial-summary.payment-rate.bills-paid")}`}
            />
         </div>

         <FinancialSummaryChart
            data={cashFlow}
            title={translate(
               "dashboard.routes.home.charts.financial-evolution.title",
            )}
            description={translate(
               "dashboard.routes.home.charts.financial-evolution.description",
            )}
         />

         <div className="grid gap-4 md:grid-cols-2">
            <CashFlowChart
               data={cashFlow}
               title={translate("dashboard.routes.home.charts.cash-flow.title")}
               description={translate(
                  "dashboard.routes.home.charts.cash-flow.description",
               )}
            />
            <PlannedVsActualChart
               data={plannedVsActual}
               title={translate(
                  "dashboard.routes.home.charts.planned-vs-actual.title",
               )}
               description={translate(
                  "dashboard.routes.home.charts.planned-vs-actual.description",
               )}
            />
         </div>
      </div>
   );
}

export function HomePage() {
   return (
      <ErrorBoundary FallbackComponent={HomePageErrorFallback}>
         <Suspense fallback={<HomePageSkeleton />}>
            <HomePageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
