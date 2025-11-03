import { Suspense } from "react";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { AddCategorySheet } from "../features/add-category-sheet";
import { CategoriesManagementCard } from "./categories-management-card";
import { HighestExpenseCard, HighestIncomeCard, MostTransactionsCard } from "./category-stat-cards";

// Skeleton components
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
                  <div key={`category-skeleton-${index}`} className="flex items-center space-x-4 p-4 border rounded-lg">
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

function StatCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <div className="flex items-center gap-2">
               <Skeleton className="h-4 w-4" />
               <CardTitle>
                  <Skeleton className="h-6 w-32" />
               </CardTitle>
            </div>
            <CardDescription>
               <Skeleton className="h-4 w-40 mt-2" />
            </CardDescription>
         </CardHeader>
         <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center gap-3">
               <Skeleton className="w-3 h-3 rounded-full" />
               <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
         </div>
      </Card>
   );
}

// Error fallbacks
function CategoriesErrorFallback({
   error,
   resetErrorBoundary,
}: {
   error: Error;
   resetErrorBoundary: () => void;
}) {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <Card>
            <CardHeader>
               <CardTitle>Categories</CardTitle>
               <CardDescription>
                  Create and manage your personalized categories
               </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
               <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                     <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
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
            </div>
         </Card>

         <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
               <Card key={`error-card-${index}`}>
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Analytics unavailable
                     </CardTitle>
                     <CardDescription>
                        Category insights temporarily unavailable
                     </CardDescription>
                  </CardHeader>
                  <div className="px-6 pb-6">
                     <div className="text-center space-y-2">
                        <p className="text-muted-foreground text-sm">
                           {error.message || "An unexpected error occurred"}
                        </p>
                     </div>
                  </div>
               </Card>
            ))}
         </div>
      </main>
   );
}

// Main content
function CategoriesContent() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div>
                     <CardTitle>Categories</CardTitle>
                     <CardDescription>
                        Create and manage your personalized categories
                     </CardDescription>
                  </div>
                  <AddCategorySheet />
               </div>
            </CardHeader>
            <div className="px-6 pb-6">
               <Suspense fallback={<CategoriesManagementCardSkeleton />}>
                  <CategoriesManagementCard />
               </Suspense>
            </div>
         </Card>

         <div className="grid md:grid-cols-3 gap-4">
            <Suspense fallback={<StatCardSkeleton />}>
               <HighestExpenseCard />
            </Suspense>
            <Suspense fallback={<StatCardSkeleton />}>
               <HighestIncomeCard />
            </Suspense>
            <Suspense fallback={<StatCardSkeleton />}>
               <MostTransactionsCard />
            </Suspense>
         </div>
      </main>
   );
}

// Main page component
export function CategoriesPage() {
   return (
      <ErrorBoundary FallbackComponent={CategoriesErrorFallback}>
         <Suspense
            fallback={
               <main className="flex flex-col h-full w-full gap-4">
                  <CategoriesManagementCardSkeleton />
                  <div className="grid md:grid-cols-3 gap-4">
                     <StatCardSkeleton />
                     <StatCardSkeleton />
                     <StatCardSkeleton />
                  </div>
               </main>
            }
         >
            <CategoriesContent />
         </Suspense>
      </ErrorBoundary>
   );
}