import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
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
import { Receipt } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
   BillMobileCard,
   createBillColumns,
} from "@/features/bill/ui/bill-table-columns";
import { useTRPC } from "@/integrations/clients";

function LinkedBillsCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar conta vinculada</AlertDescription>
      </Alert>
   );
}

function LinkedBillsCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
         </CardHeader>
         <CardContent>
            <Skeleton className="h-20 w-full" />
         </CardContent>
      </Card>
   );
}

function LinkedBillsCardContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();

   const { data: bill } = useQuery({
      ...trpc.bills.getByTransactionId.queryOptions({ transactionId }),
   });

   const { data: categories } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   if (!bill) {
      return (
         <Card className="flex-1 flex flex-col">
            <CardHeader>
               <CardTitle>Conta Vinculada</CardTitle>
               <CardDescription>
                  Vincule esta transação a uma conta
               </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center py-8 text-center">
               <Receipt className="size-12 text-muted-foreground/50 mb-3" />
               <p className="text-muted-foreground text-sm">
                  Nenhuma conta vinculada a esta transação.
               </p>
            </CardContent>
         </Card>
      );
   }

   const bills = [bill] as BillWithRelations[];

   return (
      <Card className="flex-1 flex flex-col">
         <CardHeader>
            <CardTitle>Conta Vinculada</CardTitle>
            <CardDescription>
               Esta transação está vinculada a uma conta
            </CardDescription>
         </CardHeader>
         <CardContent>
            <DataTable
               columns={createBillColumns(categories)}
               data={bills}
               getRowId={(row) => row.id}
               renderMobileCard={(props) => (
                  <BillMobileCard {...props} categories={categories} />
               )}
            />

            {bill.counterparty && (
               <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium">Fornecedor: </span>
                  {bill.counterparty.name}
               </div>
            )}

            {bill.installmentGroupId && bill.installmentNumber && (
               <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Parcela: </span>
                  {bill.installmentNumber}/{bill.totalInstallments}
               </div>
            )}

            {bill.notes && (
               <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Observações: </span>
                  {bill.notes}
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export function TransactionLinkedBillsCard({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={LinkedBillsCardErrorFallback}>
         <Suspense fallback={<LinkedBillsCardSkeleton />}>
            <LinkedBillsCardContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
