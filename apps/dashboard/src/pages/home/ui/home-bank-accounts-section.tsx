import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BankAccountItem } from "@/features/bank-account/ui/bank-account-item";
import { CreateBankAccountItem } from "@/features/bank-account/ui/create-bank-account-item";
import { ManageBankAccountForm } from "@/features/bank-account/ui/manage-bank-account-form";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

function HomeBankAccountsErrorFallback() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.bank-accounts.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.bank-accounts.list-section.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="py-4 text-center text-muted-foreground">
               {translate(
                  "dashboard.routes.bank-accounts.list-section.state.empty.title",
               )}
            </div>
         </CardContent>
      </Card>
   );
}

function HomeBankAccountsSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="grid gap-4 grid-cols-3">
               {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                     className="h-20 w-full"
                     key={`home-bank-account-skeleton-${index + 1}`}
                  />
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

function HomeBankAccountsContent() {
   const trpc = useTRPC();
   const { openSheet } = useSheet();
   const { data: bankAccounts = [] } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const visibleAccounts = bankAccounts.slice(0, 3);
   const shouldShowCreateTile = visibleAccounts.length < 3;

   return (
      <div className="space-y-4">
         <div>
            <h2 className="text-lg font-semibold">
               {translate("dashboard.routes.home.bank-accounts.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
               {translate("dashboard.routes.home.bank-accounts.description")}
            </p>
         </div>
         <div className="grid gap-4 md:grid-cols-3">
            {visibleAccounts.map((account) => (
               <BankAccountItem account={account} key={account.id} solid />
            ))}
            {shouldShowCreateTile && (
               <CreateBankAccountItem
                  onCreateAccount={() =>
                     openSheet({ children: <ManageBankAccountForm /> })
                  }
                  solid
               />
            )}
         </div>
      </div>
   );
}

export function HomeBankAccountsSection() {
   return (
      <ErrorBoundary FallbackComponent={HomeBankAccountsErrorFallback}>
         <Suspense fallback={<HomeBankAccountsSkeleton />}>
            <HomeBankAccountsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
