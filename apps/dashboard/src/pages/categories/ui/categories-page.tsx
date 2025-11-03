import { useQuery } from "@tanstack/react-query";
import {
   Badge,
} from "@packages/ui/components/badge";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { AlertCircle, TrendingDown, TrendingUp, FolderOpen } from "lucide-react";
import { Suspense, useMemo } from "react";
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

export type Transaction = {
   amount: number;
   category: string;
   date: string;
   description: string;
   id: string;
   type: "income" | "expense";
};

interface CategoryStats {
   categoryId: string;
   categoryName: string;
   count: number;
   totalAmount: number;
   color: string;
   icon: string;
}

// Hook to calculate category statistics
function useCategoriesWithStats() {
   const { data: categories } = useQuery(trpc.categories.getAll.queryOptions());
   const { data: transactions } = useQuery(trpc.transactions.getAll.queryOptions());

   const categoryStats = useMemo(() => {
      if (!categories || !transactions) return [];

      // Transform transactions like in transactions page
      const uiTransactions: Transaction[] = transactions.map((transaction: any) => ({
         ...transaction,
         amount: parseFloat(transaction.amount),
         date: transaction.date.toISOString().split("T")[0],
      }));

      // Calculate stats for each category
      const stats = categories.map((category: Category) => {
         const categoryTransactions = uiTransactions.filter(
            (transaction) => transaction.category === category.id,
         );

         return {
            categoryId: category.id,
            categoryName: category.name,
            count: categoryTransactions.length,
            totalAmount: categoryTransactions.reduce(
               (sum, transaction) => sum + transaction.amount,
               0,
            ),
            color: category.color,
            icon: category.icon,
         } as CategoryStats;
      });

      return stats;
   }, [categories, transactions]);

   const mostItemsCategory = useMemo(() => {
      return categoryStats
         .filter((stat) => stat.count > 0)
         .sort((a, b) => b.count - a.count)[0];
   }, [categoryStats]);

   const mostSpentCategory = useMemo(() => {
      return categoryStats
         .filter((stat) => stat.totalAmount < 0)
         .sort((a, b) => a.totalAmount - b.totalAmount)[0];
   }, [categoryStats]);

   const mostIncomeCategory = useMemo(() => {
      return categoryStats
         .filter((stat) => stat.totalAmount > 0)
         .sort((a, b) => b.totalAmount - a.totalAmount)[0];
   }, [categoryStats]);

   return {
      categories,
      categoryStats,
      mostItemsCategory,
      mostSpentCategory,
      mostIncomeCategory,
   };
}

// Categories Management Card
function CategoriesManagementCard() {
   const { categories } = useCategoriesWithStats();

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
               <AddCategorySheet />
            </div>
         </CardHeader>
         <div className="px-6 pb-6">
            <CategoriesTable categories={categories || []} />
         </div>
      </Card>
   );
}

// Category Analytics Card
function CategoryAnalyticsCard() {
   const { mostItemsCategory, mostSpentCategory, mostIncomeCategory } = useCategoriesWithStats();

   const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD',
      }).format(Math.abs(amount));
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Category Analytics</CardTitle>
            <CardDescription>
               Insights about your spending and income by category
            </CardDescription>
         </CardHeader>
         <div className="px-6 pb-6 space-y-6">
            {/* Most Items Category */}
            <div>
               <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Most Transactions
               </h4>
               {mostItemsCategory ? (
                  <Item>
                     <ItemContent>
                        <div className="flex items-center gap-3">
                           <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: mostItemsCategory.color }}
                           />
                           <ItemTitle>{mostItemsCategory.categoryName}</ItemTitle>
                           <Badge variant="secondary">{mostItemsCategory.count} items</Badge>
                        </div>
                        <ItemDescription>
                           Category with the highest number of transactions
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               ) : (
                  <Item>
                     <ItemContent>
                        <ItemTitle>No transactions yet</ItemTitle>
                        <ItemDescription>
                           Start adding transactions to see analytics
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               )}
            </div>

            {/* Most Spent Category */}
            <div>
               <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Highest Expenses
               </h4>
               {mostSpentCategory ? (
                  <Item>
                     <ItemContent>
                        <div className="flex items-center gap-3">
                           <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: mostSpentCategory.color }}
                           />
                           <ItemTitle>{mostSpentCategory.categoryName}</ItemTitle>
                           <Badge variant="destructive">
                              -{formatCurrency(mostSpentCategory.totalAmount)}
                           </Badge>
                        </div>
                        <ItemDescription>
                           Category where you spend the most money
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               ) : (
                  <Item>
                     <ItemContent>
                        <ItemTitle>No expenses yet</ItemTitle>
                        <ItemDescription>
                           Your expense analytics will appear here
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               )}
            </div>

            {/* Most Income Category */}
            <div>
               <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Highest Income
               </h4>
               {mostIncomeCategory ? (
                  <Item>
                     <ItemContent>
                        <div className="flex items-center gap-3">
                           <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: mostIncomeCategory.color }}
                           />
                           <ItemTitle>{mostIncomeCategory.categoryName}</ItemTitle>
                           <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              +{formatCurrency(mostIncomeCategory.totalAmount)}
                           </Badge>
                        </div>
                        <ItemDescription>
                           Category that generates the most income
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               ) : (
                  <Item>
                     <ItemContent>
                        <ItemTitle>No income yet</ItemTitle>
                        <ItemDescription>
                           Your income analytics will appear here
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               )}
            </div>
         </div>
      </Card>
   );
}

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

function CategoryAnalyticsCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-48 mt-2" />
            </CardDescription>
         </CardHeader>
         <div className="px-6 pb-6 space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
               <div key={`analytics-skeleton-${index}`}>
                  <div className="flex items-center gap-2 mb-3">
                     <Skeleton className="h-4 w-4" />
                     <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16" />
                     </div>
                     <Skeleton className="h-3 w-32" />
                  </div>
               </div>
            ))}
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
         <div className="grid md:grid-cols-2 gap-4">
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
            <Card>
               <CardHeader>
                  <CardTitle>Category Analytics</CardTitle>
                  <CardDescription>
                     Insights about your spending and income by category
                  </CardDescription>
               </CardHeader>
               <div className="px-6 pb-6">
                  <div className="flex items-center justify-center h-96">
                     <div className="text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-semibold text-destructive">
                           Analytics unavailable
                        </h2>
                        <p className="text-muted-foreground">
                           {error.message || "An unexpected error occurred"}
                        </p>
                     </div>
                  </div>
               </div>
            </Card>
         </div>
      </main>
   );
}

// Main content
function CategoriesContent() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid md:grid-cols-2 gap-4">
            <CategoriesManagementCard />
            <CategoryAnalyticsCard />
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
                  <div className="grid md:grid-cols-2 gap-4">
                     <CategoriesManagementCardSkeleton />
                     <CategoryAnalyticsCardSkeleton />
                  </div>
               </main>
            }
         >
            <CategoriesContent />
         </Suspense>
      </ErrorBoundary>
   );
}