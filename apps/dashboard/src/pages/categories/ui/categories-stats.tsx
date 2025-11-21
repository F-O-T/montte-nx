import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   type ChartConfig,
   ChartContainer,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Cell, Label, Pie, PieChart } from "recharts";
import { trpc } from "@/integrations/clients";

function CategoriesStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min ">
         {createErrorFallback({
            errorDescription:
               "Failed to load categories stats. Please try again later.",
            errorTitle: "Error loading stats",
            retryText: "Retry",
         })(props)}
      </div>
   );
}

function CategoriesStatsSkeleton() {
   return (
      <div className="grid h-min gap-4">
         <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((index) => (
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

         <Card className="col-span-1">
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
      </div>
   );
}

function CategoriesStatsContent() {
   const { data: stats } = useSuspenseQuery(
      trpc.categories.getStats.queryOptions(),
   );

   // Get current month's date range for category breakdown
   const now = new Date();
   const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
   const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

   const { data: categoryBreakdown } = useSuspenseQuery(
      trpc.reports.getCategoryBreakdown.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   // Prepare data for pie chart - filter out categories with zero expenses
   const pieChartData = categoryBreakdown
      .filter((cat) => cat.expenses > 0)
      .map((cat) => ({
         color: cat.categoryColor,
         name: cat.categoryName,
         transactionCount: cat.transactionCount,
         value: Math.abs(cat.expenses),
      }));

   const totalExpenses = React.useMemo(() => {
      return pieChartData.reduce((acc, curr) => acc + curr.value, 0);
   }, [pieChartData]);

   const chartConfig: ChartConfig = pieChartData.reduce((acc, cat) => {
      acc[cat.name] = {
         color: cat.color,
         label: cat.name,
      };
      return acc;
   }, {} as ChartConfig);

   return (
      <div className="grid gap-4 h-min">
         <div className="grid grid-cols-2 gap-4">
            <StatsCard
               description={translate(
                  "dashboard.routes.categories.stats.total-categories.description",
               )}
               title={translate(
                  "dashboard.routes.categories.stats.total-categories.title",
               )}
               value={stats.totalCategories}
            />
            <StatsCard
               description={translate(
                  "dashboard.routes.categories.stats.most-spending.description",
               )}
               title={translate(
                  "dashboard.routes.categories.stats.most-spending.title",
               )}
               value={stats.categoryWithMostTransactions || "N/A"}
            />
         </div>

         <div className="grid-cols-1">
            <Card className="">
               <CardHeader className="">
                  <CardTitle>
                     {translate(
                        "dashboard.routes.categories.stats.breakdown.title",
                     )}
                  </CardTitle>
                  <CardDescription>
                     {translate(
                        "dashboard.routes.categories.stats.breakdown.description",
                     )}
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  {pieChartData.length > 0 ? (
                     <ChartContainer config={chartConfig}>
                        <PieChart>
                           <ChartTooltip
                              content={
                                 <ChartTooltipContent
                                    formatter={(value) =>
                                       formatDecimalCurrency(Number(value))
                                    }
                                 />
                              }
                              cursor={false}
                           />
                           <Pie
                              data={pieChartData}
                              dataKey="value"
                              innerRadius={60}
                              nameKey="name"
                              strokeWidth={5}
                           >
                              {pieChartData.map((entry, index) => (
                                 <Cell
                                    fill={entry.color}
                                    key={`cell-${index + 1}`}
                                 />
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
                                                className="fill-foreground text-3xl font-bold"
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                             >
                                                {formatDecimalCurrency(
                                                   totalExpenses,
                                                )}
                                             </tspan>
                                             <tspan
                                                className="fill-muted-foreground"
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) + 24}
                                             >
                                                {translate(
                                                   "dashboard.routes.categories.stats.breakdown.text.total-expenses",
                                                )}
                                             </tspan>
                                          </text>
                                       );
                                    }
                                 }}
                              />
                           </Pie>
                        </PieChart>
                     </ChartContainer>
                  ) : (
                     <div className="h-64 flex items-center justify-center text-muted-foreground">
                        {translate(
                           "dashboard.routes.categories.stats.breakdown.state.no-data",
                        )}
                     </div>
                  )}
               </CardContent>
               <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 leading-none font-medium">
                     {translate(
                        "dashboard.routes.categories.stats.breakdown.text.categories-count",
                     ).replace("{count}", pieChartData.length.toString())}
                  </div>
                  <div className="text-muted-foreground leading-none">
                     {translate(
                        "dashboard.routes.categories.stats.breakdown.text.showing-expenses",
                     ).replace(
                        "{month}",
                        now.toLocaleDateString("pt-BR", {
                           month: "long",
                           year: "numeric",
                        }),
                     )}
                  </div>
               </CardFooter>
            </Card>
         </div>
      </div>
   );
}

export function CategoriesStats() {
   return (
      <ErrorBoundary FallbackComponent={CategoriesStatsErrorFallback}>
         <Suspense fallback={<CategoriesStatsSkeleton />}>
            <CategoriesStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
