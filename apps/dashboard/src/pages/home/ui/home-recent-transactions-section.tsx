import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { Fragment, Suspense } from "react";
import type { FallbackProps } from "react-error-boundary";
import { ErrorBoundary } from "react-error-boundary";
import { TransactionMobileCard } from "@/features/transaction/ui/transaction-mobile-card";
import { createTransactionColumns } from "@/features/transaction/ui/transaction-table-columns";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function RecentTransactionsCardHeader() {
   return (
      <CardHeader>
         <CardTitle>
            {translate("dashboard.routes.home.recent-transactions.title")}
         </CardTitle>
         <CardDescription>
            {translate("dashboard.routes.home.recent-transactions.description")}
         </CardDescription>
      </CardHeader>
   );
}

function HomeRecentTransactionsErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <RecentTransactionsCardHeader />
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.home.recent-transactions.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.home.recent-transactions.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function HomeRecentTransactionsSkeleton() {
   return (
      <Card className="w-full">
         <RecentTransactionsCardHeader />
         <CardContent>
            <ItemGroup>
               {[1, 2, 3].map((index) => (
                  <Fragment key={index}>
                     <div className="flex items-center justify-between gap-4 py-2">
                        <Skeleton className="h-8 w-8 rounded-sm" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-40" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                     </div>
                     {index !== 3 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function HomeRecentTransactionsContent() {
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();

   const { data } = useSuspenseQuery(
      trpc.transactions.getAllPaginated.queryOptions({
         limit: 5,
         orderBy: "date",
         orderDirection: "desc",
         page: 1,
      }),
   );

   const { transactions } = data;

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   return (
      <Card className="w-full h-full">
         <RecentTransactionsCardHeader />
         <CardContent>
            {transactions.length === 0 ? (
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Wallet />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.home.recent-transactions.state.empty.title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.home.recent-transactions.state.empty.description",
                        )}
                     </EmptyDescription>
                  </EmptyContent>
               </Empty>
            ) : (
               <DataTable
                  columns={createTransactionColumns(
                     categories,
                     activeOrganization.slug,
                  )}
                  data={transactions}
                  getRowId={(row) => row.id}
                  renderMobileCard={(props) => (
                     <TransactionMobileCard
                        {...props}
                        categories={categories}
                     />
                  )}
               />
            )}
         </CardContent>
      </Card>
   );
}

export function HomeRecentTransactionsSection() {
   return (
      <ErrorBoundary FallbackComponent={HomeRecentTransactionsErrorFallback}>
         <Suspense fallback={<HomeRecentTransactionsSkeleton />}>
            <HomeRecentTransactionsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
