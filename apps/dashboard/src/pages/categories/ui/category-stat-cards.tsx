import { useQuery } from "@tanstack/react-query";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { TrendingDown, TrendingUp, FolderOpen } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/integrations/clients";

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

function HighestExpenseCardContent() {
   const { mostSpentCategory } = useCategoriesWithStats();

   const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD',
      }).format(Math.abs(amount));
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <TrendingDown className="h-4 w-4" />
               Highest Expense
            </CardTitle>
            <CardDescription>
               Category where you spend the most money
            </CardDescription>
         </CardHeader>
         <div className="px-6 pb-6">
            {mostSpentCategory ? (
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: mostSpentCategory.color }}
                     />
                     <span className="font-medium">{mostSpentCategory.categoryName}</span>
                  </div>
                  <div className="text-2xl font-bold text-destructive">
                     -{formatCurrency(mostSpentCategory.totalAmount)}
                  </div>
               </div>
            ) : (
               <div className="text-center space-y-2">
                  <div className="text-muted-foreground">No expenses yet</div>
                  <div className="text-sm text-muted-foreground">
                     Your expense analytics will appear here
                  </div>
               </div>
            )}
         </div>
      </Card>
   );
}

function HighestIncomeCardContent() {
   const { mostIncomeCategory } = useCategoriesWithStats();

   const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD',
      }).format(Math.abs(amount));
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <TrendingUp className="h-4 w-4" />
               Highest Income
            </CardTitle>
            <CardDescription>
               Category that generates the most income
            </CardDescription>
         </CardHeader>
         <div className="px-6 pb-6">
            {mostIncomeCategory ? (
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: mostIncomeCategory.color }}
                     />
                     <span className="font-medium">{mostIncomeCategory.categoryName}</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                     +{formatCurrency(mostIncomeCategory.totalAmount)}
                  </div>
               </div>
            ) : (
               <div className="text-center space-y-2">
                  <div className="text-muted-foreground">No income yet</div>
                  <div className="text-sm text-muted-foreground">
                     Your income analytics will appear here
                  </div>
               </div>
            )}
         </div>
      </Card>
   );
}

function MostTransactionsCardContent() {
   const { mostItemsCategory } = useCategoriesWithStats();

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <FolderOpen className="h-4 w-4" />
               Most Transactions
            </CardTitle>
            <CardDescription>
               Category with the highest number of transactions
            </CardDescription>
         </CardHeader>
         <div className="px-6 pb-6">
            {mostItemsCategory ? (
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: mostItemsCategory.color }}
                     />
                     <span className="font-medium">{mostItemsCategory.categoryName}</span>
                  </div>
                  <div className="text-2xl font-bold">
                     {mostItemsCategory.count} <span className="text-lg font-normal text-muted-foreground">items</span>
                  </div>
               </div>
            ) : (
               <div className="text-center space-y-2">
                  <div className="text-muted-foreground">No transactions yet</div>
                  <div className="text-sm text-muted-foreground">
                     Start adding transactions to see analytics
                  </div>
               </div>
            )}
         </div>
      </Card>
   );
}

export function HighestExpenseCard() {
   return <HighestExpenseCardContent />;
}

export function HighestIncomeCard() {
   return <HighestIncomeCardContent />;
}

export function MostTransactionsCard() {
   return <MostTransactionsCardContent />;
}

export { StatCardSkeleton };