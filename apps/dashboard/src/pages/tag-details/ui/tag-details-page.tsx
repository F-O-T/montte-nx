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
import { Home, Tag } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { TagInfo } from "./tag-information-section";
import { TagStats } from "./tag-stats";
import { TagTransactions } from "./tag-transactions-section";

function TagContent() {
   const params = useParams({ strict: false });
   const tagId = (params as { tagId?: string }).tagId ?? "";
   const trpc = useTRPC();

   const { data: tag } = useSuspenseQuery(
      trpc.tags.getById.queryOptions({ id: tagId }),
   );

   if (!tagId) {
      return (
         <TagPageError
            error={new Error("Invalid tag ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!tag) {
      return null;
   }

   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-2 grid gap-4">
               <TagInfo tagId={tagId} />
               <TagTransactions tagId={tagId} />
            </div>
            <div className="col-span-1">
               <TagStats tagId={tagId} />
            </div>
         </div>
      </main>
   );
}

function TagPageSkeleton() {
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

function TagPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Tag className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load tag</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/tags",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Tags
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

export function TagDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={TagPageError}>
         <Suspense fallback={<TagPageSkeleton />}>
            <TagContent />
         </Suspense>
      </ErrorBoundary>
   );
}
