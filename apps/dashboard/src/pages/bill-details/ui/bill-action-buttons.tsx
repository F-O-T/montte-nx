import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BillActions } from "@/features/bill/ui/bill-actions";
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
         <Skeleton className="h-8 w-24" />
         <Skeleton className="h-8 w-24" />
         <Skeleton className="h-8 w-24" />
         <Skeleton className="h-8 w-20" />
         <Skeleton className="h-8 w-20" />
      </div>
   );
}

function ActionButtonsContent({
   billId,
   onDeleteSuccess,
}: {
   billId: string;
   onDeleteSuccess: () => void;
}) {
   const trpc = useTRPC();

   const { data: bill } = useSuspenseQuery(
      trpc.bills.getById.queryOptions({ id: billId }),
   );

   if (!bill) {
      return null;
   }

   return (
      <BillActions
         bill={bill}
         onDeleteSuccess={onDeleteSuccess}
         variant="full"
      />
   );
}

export function BillActionButtons({
   billId,
   onDeleteSuccess,
}: {
   billId: string;
   onDeleteSuccess: () => void;
}) {
   return (
      <ErrorBoundary FallbackComponent={ActionButtonsErrorFallback}>
         <Suspense fallback={<ActionButtonsSkeleton />}>
            <ActionButtonsContent
               billId={billId}
               onDeleteSuccess={onDeleteSuccess}
            />
         </Suspense>
      </ErrorBoundary>
   );
}
