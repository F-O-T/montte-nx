import { StatsCard } from "@packages/ui/components/stats-card";
import { translate } from "@packages/localization";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";

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
      <div className="grid h-min   gap-4">
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
   );
}

function CategoriesStatsContent() {
   const { data: stats } = useSuspenseQuery(
      trpc.categories.getStats.queryOptions(),
   );

   return (
      <div className="grid gap-4 h-min">
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
               "dashboard.routes.categories.stats.most-transactions.description",
            )}
            title={translate(
               "dashboard.routes.categories.stats.most-transactions.title",
            )}
            value={stats.categoryWithMostTransactions || "No data"}
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
