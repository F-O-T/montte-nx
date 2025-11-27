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
   Pie,
   PieChart,
   XAxis,
   YAxis,
} from "recharts";
import { trpc } from "@/integrations/clients";

function CategoriesChartsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription:
               "Failed to load category charts. Please try again later.",
            errorTitle: "Error loading charts",
            retryText: "Retry",
         })(props)}
      </div>
   );
}

function CategoriesChartsSkeleton() {
   return (
      <div className="space-y-4">
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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((index) => (
               <Card key={`chart-skeleton-extra-${index}`}>
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
      </div>
   );
}

interface PieChartData {
   name: string;
   value: number;
   fill: string;
}

interface CategoryPieChartProps {
   data: PieChartData[];
   title: string;
   description: string;
   total: number;
   totalLabel: string;
   emptyMessage: string;
}

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
                                 • {entry.payload.transactions} transações
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

interface MonthlyTrendTooltipProps {
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

function MonthlyTrendTooltip({
   active,
   payload,
   label,
   chartConfig,
}: MonthlyTrendTooltipProps) {
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

function CategoryPieChart({
   data,
   title,
   description,
   total,
   totalLabel,
   emptyMessage,
}: CategoryPieChartProps) {
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

function CategoryMonthlyTrendChart() {
   const { data: monthlyTrend } = useSuspenseQuery(
      trpc.categories.getMonthlyTrend.queryOptions({ months: 6 }),
   );

   const { chartData, chartConfig, hasData } = useMemo(() => {
      if (!monthlyTrend || monthlyTrend.length === 0) {
         return { chartConfig: {}, chartData: [], hasData: false };
      }

      const categorySet = new Map<
         string,
         { name: string; color: string; id: string }
      >();

      for (const month of monthlyTrend) {
         for (const cat of month.categories) {
            if (!categorySet.has(cat.categoryId)) {
               categorySet.set(cat.categoryId, {
                  color: cat.categoryColor,
                  id: cat.categoryId,
                  name: cat.categoryName,
               });
            }
         }
      }

      const categories = Array.from(categorySet.values()).slice(0, 5);

      const config: ChartConfig = {};
      for (const cat of categories) {
         config[cat.id] = {
            color: cat.color,
            label: cat.name,
         };
      }

      const data = monthlyTrend.map((month) => {
         const monthData: Record<string, string | number> = {
            month: new Date(`${month.month}-01`).toLocaleDateString("pt-BR", {
               month: "short",
            }),
         };

         for (const cat of categories) {
            const categoryData = month.categories.find(
               (c) => c.categoryId === cat.id,
            );
            monthData[cat.id] = categoryData ? categoryData.expenses : 0;
         }

         return monthData;
      });

      return {
         chartConfig: config,
         chartData: data,
         hasData: data.length > 0 && categories.length > 0,
      };
   }, [monthlyTrend]);

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.stats.charts.monthly-trend.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.stats.charts.monthly-trend.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {hasData ? (
               <ChartContainer
                  className="h-[300px] w-full"
                  config={chartConfig}
               >
                  <AreaChart accessibilityLayer data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis
                        axisLine={false}
                        dataKey="month"
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
                        content={
                           <MonthlyTrendTooltip chartConfig={chartConfig} />
                        }
                     />
                     <ChartLegend content={<ChartLegendContent />} />
                     {Object.keys(chartConfig).map((categoryId) => (
                        <Area
                           dataKey={categoryId}
                           fill={`var(--color-${categoryId})`}
                           fillOpacity={0.3}
                           key={categoryId}
                           stackId="a"
                           stroke={`var(--color-${categoryId})`}
                           type="monotone"
                        />
                     ))}
                  </AreaChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {translate(
                        "dashboard.routes.categories.stats.charts.monthly-trend.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function TopCategoriesChart() {
   const { data: topCategories } = useSuspenseQuery(
      trpc.categories.getTopCategories.queryOptions({
         limit: 5,
         type: "expense",
      }),
   );

   const { chartData, chartConfig, hasData, total } = useMemo(() => {
      if (!topCategories || topCategories.length === 0) {
         return { chartConfig: {}, chartData: [], hasData: false, total: 0 };
      }

      const config: ChartConfig = {};
      let sum = 0;
      const data = topCategories.map((cat) => {
         config[cat.categoryId] = {
            color: cat.categoryColor,
            label: cat.categoryName,
         };
         sum += cat.total;
         return {
            fill: cat.categoryColor,
            name: cat.categoryName,
            transactions: cat.transactionCount,
            value: cat.total,
         };
      });

      return {
         chartConfig: config,
         chartData: data,
         hasData: data.length > 0,
         total: sum,
      };
   }, [topCategories]);

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.stats.charts.top-categories.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.stats.charts.top-categories.description",
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
                        tickFormatter={(value) => `R$ ${value}`}
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
                        "dashboard.routes.categories.stats.charts.top-categories.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function CategoryTypeDistributionChart() {
   const { data: typeDistribution } = useSuspenseQuery(
      trpc.categories.getTypeDistribution.queryOptions(),
   );

   const { chartData, chartConfig, hasData, totalIncome, totalExpense } =
      useMemo(() => {
         if (!typeDistribution || typeDistribution.length === 0) {
            return {
               chartConfig: {},
               chartData: [],
               hasData: false,
               totalExpense: 0,
               totalIncome: 0,
            };
         }

         let incomeSum = 0;
         let expenseSum = 0;

         for (const cat of typeDistribution) {
            incomeSum += cat.incomeCount;
            expenseSum += cat.expenseCount;
         }

         const incomeLabel = translate("common.charts.labels.income");
         const expensesLabel = translate("common.charts.labels.expenses");

         const data = [
            {
               fill: "#10b981",
               name: incomeLabel,
               value: incomeSum,
            },
            {
               fill: "#ef4444",
               name: expensesLabel,
               value: expenseSum,
            },
         ];

         const config: ChartConfig = {
            [incomeLabel]: {
               color: "#10b981",
               label: incomeLabel,
            },
            [expensesLabel]: {
               color: "#ef4444",
               label: expensesLabel,
            },
         };

         return {
            chartConfig: config,
            chartData: data,
            hasData: incomeSum > 0 || expenseSum > 0,
            totalExpense: expenseSum,
            totalIncome: incomeSum,
         };
      }, [typeDistribution]);

   const total = totalIncome + totalExpense;

   return (
      <Card className="flex flex-col">
         <CardHeader className="items-center pb-0">
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.stats.charts.type-distribution.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.stats.charts.type-distribution.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-1 pb-0">
            {hasData ? (
               <ChartContainer
                  className="mx-auto aspect-square max-h-[250px]"
                  config={chartConfig}
               >
                  <PieChart>
                     <ChartTooltip
                        content={
                           <CustomTooltip
                              showPercentage
                              total={total}
                              valueFormatter={(value) => `${value} transações`}
                           />
                        }
                        cursor={false}
                     />
                     <Pie
                        data={chartData}
                        dataKey="value"
                        innerRadius={50}
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
                                          y={(viewBox.cy || 0) + 18}
                                       >
                                          {translate(
                                             "dashboard.routes.categories.stats.charts.type-distribution.total-label",
                                          )}
                                       </tspan>
                                    </text>
                                 );
                              }
                           }}
                        />
                     </Pie>
                     <ChartLegend
                        className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
                        content={<ChartLegendContent nameKey="name" />}
                     />
                  </PieChart>
               </ChartContainer>
            ) : (
               <div className="flex h-[250px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                     {translate(
                        "dashboard.routes.categories.stats.charts.type-distribution.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function CategoryUsageFrequencyChart() {
   const { data: usageFrequency } = useSuspenseQuery(
      trpc.categories.getUsageFrequency.queryOptions(),
   );

   const { chartData, chartConfig, hasData, total } = useMemo(() => {
      if (!usageFrequency || usageFrequency.length === 0) {
         return { chartConfig: {}, chartData: [], hasData: false, total: 0 };
      }

      const filteredData = usageFrequency
         .filter((cat) => cat.transactionCount > 0)
         .slice(0, 10);

      if (filteredData.length === 0) {
         return { chartConfig: {}, chartData: [], hasData: false, total: 0 };
      }

      const config: ChartConfig = {};
      let sum = 0;
      const data = filteredData.map((cat) => {
         config[cat.categoryId] = {
            color: cat.categoryColor,
            label: cat.categoryName,
         };
         sum += cat.transactionCount;
         return {
            fill: cat.categoryColor,
            name: cat.categoryName,
            value: cat.transactionCount,
         };
      });

      return {
         chartConfig: config,
         chartData: data,
         hasData: true,
         total: sum,
      };
   }, [usageFrequency]);

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.categories.stats.charts.usage-frequency.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.stats.charts.usage-frequency.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {hasData ? (
               <ChartContainer
                  className="h-[250px] w-full"
                  config={chartConfig}
               >
                  <BarChart accessibilityLayer data={chartData}>
                     <CartesianGrid vertical={false} />
                     <XAxis
                        axisLine={false}
                        dataKey="name"
                        tickFormatter={(value) =>
                           value.length > 10
                              ? `${value.slice(0, 10)}...`
                              : value
                        }
                        tickLine={false}
                        tickMargin={8}
                     />
                     <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                     <ChartTooltip
                        content={
                           <CustomTooltip
                              showPercentage
                              total={total}
                              valueFormatter={(value) => `${value} transações`}
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
                        "dashboard.routes.categories.stats.charts.usage-frequency.empty",
                     )}
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

function CategoriesChartsContent() {
   const { data: breakdown } = useSuspenseQuery(
      trpc.categories.getBreakdown.queryOptions(),
   );

   const expensesData = useMemo(() => {
      return breakdown
         .filter((item) => item.expenses > 0)
         .map((item) => ({
            fill: item.categoryColor,
            name: item.categoryName,
            value: item.expenses,
         }));
   }, [breakdown]);

   const incomeData = useMemo(() => {
      return breakdown
         .filter((item) => item.income > 0)
         .map((item) => ({
            fill: item.categoryColor,
            name: item.categoryName,
            value: item.income,
         }));
   }, [breakdown]);

   const totalExpenses = useMemo(() => {
      return expensesData.reduce((sum, item) => sum + item.value, 0);
   }, [expensesData]);

   const totalIncome = useMemo(() => {
      return incomeData.reduce((sum, item) => sum + item.value, 0);
   }, [incomeData]);

   return (
      <div className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoryPieChart
               data={expensesData}
               description={translate(
                  "dashboard.routes.categories.stats.breakdown.expenses.description",
               )}
               emptyMessage={translate(
                  "dashboard.routes.categories.stats.breakdown.expenses.empty",
               )}
               title={translate(
                  "dashboard.routes.categories.stats.breakdown.expenses.title",
               )}
               total={totalExpenses}
               totalLabel={translate("common.charts.labels.expenses")}
            />
            <CategoryPieChart
               data={incomeData}
               description={translate(
                  "dashboard.routes.categories.stats.breakdown.income.description",
               )}
               emptyMessage={translate(
                  "dashboard.routes.categories.stats.breakdown.income.empty",
               )}
               title={translate(
                  "dashboard.routes.categories.stats.breakdown.income.title",
               )}
               total={totalIncome}
               totalLabel={translate("common.charts.labels.income")}
            />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TopCategoriesChart />
            <CategoryTypeDistributionChart />
            <CategoryUsageFrequencyChart />
         </div>
         <CategoryMonthlyTrendChart />
      </div>
   );
}

export function CategoriesCharts() {
   return (
      <ErrorBoundary FallbackComponent={CategoriesChartsErrorFallback}>
         <Suspense fallback={<CategoriesChartsSkeleton />}>
            <CategoriesChartsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
