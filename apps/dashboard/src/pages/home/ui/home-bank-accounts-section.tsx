import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BankAccountItem } from "@/features/bank-account/ui/bank-account-item";
import { CreateBankAccountItem } from "@/features/bank-account/ui/create-bank-account-item";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { trpc } from "@/integrations/clients";

function HomeBankAccountsErrorFallback() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>
               Manage your connected bank accounts
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="py-4 text-center text-muted-foreground">
               Failed to load bank accounts
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
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const { data: bankAccounts = [] } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const visibleAccounts = bankAccounts.slice(0, 3);
   const shouldShowCreateTile = visibleAccounts.length < 3;

   return (
      <>
         <div className="grid gap-4 md:grid-cols-3">
            {visibleAccounts.map((account) => (
               <BankAccountItem account={account} key={account.id} solid />
            ))}
            {shouldShowCreateTile && (
               <CreateBankAccountItem
                  onCreateAccount={() => setIsCreateSheetOpen(true)}
                  solid
               />
            )}
         </div>
         <ManageBankAccountSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </>
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
