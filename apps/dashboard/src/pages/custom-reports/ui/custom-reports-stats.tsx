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

function CustomReportsStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription:
               "Falha ao carregar estatísticas. Tente novamente mais tarde.",
            errorTitle: "Erro ao carregar estatísticas",
            retryText: "Tentar novamente",
         })(props)}
      </div>
   );
}

function CustomReportsStatsSkeleton() {
   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-min">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`stats-skeleton-card-${index}`}
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

function CustomReportsStatsContent() {
   const trpc = useTRPC();
   const { data: reports } = useSuspenseQuery(
      trpc.customReports.getAll.queryOptions(),
   );

   const totalReports = reports.length;

   const dreCount = reports.filter(
      (r) => r.type === "dre_gerencial" || r.type === "dre_fiscal",
   ).length;

   const analysisCount = reports.filter(
      (r) => r.type === "budget_vs_actual" || r.type === "spending_trends",
   ).length;

   const forecastCount = reports.filter(
      (r) =>
         r.type === "cash_flow_forecast" || r.type === "counterparty_analysis",
   ).length;

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-min">
         <StatsCard
            description="Total de relatórios criados"
            title="Relatórios"
            value={totalReports}
         />
         <StatsCard
            description="DRE Gerencial e Fiscal"
            title="Demonstrativos"
            value={dreCount}
         />
         <StatsCard
            description="Budget e Tendências"
            title="Análises"
            value={analysisCount}
         />
         <StatsCard
            description="Fluxo de Caixa e Parceiros"
            title="Projeções"
            value={forecastCount}
         />
      </div>
   );
}

export function CustomReportsStats() {
   return (
      <ErrorBoundary FallbackComponent={CustomReportsStatsErrorFallback}>
         <Suspense fallback={<CustomReportsStatsSkeleton />}>
            <CustomReportsStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
