import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { FinancialSummaryChart } from "@/components/charts/financial-summary-chart";
import { PlannedVsActualChart } from "@/components/charts/planned-vs-actual-chart";
import { PeriodFilter } from "@/components/period-filter";
import { trpc } from "@/integrations/clients";

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
               <Skeleton className="h-32" key={i} />
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
   return { end, start };
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
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const { data: cashFlow } = useSuspenseQuery(
      trpc.reports.getCashFlow.queryOptions({
         endDate: endDate.toISOString(),
         groupBy: "day",
         startDate: startDate.toISOString(),
      }),
   );

   const { data: plannedVsActual } = useSuspenseQuery(
      trpc.reports.getPlannedVsActual.queryOptions({
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
               description={translate(
                  "dashboard.routes.home.financial-summary.total-income.description",
               )}
               title={translate(
                  "dashboard.routes.home.financial-summary.total-income.title",
               )}
               value={`R$ ${summary.totalIncome.toFixed(2)}`}
            />
            <StatsCard
               description={translate(
                  "dashboard.routes.home.financial-summary.total-expenses.description",
               )}
               title={translate(
                  "dashboard.routes.home.financial-summary.total-expenses.title",
               )}
               value={`R$ ${summary.totalExpenses.toFixed(2)}`}
            />
            <StatsCard
               description={translate(
                  "dashboard.routes.home.financial-summary.net-balance.description",
               )}
               title={translate(
                  "dashboard.routes.home.financial-summary.net-balance.title",
               )}
               value={`R$ ${summary.netBalance.toFixed(2)}`}
            />
            <StatsCard
               description={`${performance.paidOnTime + performance.paidLate} ${translate("dashboard.routes.home.financial-summary.payment-rate.description")} ${performance.totalBills} ${translate("dashboard.routes.home.financial-summary.payment-rate.bills-paid")}`}
               title={translate(
                  "dashboard.routes.home.financial-summary.payment-rate.title",
               )}
               value={`${performance.paymentRate.toFixed(1)}%`}
            />
         </div>

         <FinancialSummaryChart
            data={cashFlow}
            description={translate(
               "dashboard.routes.home.charts.financial-evolution.description",
            )}
            title={translate(
               "dashboard.routes.home.charts.financial-evolution.title",
            )}
         />

         <div className="grid gap-4 md:grid-cols-2">
            <CashFlowChart
               data={cashFlow}
               description={translate(
                  "dashboard.routes.home.charts.cash-flow.description",
               )}
               title={translate("dashboard.routes.home.charts.cash-flow.title")}
            />
            <PlannedVsActualChart
               data={plannedVsActual}
               description={translate(
                  "dashboard.routes.home.charts.planned-vs-actual.description",
               )}
               title={translate(
                  "dashboard.routes.home.charts.planned-vs-actual.title",
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
