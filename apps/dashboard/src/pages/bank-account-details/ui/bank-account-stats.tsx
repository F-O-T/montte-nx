import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function StatErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Failed to load statistics</AlertDescription>
      </Alert>
   );
}

function StatSkeleton() {
   return (
      <Card className="col-span-1 h-full w-full">
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
   );
}

function AccountBalanceStat({ bankAccountId }: { bankAccountId: string }) {
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

   return (
      <StatsCard
         description="Current calculated balance"
         title="Balance"
         value={new Intl.NumberFormat("pt-BR", {
            currency: "BRL",
            style: "currency",
         }).format(balance)}
      />
   );
}

function AccountIncomeStat({ bankAccountId }: { bankAccountId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.bankAccounts.getTransactions.queryOptions({
         id: bankAccountId,
         limit: 100,
         page: 1,
      }),
   );

   const income = data.transactions
      .filter((t: { type: string }) => t.type === "income")
      .reduce(
         (acc: number, curr: { amount: string }) =>
            acc + parseFloat(curr.amount),
         0,
      );

   return (
      <StatsCard
         description="Total income"
         title="Income"
         value={new Intl.NumberFormat("pt-BR", {
            currency: "BRL",
            style: "currency",
         }).format(income)}
      />
   );
}

function AccountExpenseStat({ bankAccountId }: { bankAccountId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.bankAccounts.getTransactions.queryOptions({
         id: bankAccountId,
         limit: 100,
         page: 1,
      }),
   );

   const expense = data.transactions
      .filter((t: { type: string }) => t.type === "expense")
      .reduce(
         (acc: number, curr: { amount: string }) =>
            acc + parseFloat(curr.amount),
         0,
      );

   return (
      <StatsCard
         description="Total expenses"
         title="Expenses"
         value={new Intl.NumberFormat("pt-BR", {
            currency: "BRL",
            style: "currency",
         }).format(expense)}
      />
   );
}

export function BankAccountStats({ bankAccountId }: { bankAccountId: string }) {
   return (
      <div className="grid grid-cols-1 gap-4">
         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <AccountBalanceStat bankAccountId={bankAccountId} />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <AccountIncomeStat bankAccountId={bankAccountId} />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <AccountExpenseStat bankAccountId={bankAccountId} />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
