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
import { StatsCard } from "@packages/ui/components/stats-card";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function StatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription: translate(
               "dashboard.routes.transactions.details.error.load-stats",
            ),
            errorTitle: "Error loading stats",
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function StatsSkeleton() {
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`stats-skeleton-${index}`}
            >
               <CardHeader>
                  <CardTitle>
                     <Skeleton className="h-6 w-24" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-4 w-32" />
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <Skeleton className="h-10 w-16" />
               </CardContent>
            </Card>
         ))}
      </div>
   );
}

function StatsContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const amount = parseFloat(data.amount);
   const isPositive =
      data.type === "income" || (data.type === "transfer" && amount > 0);
   const formattedAmount = formatDecimalCurrency(Math.abs(amount));

   const formattedDate = formatDate(new Date(data.date), "DD MMMM YYYY");

   const typeLabels: Record<string, string> = {
      expense: translate(
         "dashboard.routes.transactions.list-section.types.expense",
      ),
      income: translate(
         "dashboard.routes.transactions.list-section.types.income",
      ),
      transfer: translate(
         "dashboard.routes.transactions.list-section.types.transfer",
      ),
   };

   const createdAt = formatDate(new Date(data.createdAt), "DD/MM/YYYY");

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsCard
            description={translate(
               "dashboard.routes.transactions.details.stats.amount.description",
            )}
            title={translate(
               "dashboard.routes.transactions.details.stats.amount.title",
            )}
            value={`${isPositive ? "+" : "-"}${formattedAmount}`}
         />
         <StatsCard
            description={formattedDate}
            title={translate(
               "dashboard.routes.transactions.details.stats.type.title",
            )}
            value={typeLabels[data.type] || data.type}
         />
         <StatsCard
            description={data.bankAccount?.bank || "-"}
            title={translate(
               "dashboard.routes.transactions.details.stats.bank-account.title",
            )}
            value={data.bankAccount?.name || "-"}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.transactions.details.stats.created.description",
            )}
            title={translate(
               "dashboard.routes.transactions.details.stats.created.title",
            )}
            value={createdAt}
         />
      </div>
   );
}

export function TransactionStats({ transactionId }: { transactionId: string }) {
   return (
      <ErrorBoundary FallbackComponent={StatsErrorFallback}>
         <Suspense fallback={<StatsSkeleton />}>
            <StatsContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
