import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function BudgetErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Failed to load budget information</AlertDescription>
      </Alert>
   );
}

function BudgetSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-24" />
            </CardTitle>
         </CardHeader>
         <CardContent>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between mt-2">
               <Skeleton className="h-4 w-16" />
               <Skeleton className="h-4 w-16" />
            </div>
         </CardContent>
      </Card>
   );
}

function CategoryBudgetContent({ categoryId }: { categoryId: string }) {
   const trpc = useTRPC();
   const { data: category } = useSuspenseQuery(
      trpc.categories.getById.queryOptions({ id: categoryId }),
   );

   // Fetch transactions to calculate spent amount
   // Using the same logic as stats (limit 100 for now)
   const { data: transactionsData } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions({
         category: category.name,
         limit: 100,
         page: 1,
      }),
   );

   const budget = 0; // Budget not yet supported in schema

   if (budget === 0) {
      return (
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">
                  {translate(
                     "dashboard.routes.categories.details-section.budget.title",
                  )}
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-sm text-muted-foreground">
                  {translate(
                     "dashboard.routes.categories.details-section.budget.not-set",
                  )}
               </div>
            </CardContent>
         </Card>
      );
   }

   const spent = transactionsData.transactions
      .filter((t: { type: string }) => t.type === "expense")
      .reduce(
         (acc: number, curr: { amount: string | number }) =>
            acc + Number(curr.amount),
         0,
      );

   const percentage = Math.min(Math.round((spent / budget) * 100), 100);
   const isExceeded = spent > budget;

   const formattedSpent = new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
   }).format(spent);

   const formattedBudget = new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
   }).format(budget);

   return (
      <Card>
         <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between">
               <span>
                  {translate(
                     "dashboard.routes.categories.details-section.budget.title",
                  )}
               </span>
               <span
                  className={
                     isExceeded ? "text-destructive" : "text-muted-foreground"
                  }
               >
                  {formattedSpent} / {formattedBudget}
               </span>
            </CardTitle>
         </CardHeader>
         <CardContent>
            <Progress
               className={
                  isExceeded ? "bg-destructive/20 [&>div]:bg-destructive" : ""
               }
               value={percentage}
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
               <span>
                  {percentage}%{" "}
                  {translate(
                     "dashboard.routes.categories.details-section.budget.spent",
                  )}
               </span>
               <span>
                  {isExceeded
                     ? translate(
                          "dashboard.routes.categories.details-section.budget.exceeded",
                       )
                     : translate(
                          "dashboard.routes.categories.details-section.budget.remaining",
                       ) +
                       ": " +
                       new Intl.NumberFormat("pt-BR", {
                          currency: "BRL",
                          style: "currency",
                       }).format(budget - spent)}
               </span>
            </div>
         </CardContent>
      </Card>
   );
}

export function CategoryBudget({ categoryId }: { categoryId: string }) {
   return (
      <ErrorBoundary FallbackComponent={BudgetErrorFallback}>
         <Suspense fallback={<BudgetSkeleton />}>
            <CategoryBudgetContent categoryId={categoryId} />
         </Suspense>
      </ErrorBoundary>
   );
}
