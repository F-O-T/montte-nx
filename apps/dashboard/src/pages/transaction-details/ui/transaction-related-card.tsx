import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TransactionExpandedContent } from "@/features/transaction/ui/transaction-expanded-content";
import { TransactionMobileCard } from "@/features/transaction/ui/transaction-mobile-card";
import {
   createSimilarTransactionColumns,
   type TransactionWithScore,
} from "@/features/transaction/ui/transaction-table-columns";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function RelatedCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Falha ao carregar transações similares
         </AlertDescription>
      </Alert>
   );
}

function RelatedCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
         </CardHeader>
         <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
         </CardContent>
      </Card>
   );
}

function RelatedCardContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();
   const [currentPage, setCurrentPage] = useState(1);
   const pageSize = 10;

   const { data: categories } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: similarTransactions } = useQuery(
      trpc.transactions.getSimilarTransactions.queryOptions({
         limit: 50,
         transactionId,
      }),
   );

   const formattedCategories = categories.map((cat) => ({
      color: cat.color,
      icon: cat.icon,
      id: cat.id,
      name: cat.name,
   }));

   const allTransactionsWithScore: TransactionWithScore[] =
      similarTransactions?.map((item) => ({
         ...item.transaction,
         score: item.score,
      })) ?? [];

   const totalCount = allTransactionsWithScore.length;
   const totalPages = Math.ceil(totalCount / pageSize);
   const paginatedTransactions = allTransactionsWithScore.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
   );

   if (allTransactionsWithScore.length === 0) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Transações Similares</CardTitle>
            <CardDescription>
               {totalCount} transações com características semelhantes
            </CardDescription>
         </CardHeader>
         <CardContent>
            <DataTable
               columns={createSimilarTransactionColumns(
                  formattedCategories,
                  activeOrganization.slug,
               )}
               data={paginatedTransactions}
               getRowId={(row) => row.id}
               pagination={{
                  currentPage,
                  onPageChange: setCurrentPage,
                  pageSize,
                  totalCount,
                  totalPages,
               }}
               renderMobileCard={(props) => (
                  <TransactionMobileCard
                     {...props}
                     categories={formattedCategories}
                  />
               )}
               renderSubComponent={(props) => (
                  <TransactionExpandedContent
                     {...props}
                     categories={formattedCategories}
                     slug={activeOrganization.slug}
                  />
               )}
            />
         </CardContent>
      </Card>
   );
}

export function TransactionRelatedCard({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={RelatedCardErrorFallback}>
         <Suspense fallback={<RelatedCardSkeleton />}>
            <RelatedCardContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
