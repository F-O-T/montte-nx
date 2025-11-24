import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building, Plus, Search } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BankAccountItem } from "@/features/bank-account/ui/bank-account-item";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { trpc } from "@/integrations/clients";
import { createBankAccountColumns } from "./bank-accounts-table-columns";

function BankAccountsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Contas Bancárias</CardTitle>
            <CardDescription>
               Gerencie suas contas bancárias conectadas
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Falha ao carregar contas bancárias. Tente novamente.",
               errorTitle: "Erro ao carregar contas bancárias",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BankAccountsListSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Contas Bancárias</CardTitle>
            <CardDescription>
               Gerencie suas contas bancárias conectadas
            </CardDescription>
            <div className="flex items-center gap-3 pt-4">
               <div className="relative flex-1 max-w-md">
                  <Skeleton className="h-10 w-full" />
               </div>
               <Skeleton className="ml-auto h-10 w-10" />
            </div>
         </CardHeader>
         <CardContent>
            <Skeleton className="h-96 w-full" />
         </CardContent>
      </Card>
   );
}

function BankAccountsListContent() {
   const [searchTerm, setSearchTerm] = useState("");
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   const { data: bankAccounts } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const filteredAccounts = bankAccounts.filter(
      (account) =>
         account.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
         account.bank
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
         account.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
   );

   if (bankAccounts.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Contas Bancárias</CardTitle>
               <CardDescription>
                  Gerencie suas contas bancárias conectadas
               </CardDescription>
               <CardAction className="hidden md:flex">
                  <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                     <Plus className="size-4 mr-2" />
                     Adicionar Conta Bancária
                  </Button>
               </CardAction>
            </CardHeader>
            <CardContent>
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Building className="size-12 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>Nenhuma conta bancária</EmptyTitle>
                     <EmptyDescription>
                        Crie sua primeira conta bancária para começar a
                        controlar suas finanças.
                     </EmptyDescription>
                     <div className="mt-6">
                        <Button
                           onClick={() => setIsCreateSheetOpen(true)}
                           size="default"
                        >
                           <Plus className="size-4 mr-2" />
                           Criar Conta Bancária
                        </Button>
                     </div>
                  </EmptyContent>
               </Empty>
            </CardContent>
            <ManageBankAccountSheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </Card>
      );
   }

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Contas Bancárias</CardTitle>
               <CardDescription>
                  Gerencie suas contas bancárias conectadas
               </CardDescription>
               <CardAction className="hidden md:flex">
                  <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                     <Plus className="size-4 mr-2" />
                     Adicionar Conta Bancária
                  </Button>
               </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4">
               <div className="flex items-center gap-3">
                  <InputGroup className="flex-1 max-w-md">
                     <InputGroupInput
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar contas bancárias..."
                        value={searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>
               </div>

               <div className="block md:hidden">
                  <ItemGroup>
                     {filteredAccounts.map((account, index) => (
                        <Fragment key={account.id}>
                           <BankAccountItem account={account} />
                           {index !== filteredAccounts.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ))}
                  </ItemGroup>
               </div>

               {/* Desktop View */}
               <div className="hidden md:block">
                  <DataTable
                     columns={createBankAccountColumns()}
                     data={filteredAccounts}
                  />
               </div>
            </CardContent>
         </Card>

         {/* Mobile Floating Action Button */}
         <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden"
            onClick={() => setIsCreateSheetOpen(true)}
            size="icon"
         >
            <Plus className="size-6" />
         </Button>

         <ManageBankAccountSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </>
   );
}

export function BankAccountsListSection() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountsListErrorFallback}>
         <Suspense fallback={<BankAccountsListSkeleton />}>
            <BankAccountsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
