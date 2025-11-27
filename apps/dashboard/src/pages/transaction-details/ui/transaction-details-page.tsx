import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { Home, Receipt } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { TransactionCategoriesSection } from "./transaction-categories-section";
import { TransactionInfo } from "./transaction-information-section";
import { TransactionQuickActionsToolbar } from "./transaction-quick-actions-toolbar";
import { TransactionStats } from "./transaction-stats";

function TransactionContent() {
   const params = useParams({ strict: false });
   const transactionId =
      (params as { transactionId?: string }).transactionId ?? "";
   const trpc = useTRPC();

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   if (!transactionId) {
      return (
         <TransactionPageError
            error={new Error("Invalid transaction ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!transaction) {
      return null;
   }

   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch">
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
               <TransactionQuickActionsToolbar transactionId={transactionId} />
               <TransactionInfo transactionId={transactionId} />
               <TransactionCategoriesSection transactionId={transactionId} />
            </div>
            <div className="col-span-1 flex flex-col">
               <TransactionStats transactionId={transactionId} />
            </div>
         </div>
      </main>
   );
}

function TransactionPageSkeleton() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch">
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-24 w-full" />
            </div>
            <div className="col-span-1 flex flex-col">
               <Skeleton className="h-full min-h-48 w-full" />
            </div>
         </div>
      </main>
   );
}

function TransactionPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();

   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Receipt className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate(
                        "dashboard.routes.transactions.details.error.title",
                     )}
                  </EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/transactions",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        {translate(
                           "dashboard.routes.transactions.details.error.back",
                        )}
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate("common.actions.retry")}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function TransactionDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={TransactionPageError}>
         <Suspense fallback={<TransactionPageSkeleton />}>
            <TransactionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
