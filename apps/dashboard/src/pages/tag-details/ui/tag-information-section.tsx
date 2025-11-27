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
import { MoreVertical, Tag } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { ManageTagSheet } from "@/pages/tags/features/manage-tag-sheet";

function InfoErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Failed to load tag information</AlertDescription>
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

function TagContent({ tagId }: { tagId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.tags.getById.queryOptions({ id: tagId }),
   );

   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia
            style={{
               backgroundColor: data.color,
            }}
            variant="icon"
         >
            <Tag className="size-5 text-white" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>{data.name}</ItemTitle>
            <ItemDescription>
               {translate("dashboard.layout.breadcrumbs.tags")}
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
                  <ManageTagSheet asChild tag={data} />
               </DropdownMenuContent>
            </DropdownMenu>
         </ItemActions>
      </Item>
   );
}

export function TagInfo({ tagId }: { tagId: string }) {
   return (
      <ErrorBoundary FallbackComponent={InfoErrorFallback}>
         <Suspense fallback={<InfoSkeleton />}>
            <TagContent tagId={tagId} />
         </Suspense>
      </ErrorBoundary>
   );
}
