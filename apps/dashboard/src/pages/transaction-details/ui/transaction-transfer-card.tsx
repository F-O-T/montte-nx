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
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BankAccountAnnouncement } from "@/features/transaction/ui/bank-account-announcement";
import { TransactionMobileCard } from "@/features/transaction/ui/transaction-mobile-card";
import { createTransactionColumns } from "@/features/transaction/ui/transaction-table-columns";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function TransferCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Falha ao carregar informações da transferência
         </AlertDescription>
      </Alert>
   );
}

function TransferCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
               <Skeleton className="h-12 w-32" />
               <Skeleton className="h-4 w-4" />
               <Skeleton className="h-12 w-32" />
            </div>
            <Skeleton className="h-20 w-full" />
         </CardContent>
      </Card>
   );
}

function TransferCardContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();

   const { data: transferLog } = useQuery(
      trpc.transactions.getTransferLog.queryOptions({
         transactionId,
      }),
   );

   const { data: categories } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const isFromTransaction = transferLog?.fromTransactionId === transactionId;
   const counterpartTransactionId = transferLog
      ? isFromTransaction
         ? transferLog.toTransactionId
         : transferLog.fromTransactionId
      : null;

   const { data: counterpartTransaction } = useQuery({
      ...trpc.transactions.getById.queryOptions({
         id: counterpartTransactionId ?? "",
      }),
      enabled: !!counterpartTransactionId,
   });

   if (!transferLog) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Transferência</CardTitle>
               <CardDescription>Informações da transferência</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground text-sm">
                  Esta transação é uma transferência, mas os detalhes do vínculo
                  não foram encontrados.
               </p>
            </CardContent>
         </Card>
      );
   }

   const sourceAccount = isFromTransaction
      ? transferLog.fromBankAccount
      : transferLog.toBankAccount;
   const destinationAccount = isFromTransaction
      ? transferLog.toBankAccount
      : transferLog.fromBankAccount;

   const formattedCategories = categories.map((cat) => ({
      color: cat.color,
      icon: cat.icon,
      id: cat.id,
      name: cat.name,
   }));

   const transactions = counterpartTransaction ? [counterpartTransaction] : [];

   return (
      <Card>
         <CardHeader>
            <CardTitle>Transferência</CardTitle>
            <CardDescription>Informações da transferência</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
               {sourceAccount && (
                  <BankAccountAnnouncement
                     bankAccount={sourceAccount}
                     showLabel={false}
                  />
               )}

               <ArrowRight className="size-4 text-muted-foreground shrink-0" />

               {destinationAccount && (
                  <BankAccountAnnouncement
                     bankAccount={destinationAccount}
                     showLabel={false}
                  />
               )}
            </div>

            {transactions.length > 0 && (
               <DataTable
                  columns={createTransactionColumns(
                     formattedCategories,
                     activeOrganization.slug,
                  )}
                  data={transactions}
                  getRowId={(row) => row.id}
                  renderMobileCard={(props) => (
                     <TransactionMobileCard
                        {...props}
                        categories={formattedCategories}
                     />
                  )}
               />
            )}

            {transferLog.notes && (
               <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Observações: </span>
                  {transferLog.notes}
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export function TransactionTransferCard({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={TransferCardErrorFallback}>
         <Suspense fallback={<TransferCardSkeleton />}>
            <TransferCardContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
