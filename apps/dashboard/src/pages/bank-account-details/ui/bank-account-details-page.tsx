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
import { Building, Home } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { BankAccountCharts } from "./bank-account-charts";
import { RecentTransactions } from "./bank-account-recent-transactions-section";
import { BankAccountStats } from "./bank-account-stats";

function BankAccountContent() {
   const params = useParams({ strict: false });
   const bankAccountId =
      (params as { bankAccountId?: string }).bankAccountId ?? "";
   const trpc = useTRPC();

   const { data: bankAccount } = useSuspenseQuery(
      trpc.bankAccounts.getById.queryOptions({ id: bankAccountId }),
   );

   if (!bankAccountId) {
      return (
         <BankAccountPageError
            error={new Error("Invalid bank account ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!bankAccount) {
      return null;
   }

   return (
      <main className="space-y-4">
         <DefaultHeader
            description={"Detalhes da sua conta bancaria"}
            title={bankAccount.name || "Conta Bancaria"}
         />
         <BankAccountStats bankAccountId={bankAccountId} />
         <RecentTransactions bankAccountId={bankAccountId} />
         <BankAccountCharts bankAccountId={bankAccountId} />
      </main>
   );
}

function BankAccountPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
         <Skeleton className="h-64 w-full" />
      </main>
   );
}

function BankAccountPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Building className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load bank account</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/bank-accounts",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Bank Accounts
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        Try Again
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function BankAccountDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountPageError}>
         <Suspense fallback={<BankAccountPageSkeleton />}>
            <BankAccountContent />
         </Suspense>
      </ErrorBoundary>
   );
}
