import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TransactionActions } from "@/features/transaction/ui/transaction-actions";
import { useTRPC } from "@/integrations/clients";

function ActionButtonsErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar ações</AlertDescription>
      </Alert>
   );
}

function ActionButtonsSkeleton() {
   return (
      <div className="flex flex-wrap items-center gap-2">
         <Skeleton className="h-8 w-40" />
         <Skeleton className="h-8 w-36" />
         <Skeleton className="h-8 w-28" />
         <Skeleton className="h-8 w-32" />
         <div className="h-4 w-px bg-border" />
         <Skeleton className="h-8 w-20" />
         <Skeleton className="h-8 w-24" />
         <Skeleton className="h-8 w-28" />
         <Skeleton className="h-8 w-32" />
         <div className="h-4 w-px bg-border" />
         <Skeleton className="h-8 w-20" />
      </div>
   );
}

function ActionButtonsContent({
   transactionId,
   onDeleteSuccess,
}: {
   transactionId: string;
   onDeleteSuccess: () => void;
}) {
   const trpc = useTRPC();

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   if (!transaction) {
      return null;
   }

   return (
      <TransactionActions
         onDeleteSuccess={onDeleteSuccess}
         transaction={transaction}
         variant="full"
      />
   );
}

export function TransactionActionButtons({
   transactionId,
   onDeleteSuccess,
}: {
   transactionId: string;
   onDeleteSuccess: () => void;
}) {
   return (
      <ErrorBoundary FallbackComponent={ActionButtonsErrorFallback}>
         <Suspense fallback={<ActionButtonsSkeleton />}>
            <ActionButtonsContent
               onDeleteSuccess={onDeleteSuccess}
               transactionId={transactionId}
            />
         </Suspense>
      </ErrorBoundary>
   );
}
