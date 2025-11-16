import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
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
import { Building2, MoreVertical, Plus } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { trpc } from "@/integrations/clients";
import { AddBankAccountSheet } from "../features/add-bank-account-sheet";
import { EditBankAccountSheet } from "../features/edit-bank-account-sheet";
import { DeleteBankAccount } from "../features/delete-bank-account";

function BankAccountsErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.bank-accounts.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.bank-accounts.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.bank-accounts.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.bank-accounts.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
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
                  <Item key={`skeleton-${index}`} className="p-0">
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

   return (
      <Card className="">
         <CardHeader className="">
            <CardTitle>
               {translate("dashboard.routes.profile.bank-accounts.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.bank-accounts.description")}
            </CardDescription>
            <CardAction>
               <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsCreateSheetOpen(true)}
               >
                  <Plus className="size-4" />
               </Button>
            </CardAction>
         </CardHeader>

         <CardContent className="flex-1 overflow-y-auto">
            {bankAccounts && bankAccounts.length > 0 ? (
               <ItemGroup>
                  {bankAccounts.map((account, index) => (
                     <>
                        <Item key={account.id}>
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
                                       ? translate(
                                            "dashboard.routes.profile.bank-accounts.status.active",
                                         )
                                       : translate(
                                            "dashboard.routes.profile.bank-accounts.status.inactive",
                                         )}
                                 </Badge>
                              </ItemTitle>
                              <ItemDescription>
                                 {account.bank} •{" "}
                                 {translate(
                                    `dashboard.routes.profile.bank-accounts.types.${account.type}`,
                                 )}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button
                                       className="h-8 w-8 p-0"
                                       size="icon"
                                       variant="ghost"
                                    >
                                       <span className="sr-only">
                                          Open menu
                                       </span>
                                       <MoreVertical className="h-4 w-4" />
                                    </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                    <EditBankAccountSheet
                                       asChild
                                       bankAccount={account}
                                    />
                                    <DeleteBankAccount
                                       asChild
                                       bankAccount={account}
                                    />
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </ItemActions>
                        </Item>
                        {index < bankAccounts.length - 1 && <ItemSeparator />}
                     </>
                  ))}
               </ItemGroup>
            ) : (
               <div className="text-center py-8 text-sm text-muted-foreground">
                  {translate(
                     "dashboard.routes.profile.bank-accounts.state.empty",
                  )}
               </div>
            )}
         </CardContent>

         <AddBankAccountSheet
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
