import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   ArrowDownRight,
   ArrowUpRight,
   Building,
   Calendar,
   Tag,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function StatsErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            {translate(
               "dashboard.routes.transactions.details.error.load-stats",
            )}
         </AlertDescription>
      </Alert>
   );
}

function StatsSkeleton() {
   return (
      <Card className="h-full flex flex-col">
         <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
         </CardHeader>
         <CardContent className="flex-1 flex flex-col justify-between gap-3 md:gap-4 p-4 md:p-6 pt-0 md:pt-0">
            <Skeleton className="h-16 md:h-20 w-full" />
            <Skeleton className="h-16 md:h-20 w-full" />
            <Skeleton className="h-16 md:h-20 w-full" />
            <Skeleton className="h-16 md:h-20 w-full" />
         </CardContent>
      </Card>
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

   const createdAt = formatDate(new Date(data.createdAt), "DD/MM/YYYY");
   const updatedAt = formatDate(new Date(data.updatedAt), "DD/MM/YYYY");

   const stats = [
      {
         description: translate(
            "dashboard.routes.transactions.details.stats.amount.description",
         ),
         icon: isPositive ? (
            <ArrowUpRight className="size-5 text-green-500" />
         ) : (
            <ArrowDownRight className="size-5 text-red-500" />
         ),
         title: translate(
            "dashboard.routes.transactions.details.stats.amount.title",
         ),
         value: `${isPositive ? "+" : "-"}${formattedAmount}`,
      },
      {
         description: translate(
            "dashboard.routes.transactions.details.stats.categories.description",
         ),
         icon: <Tag className="size-5 text-muted-foreground" />,
         title: translate(
            "dashboard.routes.transactions.details.stats.categories.title",
         ),
         value: data.transactionCategories?.length || 0,
      },
      {
         description: data.bankAccount?.bank || "-",
         icon: <Building className="size-5 text-muted-foreground" />,
         title: translate(
            "dashboard.routes.transactions.details.stats.bank-account.title",
         ),
         value: data.bankAccount?.name || "-",
      },
      {
         description: `${translate("dashboard.routes.transactions.details.stats.updated.description")}: ${updatedAt}`,
         icon: <Calendar className="size-5 text-muted-foreground" />,
         title: translate(
            "dashboard.routes.transactions.details.stats.created.title",
         ),
         value: createdAt,
      },
   ];

   return (
      <Card className="h-full flex flex-col">
         <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">
               {translate("dashboard.routes.transactions.details.stats.title")}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
               {translate(
                  "dashboard.routes.transactions.details.stats.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-1 flex flex-col justify-between gap-3 md:gap-4 p-4 md:p-6 pt-0 md:pt-0">
            {stats.map((stat, index) => (
               <div
                  className="flex items-start gap-2 md:gap-3 rounded-lg border p-2 md:p-3"
                  key={`stat-${index + 1}`}
               >
                  <div className="mt-0.5 hidden md:block">{stat.icon}</div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs md:text-sm text-muted-foreground">
                        {stat.title}
                     </p>
                     <p className="font-semibold text-sm md:text-base truncate">
                        {stat.value}
                     </p>
                     <p className="text-xs text-muted-foreground truncate">
                        {stat.description}
                     </p>
                  </div>
               </div>
            ))}
         </CardContent>
      </Card>
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
