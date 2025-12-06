import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { translate } from "@packages/localization";
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
import { ManageBankAccountForm } from "@/features/bank-account/ui/manage-bank-account-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useDeleteBankAccount } from "@/pages/bank-account-details/features/use-delete-bank-account";
import { useToggleBankAccountStatus } from "@/pages/bank-accounts/features/use-toggle-bank-account-status";

function BankAccountActionsCell({ account }: { account: BankAccount }) {
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { deleteBankAccount } = useDeleteBankAccount({ bankAccount: account });

   return (
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
                  onClick={() =>
                     openSheet({
                        children: (
                           <ManageBankAccountForm bankAccount={account} />
                        ),
                     })
                  }
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
                  onClick={deleteBankAccount}
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
   const isMobile = useIsMobile();
   const { openSheet } = useSheet();
   const { deleteBankAccount } = useDeleteBankAccount({ bankAccount: account });
   const { toggleStatus, isUpdating } = useToggleBankAccountStatus({
      bankAccount: account,
   });

   const statusToggleButton = (
      <Button
         disabled={isUpdating}
         onClick={(e) => {
            e.stopPropagation();
            toggleStatus();
         }}
         size="sm"
         variant="outline"
      >
         <Power className="size-4" />
         {account.status === "active"
            ? translate("dashboard.routes.bank-accounts.status.active")
            : translate("dashboard.routes.bank-accounts.status.inactive")}
      </Button>
   );

   const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      openSheet({
         children: <ManageBankAccountForm bankAccount={account} />,
      });
   };

   const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteBankAccount();
   };

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
               {statusToggleButton}
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
                  onClick={handleEdit}
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
                  onClick={handleDelete}
                  size="sm"
                  variant="destructive"
               >
                  <Trash2 className="size-4" />
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.delete",
                  )}
               </Button>
            </div>
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
         </div>

         <div className="flex items-center gap-2">
            {statusToggleButton}
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
            <Button onClick={handleEdit} size="sm" variant="outline">
               <Edit className="size-4" />
               {translate(
                  "dashboard.routes.bank-accounts.list-section.actions.edit",
               )}
            </Button>
            <Button onClick={handleDelete} size="sm" variant="destructive">
               <Trash2 className="size-4" />
               {translate(
                  "dashboard.routes.bank-accounts.list-section.actions.delete",
               )}
            </Button>
         </div>
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
