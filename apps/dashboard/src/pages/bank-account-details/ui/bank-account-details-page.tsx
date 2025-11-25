import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
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
import { BankAccountInfo } from "./bank-account-information-section";
import { BankAccountQuickActionsToolbar } from "./bank-account-quick-actions-toolbar";
import { RecentTransactions } from "./bank-account-recent-transactions-section";
import { BankAccountStats } from "./bank-account-stats";

function BankAccountContent() {
   const params = useParams({ strict: false });
   const bankAccountId = (params as any).bankAccountId as string;
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
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-2 grid gap-4">
               <BankAccountQuickActionsToolbar bankAccountId={bankAccountId} />
               <BankAccountInfo bankAccountId={bankAccountId} />
               <RecentTransactions bankAccountId={bankAccountId} />
            </div>
            <div className="col-span-1">
               <BankAccountStats bankAccountId={bankAccountId} />
            </div>
         </div>
      </main>
   );
}

function BankAccountPageSkeleton() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid md:grid-cols-1 gap-4">
            <div className="col-span-1 grid gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-24 w-full" />
            </div>
         </div>
         <div className="grid md:grid-cols-1 gap-4">
            <Skeleton className="h-48 w-full" />
         </div>
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
                              to: "/$slug/profile",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Profile
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
