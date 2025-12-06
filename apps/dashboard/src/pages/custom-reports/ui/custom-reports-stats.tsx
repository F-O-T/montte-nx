import { Card, CardContent } from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function CustomReportsStatsSkeleton() {
   return (
      <div className="grid gap-4 sm:grid-cols-3">
         {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`stat-skeleton-${index + 1}`}>
               <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                     <Skeleton className="size-10 rounded-full" />
                     <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-6 w-16" />
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
}

function CustomReportsStatsContent() {
   const trpc = useTRPC();
   const { data: reports } = useSuspenseQuery(
      trpc.customReports.getAll.queryOptions(),
   );

   const totalReports = reports.length;
   const gerencialCount = reports.filter(
      (r) => r.type === "dre_gerencial",
   ).length;
   const fiscalCount = reports.filter((r) => r.type === "dre_fiscal").length;

   return (
      <div className="grid gap-4 sm:grid-cols-3">
         <StatsCard
            description="Todos os relatórios DRE criados"
            title="Total de Relatórios"
            value={totalReports}
         />
         <StatsCard
            description="Relatórios com dados reais"
            title="DRE Gerencial"
            value={gerencialCount}
         />
         <StatsCard
            description="Relatórios com planejado vs real"
            title="DRE Fiscal"
            value={fiscalCount}
         />
      </div>
   );
}

export function CustomReportsStats() {
   return (
      <ErrorBoundary fallback={<CustomReportsStatsSkeleton />}>
         <Suspense fallback={<CustomReportsStatsSkeleton />}>
            <CustomReportsStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
