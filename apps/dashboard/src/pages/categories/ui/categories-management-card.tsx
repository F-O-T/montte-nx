import { useQuery } from "@tanstack/react-query";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { trpc } from "@/integrations/clients";
import { CategoriesTable } from "./categories-table";

function CategoriesManagementCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>
                     <Skeleton className="h-6 w-32" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-4 w-64 mt-2" />
                  </CardDescription>
               </div>
               <Skeleton className="h-10 w-20" />
            </div>
         </CardHeader>
         <div className="px-6 pb-6">
            <div className="space-y-4">
               {Array.from({ length: 3 }).map((_, index) => (
                  <div
                     key={`category-skeleton-${index}`}
                     className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                     <Skeleton className="h-10 w-10 rounded-full" />
                     <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                     </div>
                     <Skeleton className="h-8 w-8" />
                  </div>
               ))}
            </div>
         </div>
      </Card>
   );
}

function CategoriesManagementCardContent() {
   const { data: categories } = useQuery(trpc.categories.getAll.queryOptions());

   return (
      <Card>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>
                     Create and manage your personalized categories
                  </CardDescription>
               </div>
            </div>
         </CardHeader>
         <div className="px-6 pb-6">
            <CategoriesTable categories={categories || []} />
         </div>
      </Card>
   );
}

export function CategoriesManagementCard() {
   return <CategoriesManagementCardContent />;
}

export { CategoriesManagementCardSkeleton };

