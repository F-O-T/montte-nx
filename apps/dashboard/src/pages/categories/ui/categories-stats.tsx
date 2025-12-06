import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

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
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((index) => (
               <Card key={`chart-skeleton-${index + 1}`}>
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

function CategoriesStatsContent() {
   const trpc = useTRPC();
   const { data: stats } = useSuspenseQuery(
      trpc.categories.getStats.queryOptions(),
   );

   return (
      <div className="grid grid-cols-2  gap-4">
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
