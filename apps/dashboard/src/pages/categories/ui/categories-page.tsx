import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import { AddCategorySheet } from "../features/add-category-sheet";
import { CategoriesTable } from "./categories-table";

export type Category = {
   color: string;
   icon: string;
   id: string;
   name: string;
};

function CategoriesContent() {
   const { data: categories } = useQuery(trpc.categories.getAll.queryOptions());

   return (
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
               <p className="text-muted-foreground mt-1">
                  Create and manage your personalized categories
               </p>
            </div>
            <AddCategorySheet />
         </div>

         <CategoriesTable categories={categories || []} />
      </div>
   );
}

function CategoriesErrorFallback({
   error,
   resetErrorBoundary,
}: {
   error: Error;
   resetErrorBoundary: () => void;
}) {
   return (
      <div className="flex items-center justify-center h-96">
         <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">
               Failed to load categories
            </h2>
            <p className="text-muted-foreground">
               {error.message || "An unexpected error occurred"}
            </p>
            <button
               className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
               onClick={resetErrorBoundary}
            >
               Try again
            </button>
         </div>
      </div>
   );
}

export function CategoriesPage() {
   return (
      <ErrorBoundary FallbackComponent={CategoriesErrorFallback}>
         <Suspense
            fallback={
               <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                     <p className="text-muted-foreground">
                        Loading categories...
                     </p>
                  </div>
               </div>
            }
         >
            <CategoriesContent />
         </Suspense>
      </ErrorBoundary>
   );
}
