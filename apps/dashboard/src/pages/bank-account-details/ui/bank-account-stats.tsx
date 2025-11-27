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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function BankAccountStatsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4 h-min">
         {createErrorFallback({
            errorDescription:
               "Failed to load bank account stats. Please try again later.",
            errorTitle: "Error loading stats",
            retryText: "Retry",
         })(props)}
      </div>
   );
}

function BankAccountStatsSkeleton() {
   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {[1, 2, 3].map((index) => (
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

function BankAccountStatsContent({ bankAccountId }: { bankAccountId: string }) {
   const trpc = useTRPC();

   const { data } = useSuspenseQuery(
      trpc.bankAccounts.getTransactions.queryOptions({
         id: bankAccountId,
         limit: 100,
         page: 1,
      }),
   );

   const balance = data.transactions.reduce(
      (acc: number, curr: { amount: string; type: string }) => {
         const amount = parseFloat(curr.amount);
         if (curr.type === "income") return acc + amount;
         if (curr.type === "expense") return acc - amount;
         return acc + amount;
      },
      0,
   );

   const income = data.transactions
      .filter((t: { type: string }) => t.type === "income")
      .reduce(
         (acc: number, curr: { amount: string }) =>
            acc + parseFloat(curr.amount),
         0,
      );

   const expense = data.transactions
      .filter((t: { type: string }) => t.type === "expense")
      .reduce(
         (acc: number, curr: { amount: string }) =>
            acc + parseFloat(curr.amount),
         0,
      );

   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatsCard
            description={translate(
               "dashboard.routes.bank-accounts.stats-section.current-balance.description",
            )}
            title={translate(
               "dashboard.routes.bank-accounts.stats-section.current-balance.title",
            )}
            value={new Intl.NumberFormat("pt-BR", {
               currency: "BRL",
               style: "currency",
            }).format(balance)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.bank-accounts.stats-section.total-income.description",
            )}
            title={translate(
               "dashboard.routes.bank-accounts.stats-section.total-income.title",
            )}
            value={new Intl.NumberFormat("pt-BR", {
               currency: "BRL",
               style: "currency",
            }).format(income)}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.bank-accounts.stats-section.total-expenses.description",
            )}
            title={translate(
               "dashboard.routes.bank-accounts.stats-section.total-expenses.title",
            )}
            value={new Intl.NumberFormat("pt-BR", {
               currency: "BRL",
               style: "currency",
            }).format(expense)}
         />
      </div>
   );
}

export function BankAccountStats({ bankAccountId }: { bankAccountId: string }) {
   return (
      <ErrorBoundary FallbackComponent={BankAccountStatsErrorFallback}>
         <Suspense fallback={<BankAccountStatsSkeleton />}>
            <BankAccountStatsContent bankAccountId={bankAccountId} />
         </Suspense>
      </ErrorBoundary>
   );
}
