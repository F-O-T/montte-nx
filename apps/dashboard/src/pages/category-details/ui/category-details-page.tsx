import { translate } from "@packages/localization";
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
import { FileText, Home } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { CategoryStats } from "./category-stats";
import { CategoryTransactions } from "./category-transactions-section";

function CategoryContent() {
   const params = useParams({ strict: false });
   const categoryId = (params as { categoryId?: string }).categoryId ?? "";
   const trpc = useTRPC();

   const { data: category } = useSuspenseQuery(
      trpc.categories.getById.queryOptions({ id: categoryId }),
   );

   if (!categoryId) {
      return (
         <CategoryPageError
            error={new Error("Invalid category ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!category) {
      return null;
   }

   return (
      <main className="space-y-4">
         <DefaultHeader
            description={translate(
               "dashboard.routes.categories.details-section.description",
            )}
            title={category.name}
         />
         <CategoryStats categoryId={categoryId} />
         <CategoryTransactions categoryId={categoryId} />
      </main>
   );
}

function CategoryPageSkeleton() {
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

function CategoryPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <FileText className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load category</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/categories",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Categories
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

export function CategoryDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={CategoryPageError}>
         <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryContent />
         </Suspense>
      </ErrorBoundary>
   );
}
