import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Building, Building2, Plus } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";

function BankAccountsListContent() {
   const trpc = useTRPC();
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const { data: bankAccounts } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   if (bankAccounts.length === 0) {
      return (
         <Empty>
            <EmptyContent>
               <EmptyMedia variant="icon">
                  <Building className="size-12 text-muted-foreground" />
               </EmptyMedia>
               <EmptyTitle>No bank accounts</EmptyTitle>
               <EmptyDescription>
                  Create your first bank account to start tracking your
                  finances.
               </EmptyDescription>
               <div className="mt-6">
                  <Button
                     onClick={() => setIsCreateSheetOpen(true)}
                     size="default"
                  >
                     <Plus className="size-4 mr-2" />
                     Create Bank Account
                  </Button>
               </div>
               <ManageBankAccountSheet
                  onOpen={isCreateSheetOpen}
                  onOpenChange={setIsCreateSheetOpen}
               />
            </EmptyContent>
         </Empty>
      );
   }

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {bankAccounts.map((account) => (
            <Link
               key={account.id}
               to="/bank-accounts/$bankAccountId"
               params={{ bankAccountId: account.id }}
               className="block"
            >
               <Item
                  className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  variant="outline"
               >
                  <ItemMedia variant="icon">
                     <Building2 className="size-6 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="flex items-center gap-2">
                        {account.name}
                        <Badge
                           variant={
                              account.status === "active"
                                 ? "default"
                                 : "secondary"
                           }
                        >
                           {account.status}
                        </Badge>
                     </ItemTitle>
                     <ItemDescription>
                        {account.bank} • {account.type}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            </Link>
         ))}
         <div
            className="flex items-center justify-center h-full min-h-[100px] border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => setIsCreateSheetOpen(true)}
         >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
               <Plus className="size-8" />
               <span className="font-medium">Add New Account</span>
            </div>
         </div>
         <ManageBankAccountSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </div>
   );
}

function BankAccountsListSkeleton() {
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
         ))}
      </div>
   );
}

function BankAccountsListError({ error, resetErrorBoundary }: FallbackProps) {
   return (
      <Empty>
         <EmptyContent>
            <EmptyMedia variant="icon">
               <Building className="size-12 text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Failed to load bank accounts</EmptyTitle>
            <EmptyDescription>{error?.message}</EmptyDescription>
            <Button
               onClick={resetErrorBoundary}
               variant="outline"
               className="mt-4"
            >
               Try Again
            </Button>
         </EmptyContent>
      </Empty>
   );
}

export function BankAccountsPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
         </div>
         <ErrorBoundary FallbackComponent={BankAccountsListError}>
            <Suspense fallback={<BankAccountsListSkeleton />}>
               <BankAccountsListContent />
            </Suspense>
         </ErrorBoundary>
      </main>
   );
}
