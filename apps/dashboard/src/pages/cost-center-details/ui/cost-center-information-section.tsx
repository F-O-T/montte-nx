import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Landmark, MoreVertical } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { ManageCostCenterSheet } from "@/pages/cost-centers/features/manage-cost-center-sheet";

function InfoErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Failed to load cost center information
         </AlertDescription>
      </Alert>
   );
}

function InfoSkeleton() {
   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia>
            <Skeleton className="size-12 rounded-full" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>
               <Skeleton className="h-5 w-32" />
            </ItemTitle>
            <ItemDescription>
               <Skeleton className="h-4 w-48" />
            </ItemDescription>
         </ItemContent>
      </Item>
   );
}

function CostCenterContent({ costCenterId }: { costCenterId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.costCenters.getById.queryOptions({ id: costCenterId }),
   );

   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia className="bg-primary/10" variant="icon">
            <Landmark className="size-5 text-primary" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>{data.name}</ItemTitle>
            <ItemDescription>
               {data.code
                  ? `${translate("dashboard.layout.breadcrumbs.cost-centers")} - ${data.code}`
                  : translate("dashboard.layout.breadcrumbs.cost-centers")}
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                     <MoreVertical className="size-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <ManageCostCenterSheet asChild costCenter={data} />
               </DropdownMenuContent>
            </DropdownMenu>
         </ItemActions>
      </Item>
   );
}

export function CostCenterInfo({ costCenterId }: { costCenterId: string }) {
   return (
      <ErrorBoundary FallbackComponent={InfoErrorFallback}>
         <Suspense fallback={<InfoSkeleton />}>
            <CostCenterContent costCenterId={costCenterId} />
         </Suspense>
      </ErrorBoundary>
   );
}
