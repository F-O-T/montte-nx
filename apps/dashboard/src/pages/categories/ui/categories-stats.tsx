import { translate } from "@packages/localization";
import { formatDecimalCurrency } from "@packages/money";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQueries } from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function CategoriesStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {Array.from({ length: 4 }).map((_, index) => (
            <div
               className="rounded-xl border bg-card p-4"
               key={`stats-skeleton-${index + 1}`}
            >
               <Skeleton className="h-4 w-24 mb-2" />
               <Skeleton className="h-8 w-16" />
               <Skeleton className="h-3 w-32 mt-2" />
            </div>
         ))}
      </div>
   );
}

function CategoriesStatsContent() {
   const trpc = useTRPC();

   const [statsQuery, breakdownQuery] = useSuspenseQueries({
      queries: [
         trpc.categories.getStats.queryOptions(),
         trpc.categories.getBreakdown.queryOptions(),
      ],
   });

   const { totalIncome, totalExpenses } = useMemo(() => {
      const breakdown = breakdownQuery.data ?? [];
      return breakdown.reduce(
         (acc, item) => ({
            totalExpenses: acc.totalExpenses + (item.expenses || 0),
            totalIncome: acc.totalIncome + (item.income || 0),
         }),
         { totalExpenses: 0, totalIncome: 0 },
      );
   }, [breakdownQuery.data]);

   const stats = statsQuery.data;

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
               "dashboard.routes.categories.stats.total-income.description",
            )}
            title={translate(
               "dashboard.routes.categories.stats.total-income.title",
            )}
            value={`+${formatDecimalCurrency(totalIncome)}`}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.categories.stats.total-expenses.description",
            )}
            title={translate(
               "dashboard.routes.categories.stats.total-expenses.title",
            )}
            value={`-${formatDecimalCurrency(totalExpenses)}`}
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
