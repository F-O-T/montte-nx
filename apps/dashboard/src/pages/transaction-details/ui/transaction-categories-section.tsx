import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Split } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useTRPC } from "@/integrations/clients";

function CategoriesErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            {translate(
               "dashboard.routes.transactions.details.error.load-categories",
            )}
         </AlertDescription>
      </Alert>
   );
}

function CategoriesSkeleton() {
   return (
      <Card>
         <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-5 md:h-6 w-32 md:w-40" />
         </CardHeader>
         <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0 md:pt-0">
            <Skeleton className="h-14 md:h-16 w-full" />
            <Skeleton className="h-14 md:h-16 w-full" />
         </CardContent>
      </Card>
   );
}

function CategoriesContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const categories = data.transactionCategories || [];
   const categorySplits = data.categorySplits;
   const hasSplit = categorySplits && categorySplits.length > 0;
   const totalAmount = Math.abs(parseFloat(data.amount)) * 100;

   if (categories.length === 0) {
      return (
         <Card>
            <CardHeader className="p-4 md:p-6">
               <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  {translate(
                     "dashboard.routes.transactions.details.categories.title",
                  )}
               </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
               <p className="text-muted-foreground text-xs md:text-sm">
                  {translate(
                     "dashboard.routes.transactions.details.categories.empty",
                  )}
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
               {translate(
                  "dashboard.routes.transactions.details.categories.title",
               )}
               {hasSplit && (
                  <Badge className="gap-1 text-xs" variant="secondary">
                     <Split className="size-3" />
                     <span className="hidden md:inline">
                        {translate(
                           "dashboard.routes.transactions.details.categories.split",
                        )}
                     </span>
                  </Badge>
               )}
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0 md:pt-0">
            {categories.map(({ category }) => {
               const split = categorySplits?.find(
                  (s) => s.categoryId === category.id,
               );
               const splitValue = split?.value || 0;
               const percentage = hasSplit
                  ? Math.round((splitValue / totalAmount) * 100)
                  : 0;
               const displayAmount = hasSplit
                  ? formatDecimalCurrency(splitValue / 100)
                  : null;

               return (
                  <div
                     className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 rounded-lg border p-3 md:p-4"
                     key={category.id}
                  >
                     <div
                        className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: category.color }}
                     >
                        <IconDisplay
                           iconName={(category.icon || "Tag") as IconName}
                           size={16}
                        />
                     </div>
                     <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="font-medium text-sm md:text-base">
                              {category.name}
                           </span>
                           {hasSplit && displayAmount && (
                              <div className="flex items-center gap-2">
                                 <span className="text-xs md:text-sm text-muted-foreground">
                                    {percentage}%
                                 </span>
                                 <Badge
                                    className="text-xs md:text-sm"
                                    variant="outline"
                                 >
                                    {displayAmount}
                                 </Badge>
                              </div>
                           )}
                        </div>
                        {hasSplit && (
                           <Progress
                              className="h-1.5 md:h-2"
                              style={
                                 {
                                    "--progress-background": category.color,
                                 } as React.CSSProperties
                              }
                              value={percentage}
                           />
                        )}
                     </div>
                  </div>
               );
            })}

            {hasSplit && (
               <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2 md:p-3">
                  <span className="text-xs md:text-sm font-medium">
                     {translate(
                        "dashboard.routes.transactions.details.categories.total",
                     )}
                  </span>
                  <span className="font-semibold text-sm md:text-base">
                     {formatDecimalCurrency(totalAmount / 100)}
                  </span>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export function TransactionCategoriesSection({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={CategoriesErrorFallback}>
         <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
