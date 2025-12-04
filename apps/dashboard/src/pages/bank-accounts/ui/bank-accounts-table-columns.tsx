import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { CollapsibleTrigger } from "@packages/ui/components/collapsible";
import { Separator } from "@packages/ui/components/separator";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   ArrowDownLeft,
   ArrowUpRight,
   Calendar,
   ChevronDown,
   CreditCard,
   Edit,
   Eye,
   Power,
   Trash2,
   Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { DeleteBankAccount } from "@/pages/bank-account-details/features/delete-bank-account";

function BankAccountActionsCell({ account }: { account: BankAccount }) {
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const { activeOrganization } = useActiveOrganization();

   return (
      <>
         <div className="flex justify-end gap-1">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="outline">
                     <Link
                        params={{
                           bankAccountId: account.id,
                           slug: activeOrganization.slug,
                        }}
                        to="/$slug/bank-accounts/$bankAccountId"
                     >
                        <Eye className="size-4" />
                     </Link>
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.view-details",
                  )}
               </TooltipContent>
            </Tooltip>
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     onClick={() => setIsEditOpen(true)}
                     size="icon"
                     variant="outline"
                  >
                     <Edit className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.edit",
                  )}
               </TooltipContent>
            </Tooltip>
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="text-destructive hover:text-destructive"
                     onClick={() => setIsDeleteOpen(true)}
                     size="icon"
                     variant="outline"
                  >
                     <Trash2 className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.delete",
                  )}
               </TooltipContent>
            </Tooltip>
         </div>
         <ManageBankAccountSheet
            bankAccount={account}
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
         />
         <DeleteBankAccount
            bankAccount={account}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
         />
      </>
   );
}

export function createBankAccountColumns(): ColumnDef<BankAccount>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const account = row.original;
            return (
               <div className="flex flex-col">
                  <span className="font-medium">{account.name}</span>
               </div>
            );
         },
         enableSorting: true,
         header: "Nome",
      },
      {
         accessorKey: "bank",
         cell: ({ row }) => {
            return <span>{row.getValue("bank")}</span>;
         },
         enableSorting: true,
         header: "Banco",
      },
      {
         accessorKey: "type",
         cell: ({ row }) => {
            const type = row.getValue("type") as string;
            const typeMap = {
               checking: "Conta corrente",
               investment: "Conta de investimento",
               savings: "Conta poupança",
            };
            return <span>{typeMap[type as keyof typeof typeMap] || type}</span>;
         },
         enableSorting: true,
         header: "Tipo",
      },
      {
         accessorKey: "status",
         cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
               <Badge variant={status === "active" ? "default" : "secondary"}>
                  {status === "active" ? "Ativa" : "Inativa"}
               </Badge>
            );
         },
         enableSorting: true,
         header: "Status",
      },
      {
         accessorKey: "createdAt",
         cell: ({ row }) => {
            return formatDate(
               new Date(row.getValue("createdAt")),
               "DD MMM YYYY",
            );
         },
         enableSorting: true,
         header: "Criado em",
      },
      {
         cell: ({ row }) => <BankAccountActionsCell account={row.original} />,
         header: "",
         id: "actions",
      },
   ];
}

const typeMap: Record<string, string> = {
   checking: translate("dashboard.routes.bank-accounts.types.checking"),
   investment: translate("dashboard.routes.bank-accounts.types.investment"),
   savings: translate("dashboard.routes.bank-accounts.types.savings"),
};

interface BankAccountExpandedContentProps {
   row: Row<BankAccount>;
   balance: number;
   income: number;
   expenses: number;
}

export function BankAccountExpandedContent({
   row,
   balance,
   income,
   expenses,
}: BankAccountExpandedContentProps) {
   const account = row.original;
   const { activeOrganization } = useActiveOrganization();
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
   const isMobile = useIsMobile();
   const trpc = useTRPC();

   const updateStatusMutation = useMutation(
      trpc.bankAccounts.update.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.bank-accounts.notifications.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               account.status === "active"
                  ? translate(
                       "dashboard.routes.bank-accounts.notifications.deactivated",
                    )
                  : translate(
                       "dashboard.routes.bank-accounts.notifications.activated",
                    ),
            );
         },
      }),
   );

   const handleStatusToggle = () => {
      const newStatus = account.status === "active" ? "inactive" : "active";
      updateStatusMutation.mutate({
         data: { status: newStatus },
         id: account.id,
      });
      setIsStatusDialogOpen(false);
   };

   const statusToggleElement = (
      <AlertDialog
         onOpenChange={setIsStatusDialogOpen}
         open={isStatusDialogOpen}
      >
         <AlertDialogTrigger asChild>
            <Button
               className="w-full "
               disabled={updateStatusMutation.isPending}
               onClick={(e) => e.stopPropagation()}
               variant="outline"
            >
               <Power className="size-4" />
               {account.status === "active"
                  ? translate("dashboard.routes.bank-accounts.status.active")
                  : translate("dashboard.routes.bank-accounts.status.inactive")}
            </Button>
         </AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {account.status === "active"
                     ? translate(
                          "dashboard.routes.bank-accounts.status-toggle.deactivate-title",
                       )
                     : translate(
                          "dashboard.routes.bank-accounts.status-toggle.activate-title",
                       )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {account.status === "active"
                     ? translate(
                          "dashboard.routes.bank-accounts.status-toggle.deactivate-description",
                       )
                     : translate(
                          "dashboard.routes.bank-accounts.status-toggle.activate-description",
                       )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction onClick={handleStatusToggle}>
                  {translate(
                     "dashboard.routes.bank-accounts.status-toggle.confirm",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );

   if (isMobile) {
      return (
         <div className="p-4 space-y-4">
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.stats-section.total-balance.title",
                        )}
                     </p>
                     <p className="text-sm font-medium">
                        {formatDecimalCurrency(balance)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <ArrowDownLeft className="size-4 text-emerald-500" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.stats-section.total-income.title",
                        )}
                     </p>
                     <p className="text-sm font-medium text-emerald-500">
                        +{formatDecimalCurrency(income)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <ArrowUpRight className="size-4 text-destructive" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.stats-section.total-expenses.title",
                        )}
                     </p>
                     <p className="text-sm font-medium text-destructive">
                        -{formatDecimalCurrency(expenses)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate("dashboard.routes.bank-accounts.table.type")}
                     </p>
                     <p className="text-sm font-medium">
                        {typeMap[account.type] || account.type}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.table.created-at",
                        )}
                     </p>
                     <p className="text-sm font-medium">
                        {formatDate(new Date(account.createdAt), "DD MMM YYYY")}
                     </p>
                  </div>
               </div>
               <Separator />
               {statusToggleElement}
            </div>

            <Separator />

            <div className="space-y-2">
               <Button
                  asChild
                  className="w-full justify-start"
                  size="sm"
                  variant="outline"
               >
                  <Link
                     params={{
                        bankAccountId: account.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/bank-accounts/$bankAccountId"
                  >
                     <Eye className="size-4" />
                     {translate(
                        "dashboard.routes.bank-accounts.list-section.actions.view-details",
                     )}
                  </Link>
               </Button>
               <Button
                  className="w-full justify-start"
                  onClick={(e) => {
                     e.stopPropagation();
                     setIsEditOpen(true);
                  }}
                  size="sm"
                  variant="outline"
               >
                  <Edit className="size-4" />
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.edit",
                  )}
               </Button>
               <Button
                  className="w-full justify-start"
                  onClick={(e) => {
                     e.stopPropagation();
                     setIsDeleteOpen(true);
                  }}
                  size="sm"
                  variant="destructive"
               >
                  <Trash2 className="size-4" />
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.delete",
                  )}
               </Button>
            </div>

            <ManageBankAccountSheet
               bankAccount={account}
               onOpen={isEditOpen}
               onOpenChange={setIsEditOpen}
            />
            <DeleteBankAccount
               bankAccount={account}
               open={isDeleteOpen}
               setOpen={setIsDeleteOpen}
            />
         </div>
      );
   }

   return (
      <div className="p-4 flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Wallet className="size-4 text-muted-foreground" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.bank-accounts.stats-section.total-balance.title",
                     )}
                  </p>
                  <p className="text-sm font-medium">
                     {formatDecimalCurrency(balance)}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <ArrowDownLeft className="size-4 text-emerald-500" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.bank-accounts.stats-section.total-income.title",
                     )}
                  </p>
                  <p className="text-sm font-medium text-emerald-500">
                     +{formatDecimalCurrency(income)}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <ArrowUpRight className="size-4 text-destructive" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.bank-accounts.stats-section.total-expenses.title",
                     )}
                  </p>
                  <p className="text-sm font-medium text-destructive">
                     -{formatDecimalCurrency(expenses)}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            {statusToggleElement}
         </div>

         <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{
                     bankAccountId: account.id,
                     slug: activeOrganization.slug,
                  }}
                  to="/$slug/bank-accounts/$bankAccountId"
               >
                  <Eye className="size-4" />
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.view-details",
                  )}
               </Link>
            </Button>
            <Button
               onClick={(e) => {
                  e.stopPropagation();
                  setIsEditOpen(true);
               }}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               {translate(
                  "dashboard.routes.bank-accounts.list-section.actions.edit",
               )}
            </Button>
            <Button
               onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteOpen(true);
               }}
               size="sm"
               variant="destructive"
            >
               <Trash2 className="size-4" />
               {translate(
                  "dashboard.routes.bank-accounts.list-section.actions.delete",
               )}
            </Button>
         </div>

         <ManageBankAccountSheet
            bankAccount={account}
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
         />
         <DeleteBankAccount
            bankAccount={account}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
         />
      </div>
   );
}

interface BankAccountMobileCardProps {
   row: Row<BankAccount>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   balance: number;
   income: number;
   expenses: number;
}

export function BankAccountMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   balance,
}: BankAccountMobileCardProps) {
   const account = row.original;

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <CardDescription>{account.name}</CardDescription>
            <CardTitle>{account.bank}</CardTitle>
            <CardDescription>
               <Badge variant="outline">{formatDecimalCurrency(balance)}</Badge>
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Badge
               variant={account.status === "active" ? "default" : "secondary"}
            >
               {account.status === "active"
                  ? translate("dashboard.routes.bank-accounts.status.active")
                  : translate("dashboard.routes.bank-accounts.status.inactive")}
            </Badge>
            <Badge variant="secondary">
               {typeMap[account.type] || account.type}
            </Badge>
         </CardContent>
         <CardFooter>
            <CollapsibleTrigger asChild>
               <Button
                  className="w-full"
                  onClick={(e) => {
                     e.stopPropagation();
                     toggleExpanded();
                  }}
                  variant="outline"
               >
                  {isExpanded
                     ? translate("common.actions.less-info")
                     : translate("common.actions.more-info")}
                  <ChevronDown
                     className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
               </Button>
            </CollapsibleTrigger>
         </CardFooter>
      </Card>
   );
}
