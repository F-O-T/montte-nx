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
import { MoreVertical } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useTRPC } from "@/integrations/clients";
import { SetBudgetSheet } from "../features/set-budget-sheet";

function InfoErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Failed to load category information
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

function CategoryContent({ categoryId }: { categoryId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.categories.getById.queryOptions({ id: categoryId }),
   );

   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia
            style={{
               backgroundColor: data.color,
            }}
            variant="icon"
         >
            <IconDisplay
               iconName={(data.icon || "Tag") as IconName}
               size={20}
            />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>{data.name}</ItemTitle>
            <ItemDescription>
               {translate(
                  "dashboard.routes.categories.details-section.description",
               )}
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
                  <SetBudgetSheet
                     asChild
                     categoryId={categoryId}
                     currentBudget={0}
                  />
               </DropdownMenuContent>
            </DropdownMenu>
         </ItemActions>
      </Item>
   );
}

export function CategoryInfo({ categoryId }: { categoryId: string }) {
   return (
      <ErrorBoundary FallbackComponent={InfoErrorFallback}>
         <Suspense fallback={<InfoSkeleton />}>
            <CategoryContent categoryId={categoryId} />
         </Suspense>
      </ErrorBoundary>
   );
}
