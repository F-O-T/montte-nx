"use client";

import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   type ChartConfig,
   ChartContainer,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

   return (
      <div className="grid gap-4">
         <HomeCashFlowChart data={cashFlow} />
      </div>
   );
}

interface HomeCashFlowChartProps {
   data:
      | Array<{
           date: string;
           plannedIncome: number;
           plannedExpenses: number;
           actualIncome: number;
           actualExpenses: number;
        }>
      | undefined;
}

const homeCashFlowChartConfig: ChartConfig = {
   actualNet: {
      color: "var(--primary)",
      label: translate("common.charts.labels.actual-net"),
   },
   plannedNet: {
      color: "var(--secondary)",
      label: translate("common.charts.labels.planned-net"),
   },
};

function HomeCashFlowChart({ data }: HomeCashFlowChartProps) {
   const chartData = (data ?? []).map((item) => ({
      ...item,
      actualNet: item.actualIncome - item.actualExpenses,
      plannedNet: item.plannedIncome - item.plannedExpenses,
   }));

   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
               <CardTitle>
                  {translate(
                     "dashboard.routes.home.charts.financial-evolution.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.home.charts.financial-evolution.description",
                  )}
               </CardDescription>
            </div>
            <Badge variant="outline">Current month</Badge>
         </CardHeader>
         <CardContent>
            <ChartContainer
               className="h-[350px] w-full"
               config={homeCashFlowChartConfig}
            >
               <AreaChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     axisLine={false}
                     dataKey="date"
                     tickLine={false}
                     tickMargin={8}
                  />
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                     dataKey="plannedNet"
                     fill="var(--color-plannedNet)"
                     fillOpacity={0.6}
                     stroke="var(--color-plannedNet)"
                     type="monotone"
                  />
                  <Area
                     dataKey="actualNet"
                     fill="var(--color-actualNet)"
                     fillOpacity={0.6}
                     stroke="var(--color-actualNet)"
                     type="monotone"
                  />
               </AreaChart>
            </ChartContainer>
         </CardContent>
      </Card>
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
