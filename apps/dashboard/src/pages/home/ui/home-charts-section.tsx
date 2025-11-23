import { translate } from "@packages/localization";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { CashFlowChart } from "@/features/reports/ui/cash-flow-chart";
import { FinancialSummaryChart } from "@/features/reports/ui/financial-summary-chart";
import { PlannedVsActualChart } from "@/features/reports/ui/planned-vs-actual-chart";
import { trpc } from "@/integrations/clients";

function HomeChartsSectionErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4">
         {createErrorFallback({
            errorDescription:
               "Failed to load financial charts. Please try again later.",
            errorTitle: "Error loading charts",
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function HomeChartsSectionSkeleton() {
   return (
      <div className="grid gap-4">
         <Skeleton className="h-[260px] w-full" />
         <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[260px] w-full" />
            <Skeleton className="h-[260px] w-full" />
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

function HomeChartsSectionContent() {
   const { end: endDate, start: startDate } = getCurrentMonthDates();

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

   return (
      <div className="grid gap-4">
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

export function HomeChartsSection() {
   return (
      <ErrorBoundary FallbackComponent={HomeChartsSectionErrorFallback}>
         <Suspense fallback={<HomeChartsSectionSkeleton />}>
            <HomeChartsSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
