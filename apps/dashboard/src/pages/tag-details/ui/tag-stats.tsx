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

function TagTotalStat({ tagId }: { tagId: string }) {
   const trpc = useTRPC();

   const { data: tag } = useSuspenseQuery(
      trpc.tags.getById.queryOptions({ id: tagId }),
   );

   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions({
         search: tag.name,
         limit: 100,
         page: 1,
      }),
   );

   return (
      <StatsCard
         description={translate(
            "dashboard.routes.transactions.stats-section.total.description",
         )}
         title={translate(
            "dashboard.routes.transactions.stats-section.total.title",
         )}
         value={data.pagination.totalCount}
      />
   );
}

function TagIncomeStat({ tagId }: { tagId: string }) {
   const trpc = useTRPC();

   const { data: tag } = useSuspenseQuery(
      trpc.tags.getById.queryOptions({ id: tagId }),
   );

   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions({
         search: tag.name,
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
         description={translate(
            "dashboard.routes.transactions.stats-section.income.description",
         )}
         title={translate(
            "dashboard.routes.transactions.stats-section.income.title",
         )}
         value={new Intl.NumberFormat("pt-BR", {
            currency: "BRL",
            style: "currency",
         }).format(income)}
      />
   );
}

function TagExpenseStat({ tagId }: { tagId: string }) {
   const trpc = useTRPC();

   const { data: tag } = useSuspenseQuery(
      trpc.tags.getById.queryOptions({ id: tagId }),
   );

   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions({
         search: tag.name,
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
         description={translate(
            "dashboard.routes.transactions.stats-section.expense.description",
         )}
         title={translate(
            "dashboard.routes.transactions.stats-section.expense.title",
         )}
         value={new Intl.NumberFormat("pt-BR", {
            currency: "BRL",
            style: "currency",
         }).format(expense)}
      />
   );
}

export function TagStats({ tagId }: { tagId: string }) {
   return (
      <div className="grid grid-cols-1 gap-4 h-min">
         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <TagTotalStat tagId={tagId} />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <TagIncomeStat tagId={tagId} />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <TagExpenseStat tagId={tagId} />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
