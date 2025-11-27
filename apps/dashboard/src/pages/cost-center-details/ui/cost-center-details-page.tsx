import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { Home, Landmark } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { CostCenterCharts } from "./cost-center-charts";
import { CostCenterStats } from "./cost-center-stats";
import { CostCenterTransactions } from "./cost-center-transactions-section";

function CostCenterContent() {
   const params = useParams({ strict: false });
   const costCenterId =
      (params as { costCenterId?: string }).costCenterId ?? "";
   const trpc = useTRPC();

   const { data: costCenter } = useSuspenseQuery(
      trpc.costCenters.getById.queryOptions({ id: costCenterId }),
   );

   if (!costCenterId) {
      return (
         <CostCenterPageError
            error={new Error("Invalid cost center ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!costCenter) {
      return null;
   }

   return (
      <main className="space-y-4">
         <DefaultHeader
            description="Visualize detalhes e estatisticas do centro de custo"
            title={costCenter.name}
         />
         <CostCenterStats costCenterId={costCenterId} />
         <CostCenterTransactions costCenterId={costCenterId} />
         <CostCenterCharts costCenterId={costCenterId} />
      </main>
   );
}

function CostCenterPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
         <Skeleton className="h-64 w-full" />
      </main>
   );
}

function CostCenterPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Landmark className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load cost center</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/cost-centers",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Cost Centers
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        Try Again
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function CostCenterDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={CostCenterPageError}>
         <Suspense fallback={<CostCenterPageSkeleton />}>
            <CostCenterContent />
         </Suspense>
      </ErrorBoundary>
   );
}
