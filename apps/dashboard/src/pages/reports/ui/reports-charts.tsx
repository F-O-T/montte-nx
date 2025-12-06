import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   type ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
} from "@packages/ui/components/chart";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { TabsContent } from "@packages/ui/components/tabs";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import {
   Area,
   AreaChart,
   Bar,
   BarChart,
   CartesianGrid,
   Cell,
   Label,
   Line,
   LineChart,
   Pie,
   PieChart,
   XAxis,
   YAxis,
} from "recharts";
import { useTRPC } from "@/integrations/clients";
import { useReports } from "../features/reports-context";

interface CustomTooltipProps {
   active?: boolean;
   payload?: Array<{
      name: string;
      value: number;
      payload: {
         name: string;
         value: number;
         fill: string;
         transactions?: number;
      };
   }>;
   total?: number;
   valueFormatter?: (value: number) => string;
   showPercentage?: boolean;
   showTransactions?: boolean;
}

function CustomTooltip({
   active,
   payload,
   total,
   valueFormatter = formatDecimalCurrency,
   showPercentage = false,
   showTransactions = false,
}: CustomTooltipProps) {
   if (!active || !payload?.length) return null;

   return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
         <div className="space-y-1.5">
            {payload.map((entry) => {
               const percentage =
                  showPercentage && total
                     ? ((entry.value / total) * 100).toFixed(1)
                     : null;

               const displayName = entry.payload.name || entry.name;

               return (
                  <div className="flex items-center gap-2" key={displayName}>
                     <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: entry.payload.fill }}
                     />
                     <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                           {displayName}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <span>{valueFormatter(entry.value)}</span>
                           {percentage && <span>({percentage}%)</span>}
                           {showTransactions && entry.payload.transactions && (
                              <span>
                                 - {entry.payload.transactions}{" "}
                                 {translate(
                                    "dashboard.routes.reports.category-details.transactions",
                                 )}
                              </span>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}

interface MonthlyTooltipProps {
   active?: boolean;
   payload?: Array<{
      name: string;
      value: number;
      color: string;
      dataKey: string;
   }>;
   label?: string;
   chartConfig: ChartConfig;
}

function MonthlyTooltip({
   active,
   payload,
   label,
   chartConfig,
}: MonthlyTooltipProps) {
   if (!active || !payload?.length) return null;

   const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

   return (
      <div className="rounded-lg border bg-background p-3 shadow-md min-w-[180px]">
         <p className="mb-2 font-medium text-foreground capitalize">{label}</p>
         <div className="space-y-1.5">
            {payload.map((entry) => {
               const config = chartConfig[entry.dataKey];
               const percentage =
                  total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;

               return (
                  <div
                     className="flex items-center justify-between gap-3"
                     key={entry.dataKey}
                  >
                     <div className="flex items-center gap-2">
                        <div
                           className="h-3 w-3 rounded-sm"
                           style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                           {config?.label || entry.name}
                        </span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">
                           {formatDecimalCurrency(entry.value)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                           ({percentage}%)
                        </span>
                     </div>
                  </div>
               );
            })}
         </div>
         <div className="mt-2 pt-2 border-t flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
               Total
            </span>
            <span className="text-sm font-bold text-foreground">
               {formatDecimalCurrency(total)}
            </span>
         </div>
      </div>
   );
}

function ReportsChartsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription: translate(
               "dashboard.routes.reports.errors.charts.description",
            ),
            errorTitle: translate(
               "dashboard.routes.reports.errors.charts.title",
            ),
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function ReportsChartsSkeleton() {
   return (
      <div className="space-y-4">
         <Skeleton className="h-10 w-96" />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((index) => (
               <Card key={`chart-skeleton-${index}`}>
                  <CardHeader>
                     <CardTitle>
                        <Skeleton className="h-6 w-32" />
                     </CardTitle>
                     <CardDescription>
                        <Skeleton className="h-4 w-48" />
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Skeleton className="h-64 w-full" />
                  </CardContent>
               </Card>
            ))}
         </div>
         <Card>
            <CardHeader>
               <CardTitle>
                  <Skeleton className="h-6 w-40" />
               </CardTitle>
               <CardDescription>
                  <Skeleton className="h-4 w-56" />
               </CardDescription>
            </CardHeader>
            <CardContent>
               <Skeleton className="h-80 w-full" />
            </CardContent>
         </Card>
      </div>
   );
}

interface PieChartData {
   name: string;
   value: number;
   fill: string;
}

interface ReportsPieChartProps {
   data: PieChartData[];
   title: string;
   description: string;
   total: number;
   totalLabel: string;
   emptyMessage: string;
}

function ReportsPieChart({
   data,
   title,
   description,
   total,
   totalLabel,
   emptyMessage,
}: ReportsPieChartProps) {
   const chartConfig = useMemo(() => {
      return data.reduce<ChartConfig>((acc, item) => {
         acc[item.name] = {
            color: item.fill,
            label: item.name,
         };
         return acc;
      }, {});
   }, [data]);

   const hasData = data.length > 0 && total > 0;

   return (
      <Card className="flex flex-col">
         <CardHeader className="items-center pb-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
         </CardHeader>
         <CardContent className="flex-1 pb-0">
            {hasData ? (
               <ChartContainer
                  className="mx-auto aspect-square max-h-[300px]"
                  config={chartConfig}
               >
                  <PieChart>
                     <ChartTooltip
                        content={
                           <CustomTooltip
                              showPercentage
                              total={total}
                              valueFormatter={formatDecimalCurrency}
                           />
                        }
                        cursor={false}
                     />
                     <Pie
                        data={data}
                        dataKey="value"
                        innerRadius={60}
                        nameKey="name"
                        strokeWidth={5}
                     >
                        {data.map((entry) => (
                           <Cell fill={entry.fill} key={entry.name} />
                        ))}
                        <Label
                           content={({ viewBox }) => {
                              if (
                                 viewBox &&
                                 "cx" in viewBox &&
                                 "cy" in viewBox
                              ) {
                                 return (
                                    <text
                                       dominantBaseline="middle"
                                       textAnchor="middle"
                                       x={viewBox.cx}
                                       y={viewBox.cy}
                                    >
                                       <tspan
                                          className="fill-foreground text-xl font-bold"
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                       >
                                          {formatDecimalCurrency(total)}
                                       </tspan>
                                       <tspan
                                          className="fill-muted-foreground text-xs"
                                          x={viewBox.cx}
                                          y={(viewBox.cy || 0) + 20}
                                       >
                                          {totalLabel}
                                       </tspan>
                                    </text>
                                 );
                              }
                           }}
                        />
                     </Pie>
                     <ChartLegend
                        className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        content={<ChartLegendContent nameKey="name" />}
                     />
                  </PieChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {emptyMessage}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function FinancialEvolutionChart() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: cashFlow } = useSuspenseQuery(
      trpc.reports.getCashFlow.queryOptions({
         endDate: endDate.toISOString(),
         groupBy: "day",
         startDate: startDate.toISOString(),
      }),
   );

   const chartConfig: ChartConfig = {
      actualExpenses: {
         color: "#ef4444",
         label: translate("common.charts.labels.expenses"),
      },
      actualIncome: {
         color: "#10b981",
         label: translate("common.charts.labels.income"),
      },
   };

   const hasData = cashFlow && cashFlow.length > 0;

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.reports.charts.financial-evolution.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.reports.charts.financial-evolution.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {hasData ? (
               <ChartContainer
                  className="h-[350px] w-full"
                  config={chartConfig}
               >
                  <AreaChart accessibilityLayer data={cashFlow}>
                     <CartesianGrid vertical={false} />
                     <XAxis
                        axisLine={false}
                        dataKey="date"
                        tickLine={false}
                        tickMargin={8}
                     />
                     <YAxis
                        axisLine={false}
                        tickFormatter={(value) => formatDecimalCurrency(value)}
                        tickLine={false}
                        tickMargin={8}
                     />
                     <ChartTooltip
                        content={<MonthlyTooltip chartConfig={chartConfig} />}
                     />
                     <ChartLegend content={<ChartLegendContent />} />
                     <Area
                        dataKey="actualIncome"
                        fill="var(--color-actualIncome)"
                        fillOpacity={0.6}
                        stackId="1"
                        stroke="var(--color-actualIncome)"
                        type="monotone"
                     />
                     <Area
                        dataKey="actualExpenses"
                        fill="var(--color-actualExpenses)"
                        fillOpacity={0.6}
                        stackId="2"
                        stroke="var(--color-actualExpenses)"
                        type="monotone"
                     />
                  </AreaChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[350px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {translate(
                        "dashboard.routes.reports.charts.income-breakdown.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function CashFlowAnalysisChart() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: cashFlow } = useSuspenseQuery(
      trpc.reports.getCashFlow.queryOptions({
         endDate: endDate.toISOString(),
         groupBy: "day",
         startDate: startDate.toISOString(),
      }),
   );

   const chartConfig: ChartConfig = {
      actualNet: {
         color: "#10b981",
         label: translate("common.charts.labels.actual-net"),
      },
      plannedNet: {
         color: "#3b82f6",
         label: translate("common.charts.labels.planned-net"),
      },
   };

   const chartData = useMemo(() => {
      return cashFlow.map((item) => ({
         ...item,
         actualNet: item.actualIncome - item.actualExpenses,
         plannedNet: item.plannedIncome - item.plannedExpenses,
      }));
   }, [cashFlow]);

   const hasData = chartData && chartData.length > 0;

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.reports.charts.cash-flow-analysis.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.reports.charts.cash-flow-analysis.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {hasData ? (
               <ChartContainer
                  className="h-[350px] w-full"
                  config={chartConfig}
               >
                  <LineChart accessibilityLayer data={chartData}>
                     <CartesianGrid vertical={false} />
                     <XAxis
                        axisLine={false}
                        dataKey="date"
                        tickLine={false}
                        tickMargin={8}
                     />
                     <YAxis
                        axisLine={false}
                        tickFormatter={(value) => formatDecimalCurrency(value)}
                        tickLine={false}
                        tickMargin={8}
                     />
                     <ChartTooltip
                        content={<MonthlyTooltip chartConfig={chartConfig} />}
                     />
                     <ChartLegend content={<ChartLegendContent />} />
                     <Line
                        dataKey="plannedNet"
                        dot={false}
                        stroke="var(--color-plannedNet)"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        type="monotone"
                     />
                     <Line
                        dataKey="actualNet"
                        dot={false}
                        stroke="var(--color-actualNet)"
                        strokeWidth={2}
                        type="monotone"
                     />
                  </LineChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[350px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {translate(
                        "dashboard.routes.reports.charts.income-breakdown.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function PlannedVsActualChart() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: plannedVsActual } = useSuspenseQuery(
      trpc.reports.getPlannedVsActual.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const chartConfig: ChartConfig = {
      Actual: {
         color: "#10b981",
         label: translate("common.charts.labels.actual"),
      },
      Planned: {
         color: "#3b82f6",
         label: translate("common.charts.labels.planned"),
      },
   };

   const chartData = [
      {
         Actual: plannedVsActual.actual.income,
         name: translate("common.charts.labels.income"),
         Planned: plannedVsActual.planned.income,
      },
      {
         Actual: plannedVsActual.actual.expenses,
         name: translate("common.charts.labels.expenses"),
         Planned: plannedVsActual.planned.expenses,
      },
      {
         Actual: plannedVsActual.actual.total,
         name: translate("common.charts.labels.net"),
         Planned: plannedVsActual.planned.total,
      },
   ];

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.reports.charts.budget-compliance.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.reports.charts.budget-compliance.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[300px] w-full" config={chartConfig}>
               <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     axisLine={false}
                     dataKey="name"
                     tickLine={false}
                     tickMargin={8}
                  />
                  <YAxis
                     axisLine={false}
                     tickFormatter={(value) => formatDecimalCurrency(value)}
                     tickLine={false}
                     tickMargin={8}
                  />
                  <ChartTooltip
                     content={<MonthlyTooltip chartConfig={chartConfig} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                     dataKey="Planned"
                     fill="var(--color-Planned)"
                     radius={4}
                  />
                  <Bar dataKey="Actual" fill="var(--color-Actual)" radius={4} />
               </BarChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}

function CategoryBreakdownCharts() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: categoryBreakdown } = useSuspenseQuery(
      trpc.reports.getCategoryBreakdown.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const { incomeData, expensesData, totalIncome, totalExpenses } =
      useMemo(() => {
         const colors = [
            "#10b981",
            "#3b82f6",
            "#f59e0b",
            "#8b5cf6",
            "#ec4899",
            "#06b6d4",
            "#84cc16",
            "#f97316",
         ];

         const incomeItems: PieChartData[] = categoryBreakdown
            .filter((item) => item.income > 0)
            .map((item, index) => ({
               fill: colors[index % colors.length] as string,
               name: item.category,
               value: item.income,
            }));

         const expenseItems: PieChartData[] = categoryBreakdown
            .filter((item) => item.expenses > 0)
            .map((item, index) => ({
               fill: colors[index % colors.length] as string,
               name: item.category,
               value: item.expenses,
            }));

         return {
            expensesData: expenseItems,
            incomeData: incomeItems,
            totalExpenses: expenseItems.reduce(
               (sum, item) => sum + item.value,
               0,
            ),
            totalIncome: incomeItems.reduce((sum, item) => sum + item.value, 0),
         };
      }, [categoryBreakdown]);

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <ReportsPieChart
            data={incomeData}
            description={translate(
               "dashboard.routes.reports.charts.income-breakdown.description",
            )}
            emptyMessage={translate(
               "dashboard.routes.reports.charts.income-breakdown.empty",
            )}
            title={translate(
               "dashboard.routes.reports.charts.income-breakdown.title",
            )}
            total={totalIncome}
            totalLabel={translate("common.charts.labels.income")}
         />
         <ReportsPieChart
            data={expensesData}
            description={translate(
               "dashboard.routes.reports.charts.expenses-breakdown.description",
            )}
            emptyMessage={translate(
               "dashboard.routes.reports.charts.expenses-breakdown.empty",
            )}
            title={translate(
               "dashboard.routes.reports.charts.expenses-breakdown.title",
            )}
            total={totalExpenses}
            totalLabel={translate("common.charts.labels.expenses")}
         />
      </div>
   );
}

function TopCategoriesChart() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: categoryBreakdown } = useSuspenseQuery(
      trpc.reports.getCategoryBreakdown.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const { chartData, chartConfig, hasData, total } = useMemo(() => {
      const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

      const topExpenses = categoryBreakdown
         .filter((cat) => cat.expenses > 0)
         .sort((a, b) => b.expenses - a.expenses)
         .slice(0, 5);

      if (topExpenses.length === 0) {
         return { chartConfig: {}, chartData: [], hasData: false, total: 0 };
      }

      const config: ChartConfig = {};
      let sum = 0;
      const data = topExpenses.map((cat, index) => {
         const color = colors[index % colors.length];
         config[cat.category] = {
            color,
            label: cat.category,
         };
         sum += cat.expenses;
         return {
            fill: color,
            name: cat.category,
            transactions: cat.transactionCount,
            value: cat.expenses,
         };
      });

      return {
         chartConfig: config,
         chartData: data,
         hasData: data.length > 0,
         total: sum,
      };
   }, [categoryBreakdown]);

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.reports.charts.category-overview.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.reports.charts.category-overview.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {hasData ? (
               <ChartContainer
                  className="h-[250px] w-full"
                  config={chartConfig}
               >
                  <BarChart
                     accessibilityLayer
                     data={chartData}
                     layout="vertical"
                     margin={{ left: 0 }}
                  >
                     <CartesianGrid horizontal={false} />
                     <YAxis
                        axisLine={false}
                        dataKey="name"
                        tickLine={false}
                        tickMargin={8}
                        type="category"
                        width={100}
                     />
                     <XAxis
                        axisLine={false}
                        tickFormatter={(value) => formatDecimalCurrency(value)}
                        tickLine={false}
                        type="number"
                     />
                     <ChartTooltip
                        content={
                           <CustomTooltip
                              showPercentage
                              showTransactions
                              total={total}
                              valueFormatter={formatDecimalCurrency}
                           />
                        }
                        cursor={false}
                     />
                     <Bar dataKey="value" radius={4}>
                        {chartData.map((entry) => (
                           <Cell fill={entry.fill} key={entry.name} />
                        ))}
                     </Bar>
                  </BarChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[250px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {translate(
                        "dashboard.routes.reports.charts.expenses-breakdown.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function PaymentStatusChart() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: performance } = useSuspenseQuery(
      trpc.reports.getPaymentPerformance.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const { chartData, chartConfig, total, hasData } = useMemo(() => {
      const paidOnTimeLabel = translate(
         "dashboard.routes.reports.payment-performance.paid-on-time",
      );
      const paidLateLabel = translate(
         "dashboard.routes.reports.payment-performance.paid-late",
      );
      const pendingLabel = translate(
         "dashboard.routes.reports.payment-performance.pending",
      );
      const overdueLabel = translate(
         "dashboard.routes.reports.payment-performance.overdue",
      );

      const data = [
         {
            fill: "#10b981",
            name: paidOnTimeLabel,
            value: performance.paidOnTime,
         },
         {
            fill: "#f59e0b",
            name: paidLateLabel,
            value: performance.paidLate,
         },
         {
            fill: "#3b82f6",
            name: pendingLabel,
            value: performance.pending,
         },
         {
            fill: "#ef4444",
            name: overdueLabel,
            value: performance.overdue,
         },
      ].filter((item) => item.value > 0);

      const config: ChartConfig = {
         [paidOnTimeLabel]: {
            color: "#10b981",
            label: paidOnTimeLabel,
         },
         [paidLateLabel]: {
            color: "#f59e0b",
            label: paidLateLabel,
         },
         [pendingLabel]: {
            color: "#3b82f6",
            label: pendingLabel,
         },
         [overdueLabel]: {
            color: "#ef4444",
            label: overdueLabel,
         },
      };

      const sum = performance.totalBills;

      return {
         chartConfig: config,
         chartData: data,
         hasData: sum > 0,
         total: sum,
      };
   }, [performance]);

   return (
      <Card className="flex flex-col">
         <CardHeader className="items-center pb-0">
            <CardTitle>
               {translate(
                  "dashboard.routes.reports.charts.payment-status-distribution.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.reports.charts.payment-status-distribution.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-1 pb-0">
            {hasData ? (
               <ChartContainer
                  className="mx-auto aspect-square max-h-[300px]"
                  config={chartConfig}
               >
                  <PieChart>
                     <ChartTooltip
                        content={
                           <CustomTooltip
                              showPercentage
                              total={total}
                              valueFormatter={(value) => `${value}`}
                           />
                        }
                        cursor={false}
                     />
                     <Pie
                        data={chartData}
                        dataKey="value"
                        innerRadius={60}
                        nameKey="name"
                        strokeWidth={5}
                     >
                        {chartData.map((entry) => (
                           <Cell fill={entry.fill} key={entry.name} />
                        ))}
                        <Label
                           content={({ viewBox }) => {
                              if (
                                 viewBox &&
                                 "cx" in viewBox &&
                                 "cy" in viewBox
                              ) {
                                 return (
                                    <text
                                       dominantBaseline="middle"
                                       textAnchor="middle"
                                       x={viewBox.cx}
                                       y={viewBox.cy}
                                    >
                                       <tspan
                                          className="fill-foreground text-2xl font-bold"
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                       >
                                          {total}
                                       </tspan>
                                       <tspan
                                          className="fill-muted-foreground text-xs"
                                          x={viewBox.cx}
                                          y={(viewBox.cy || 0) + 20}
                                       >
                                          {translate(
                                             "dashboard.routes.reports.charts.payment-status-distribution.total-label",
                                          )}
                                       </tspan>
                                    </text>
                                 );
                              }
                           }}
                        />
                     </Pie>
                     <ChartLegend
                        className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        content={<ChartLegendContent nameKey="name" />}
                     />
                  </PieChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {translate(
                        "dashboard.routes.reports.charts.payment-status-distribution.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function PerformanceStatsCards() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: performance } = useSuspenseQuery(
      trpc.reports.getPaymentPerformance.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.reports.payment-performance.payment-status.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.payment-performance.payment-status.description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.paid-on-time",
                        )}
                     </span>
                     <span className="font-medium text-green-600">
                        {performance.paidOnTime}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.paid-late",
                        )}
                     </span>
                     <span className="font-medium text-yellow-600">
                        {performance.paidLate}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.pending",
                        )}
                     </span>
                     <span className="font-medium text-blue-600">
                        {performance.pending}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.overdue",
                        )}
                     </span>
                     <span className="font-medium text-red-600">
                        {performance.overdue}
                     </span>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.reports.payment-performance.performance-metrics.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.payment-performance.performance-metrics.description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.avg-delay",
                        )}
                     </span>
                     <span className="font-medium">
                        {performance.averageDelayDays.toFixed(1)}{" "}
                        {translate(
                           "dashboard.routes.reports.payment-performance.days",
                        )}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.payment-completion",
                        )}
                     </span>
                     <span className="font-medium">
                        {performance.paymentRate.toFixed(1)}%
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">
                        {translate(
                           "dashboard.routes.reports.payment-performance.on-time-compliance",
                        )}
                     </span>
                     <span className="font-medium">
                        {performance.onTimeRate.toFixed(1)}%
                     </span>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}

function CashFlowDetailsCards() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: plannedVsActual } = useSuspenseQuery(
      trpc.reports.getPlannedVsActual.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <div className="grid gap-4 md:grid-cols-3">
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.planned-income.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.planned-income.description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-2xl font-bold">
                  {formatDecimalCurrency(plannedVsActual.planned.income)}
               </p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.actual-income.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.actual-income.description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-2xl font-bold">
                  {formatDecimalCurrency(plannedVsActual.actual.income)}
               </p>
               <p
                  className={`text-sm ${plannedVsActual.variance.income >= 0 ? "text-green-600" : "text-red-600"}`}
               >
                  {plannedVsActual.variance.income >= 0 ? "+" : ""}
                  {formatDecimalCurrency(plannedVsActual.variance.income)}{" "}
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.variance",
                  )}
               </p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.income-variance.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.planned-vs-actual.income-variance.description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <p
                  className={`text-2xl font-bold ${plannedVsActual.variance.income >= 0 ? "text-green-600" : "text-red-600"}`}
               >
                  {plannedVsActual.variance.income >= 0 ? "+" : ""}
                  {plannedVsActual.planned.income > 0
                     ? (
                          (plannedVsActual.variance.income /
                             plannedVsActual.planned.income) *
                          100
                       ).toFixed(1)
                     : 0}
                  %
               </p>
            </CardContent>
         </Card>
      </div>
   );
}

function CategoryDetailsTable() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: categoryBreakdown } = useSuspenseQuery(
      trpc.reports.getCategoryBreakdown.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.reports.category-details.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.reports.category-details.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((cat) => (
                     <div
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                        key={cat.category}
                     >
                        <div>
                           <p className="font-medium">{cat.category}</p>
                           <p className="text-sm text-muted-foreground">
                              {cat.transactionCount}{" "}
                              {translate(
                                 "dashboard.routes.reports.category-details.transactions",
                              )}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="font-medium">
                              {formatDecimalCurrency(Math.abs(cat.total))}
                           </p>
                           <div className="flex gap-2 text-sm">
                              <span className="text-green-600">
                                 +{formatDecimalCurrency(cat.income)}
                              </span>
                              <span className="text-red-600">
                                 -{formatDecimalCurrency(cat.expenses)}
                              </span>
                           </div>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="flex h-32 items-center justify-center">
                     <p className="text-muted-foreground text-sm">
                        {translate(
                           "dashboard.routes.reports.charts.expenses-breakdown.empty",
                        )}
                     </p>
                  </div>
               )}
            </div>
         </CardContent>
      </Card>
   );
}

function PerformanceStatsRow() {
   const trpc = useTRPC();
   const { startDate, endDate } = useReports();

   const { data: performance } = useSuspenseQuery(
      trpc.reports.getPaymentPerformance.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
            <CardHeader className="pb-2">
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.payment-performance.total-bills.description",
                  )}
               </CardDescription>
               <CardTitle className="text-2xl">
                  {performance.totalBills}
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">
                  {translate(
                     "dashboard.routes.reports.payment-performance.total-bills.title",
                  )}
               </p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardDescription>
                  {performance.paidOnTime + performance.paidLate}{" "}
                  {translate(
                     "dashboard.routes.reports.payment-performance.payment-rate.description",
                  )}
               </CardDescription>
               <CardTitle className="text-2xl">
                  {performance.paymentRate.toFixed(1)}%
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">
                  {translate(
                     "dashboard.routes.reports.payment-performance.payment-rate.title",
                  )}
               </p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardDescription>
                  {performance.paidOnTime}{" "}
                  {translate(
                     "dashboard.routes.reports.payment-performance.on-time-rate.description",
                  )}
               </CardDescription>
               <CardTitle className="text-2xl">
                  {performance.onTimeRate.toFixed(1)}%
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">
                  {translate(
                     "dashboard.routes.reports.payment-performance.on-time-rate.title",
                  )}
               </p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardDescription>
                  {translate(
                     "dashboard.routes.reports.payment-performance.overdue-bills.description",
                  )}
               </CardDescription>
               <CardTitle className="text-2xl text-red-600">
                  {performance.overdue}
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground">
                  {translate(
                     "dashboard.routes.reports.payment-performance.overdue-bills.title",
                  )}
               </p>
            </CardContent>
         </Card>
      </div>
   );
}

export function ReportsChartsContent() {
   return (
      <>
         <TabsContent className="space-y-4" value="overview">
            <FinancialEvolutionChart />
            <div className="grid gap-4 md:grid-cols-2">
               <PlannedVsActualChart />
               <TopCategoriesChart />
            </div>
         </TabsContent>

         <TabsContent className="space-y-4" value="cashflow">
            <CashFlowAnalysisChart />
            <CashFlowDetailsCards />
         </TabsContent>

         <TabsContent className="space-y-4" value="categories">
            <CategoryBreakdownCharts />
            <CategoryDetailsTable />
         </TabsContent>

         <TabsContent className="space-y-4" value="performance">
            <PerformanceStatsRow />
            <div className="grid gap-4 md:grid-cols-2">
               <PaymentStatusChart />
               <PerformanceStatsCards />
            </div>
         </TabsContent>
      </>
   );
}

export function ReportsCharts() {
   return (
      <ErrorBoundary FallbackComponent={ReportsChartsErrorFallback}>
         <Suspense fallback={<ReportsChartsSkeleton />}>
            <ReportsChartsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
