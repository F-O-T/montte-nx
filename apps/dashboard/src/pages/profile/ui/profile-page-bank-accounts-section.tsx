import { Badge } from "@packages/ui/components/badge";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowRight, Building2, MoreVertical, Plus } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import { DeleteBankAccount } from "../features/delete-bank-account";
import { ManageBankAccountSheet } from "../features/manage-bank-account-sheet";

import type { BankAccount } from "@packages/database/repositories/bank-account-repository";

interface BankAccountActionsProps {
   bankAccount: BankAccount;
}

function BankAccountActions({ bankAccount }: BankAccountActionsProps) {
   return (
      <DropdownMenu>
         <Tooltip>
            <TooltipTrigger asChild>
               <DropdownMenuTrigger asChild>
                  <Button className="h-8 w-8 p-0" size="icon" variant="ghost">
                     <MoreVertical className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.label",
               )}
            </TooltipContent>
         </Tooltip>
         <DropdownMenuContent align="end">
            <DropdownMenuLabel>
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.label",
               )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ManageBankAccountSheet asChild bankAccount={bankAccount} />
            <DeleteBankAccount bankAccount={bankAccount} />
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

interface CreateBankAccountItemProps {
   onCreateAccount: () => void;
}

function CreateBankAccountItem({
   onCreateAccount,
}: CreateBankAccountItemProps) {
   return (
      <Item
         className="cursor-pointer hover:bg-muted/50 transition-colors"
         onClick={onCreateAccount}
      >
         <ItemMedia variant="icon">
            <Plus className="size-4 text-muted-foreground" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle className="text-muted-foreground">
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.add-account.title",
               )}
            </ItemTitle>
            <ItemDescription>
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.add-account.description",
               )}
            </ItemDescription>
         </ItemContent>
      </Item>
   );
}

function BankAccountsErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Contas Bancárias</CardTitle>
            <CardDescription>Gerencie suas contas bancárias</CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Ocorreu um erro ao carregar suas contas bancárias. Por favor, tente novamente.",
               errorTitle: "Erro ao carregar contas",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BankAccountsSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {Array.from({ length: 2 }).map((_, index) => (
                  <Item className="p-0" key={`skeleton-${index + 1}`}>
                     <ItemMedia variant="icon">
                        <Skeleton className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>
                           <Skeleton className="h-5 w-1/2" />
                        </ItemTitle>
                        <ItemDescription>
                           <Skeleton className="h-4 w-3/4" />
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

function BankAccountsContent() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const { data: bankAccounts } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const getAccountTypeLabel = (type: string) => {
      const typeMap: Record<string, string> = {
         checking: "Conta Corrente",
         savings: "Conta Poupança",
         investment: "Conta Investimento",
         credit: "Cartão de Crédito",
         loan: "Empréstimo",
      };
      return typeMap[type] || type;
   };

   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="grid gap-1">
               <CardTitle>
                  {translate("dashboard.routes.profile.bank-accounts.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.profile.bank-accounts.description",
                  )}
               </CardDescription>
            </div>
            <Button asChild size="icon" variant="ghost">
               <Link to="/bank-accounts">
                  <ArrowRight className="size-4" />
               </Link>
            </Button>
         </CardHeader>

         <CardContent className="flex-1 overflow-y-auto">
            <ItemGroup>
               {bankAccounts.map((account, index) => (
                  <>
                     <Link
                        key={account.id}
                        to="/bank-accounts/$bankAccountId"
                        params={{ bankAccountId: account.id }}
                        className="block"
                     >
                        <Item className="cursor-pointer hover:bg-muted/50 transition-colors">
                           <ItemMedia variant="icon">
                              <Building2 className="size-4" />
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
                                    {account.status === "active"
                                       ? "Ativa"
                                       : "Inativa"}
                                 </Badge>
                              </ItemTitle>
                              <ItemDescription>
                                 {account.bank} •{" "}
                                 {getAccountTypeLabel(account.type)}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions onClick={(e) => e.preventDefault()}>
                              <BankAccountActions bankAccount={account} />
                           </ItemActions>
                        </Item>
                     </Link>
                     {index < bankAccounts.length - 1 && <ItemSeparator />}
                  </>
               ))}
               {bankAccounts.length > 0 && <ItemSeparator />}
               <CreateBankAccountItem
                  onCreateAccount={() => setIsCreateSheetOpen(true)}
               />
            </ItemGroup>
         </CardContent>

         <ManageBankAccountSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </Card>
   );
}

export function BankAccountsSection() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountsErrorFallback}>
         <Suspense fallback={<BankAccountsSkeleton />}>
            <BankAccountsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
