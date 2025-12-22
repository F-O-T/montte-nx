import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function HomeBalanceCardErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.home.balance-card.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.home.balance-card.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function HomeBalanceCardSkeleton() {
   return (
      <Card>
         <CardHeader className="text-center">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-10 w-48 mx-auto" />
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

function HomeBalanceCardContent() {
   const trpc = useTRPC();
   const { end: endDate, start: startDate } = getCurrentMonthDates();

   const { data: stats } = useSuspenseQuery(
      trpc.transactions.getStats.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const netBalance = stats.totalIncome - stats.totalExpenses;

   return (
      <Card>
         <CardHeader className="text-center pb-2">
            <CardDescription>
               {translate("dashboard.routes.home.balance-card.title")}
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
               {formatDecimalCurrency(netBalance)}
            </CardTitle>
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 gap-4">
               <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                     <div className="flex items-center gap-2">
                        <div className="rounded-full bg-green-500/10 p-2">
                           <ArrowUpRight className="size-4 text-green-500" />
                        </div>
                        <CardDescription>
                           {translate(
                              "dashboard.routes.home.balance-card.income",
                           )}
                        </CardDescription>
                     </div>
                     <CardTitle className="text-xl text-green-500">
                        {formatDecimalCurrency(stats.totalIncome)}
                     </CardTitle>
                  </CardHeader>
               </Card>

               <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                     <div className="flex items-center gap-2">
                        <div className="rounded-full bg-red-500/10 p-2">
                           <ArrowDownRight className="size-4 text-red-500" />
                        </div>
                        <CardDescription>
                           {translate(
                              "dashboard.routes.home.balance-card.expenses",
                           )}
                        </CardDescription>
                     </div>
                     <CardTitle className="text-xl text-red-500">
                        {formatDecimalCurrency(stats.totalExpenses)}
                     </CardTitle>
                  </CardHeader>
               </Card>
            </div>
         </CardContent>
      </Card>
   );
}

export function HomeBalanceCard() {
   return (
      <ErrorBoundary FallbackComponent={HomeBalanceCardErrorFallback}>
         <Suspense fallback={<HomeBalanceCardSkeleton />}>
            <HomeBalanceCardContent />
         </Suspense>
      </ErrorBoundary>
   );
}
