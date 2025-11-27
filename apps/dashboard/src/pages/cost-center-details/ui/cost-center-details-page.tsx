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
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { CostCenterInfo } from "./cost-center-information-section";
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
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-2 grid gap-4">
               <CostCenterInfo costCenterId={costCenterId} />
               <CostCenterTransactions costCenterId={costCenterId} />
            </div>
            <div className="col-span-1">
               <CostCenterStats costCenterId={costCenterId} />
            </div>
         </div>
      </main>
   );
}

function CostCenterPageSkeleton() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid md:grid-cols-1 gap-4">
            <div className="col-span-1 grid gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-24 w-full" />
            </div>
         </div>
         <div className="grid md:grid-cols-1 gap-4">
            <Skeleton className="h-48 w-full" />
         </div>
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
