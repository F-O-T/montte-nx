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

function InterestTemplatesStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-min">
         {createErrorFallback({
            errorDescription: translate(
               "dashboard.routes.interest-templates.stats.error.description",
            ),
            errorTitle: translate(
               "dashboard.routes.interest-templates.stats.error.title",
            ),
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function InterestTemplatesStatsSkeleton() {
   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-min">
         {[1, 2, 3, 4].map((index) => (
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

function InterestTemplatesStatsContent() {
   const trpc = useTRPC();
   const { data: stats } = useSuspenseQuery(
      trpc.interestTemplates.getStats.queryOptions(),
   );

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-min">
         <StatsCard
            description={translate(
               "dashboard.routes.interest-templates.stats.total.description",
            )}
            title={translate(
               "dashboard.routes.interest-templates.stats.total.title",
            )}
            value={stats?.total ?? 0}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.interest-templates.stats.active.description",
            )}
            title={translate(
               "dashboard.routes.interest-templates.stats.active.title",
            )}
            value={stats?.totalActive ?? 0}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.interest-templates.stats.with-penalty.description",
            )}
            title={translate(
               "dashboard.routes.interest-templates.stats.with-penalty.title",
            )}
            value={stats?.withPenalty ?? 0}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.interest-templates.stats.with-correction.description",
            )}
            title={translate(
               "dashboard.routes.interest-templates.stats.with-correction.title",
            )}
            value={stats?.withCorrection ?? 0}
         />
      </div>
   );
}

export function InterestTemplatesStats() {
   return (
      <ErrorBoundary FallbackComponent={InterestTemplatesStatsErrorFallback}>
         <Suspense fallback={<InterestTemplatesStatsSkeleton />}>
            <InterestTemplatesStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
