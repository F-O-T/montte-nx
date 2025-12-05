import type { RouterOutput } from "@packages/api/client";
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
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   Calendar,
   ChevronDown,
   Edit,
   Eye,
   Power,
   Target,
   Trash2,
   TrendingUp,
   Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { DeleteBudget } from "../features/delete-budget";
import { ManageBudgetSheet } from "../features/manage-budget-sheet";

type Budget = RouterOutput["budgets"]["getAllPaginated"]["budgets"][0];

function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
   }).format(value);
}

const periodLabels: Record<string, string> = {
   custom: translate("dashboard.routes.budgets.form.period.custom"),
   daily: translate("dashboard.routes.budgets.form.period.daily"),
   monthly: translate("dashboard.routes.budgets.form.period.monthly"),
   quarterly: translate("dashboard.routes.budgets.form.period.quarterly"),
   weekly: translate("dashboard.routes.budgets.form.period.weekly"),
   yearly: translate("dashboard.routes.budgets.form.period.yearly"),
};

function BudgetActionsCell({ budget }: { budget: Budget }) {
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
                           budgetId: budget.id,
                           slug: activeOrganization.slug,
                        }}
                        to="/$slug/budgets/$budgetId"
                     >
                        <Eye className="size-4" />
                     </Link>
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.budgets.list-section.actions.view-details",
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
                     "dashboard.routes.budgets.list-section.actions.edit",
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
                     "dashboard.routes.budgets.list-section.actions.delete",
                  )}
               </TooltipContent>
            </Tooltip>
         </div>
         <ManageBudgetSheet
            budget={budget}
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
         />
         <DeleteBudget
            asDialog
            budget={budget}
            onOpenChange={setIsDeleteOpen}
            open={isDeleteOpen}
         />
      </>
   );
}

export function createBudgetColumns(): ColumnDef<Budget>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const budget = row.original;
            return (
               <div className="flex items-center gap-3">
                  <div
                     className="size-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs"
                     style={{ backgroundColor: budget.color || "#6366f1" }}
                  >
                     {budget.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                     <span className="font-medium">{budget.name}</span>
                     <span className="text-xs text-muted-foreground">
                        {periodLabels[budget.periodType]}
                     </span>
                  </div>
               </div>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.budgets.table.name"),
      },
      {
         accessorKey: "amount",
         cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            return (
               <span className="font-medium">{formatCurrency(amount)}</span>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.budgets.table.amount"),
      },
      {
         accessorKey: "progress",
         cell: ({ row }) => {
            const budget = row.original;
            const totalAmount = parseFloat(budget.amount);
            const currentPeriod = budget.periods?.[0];
            const spent = currentPeriod
               ? parseFloat(currentPeriod.spentAmount || "0")
               : 0;
            const percentage =
               totalAmount > 0 ? (spent / totalAmount) * 100 : 0;
            const isOverBudget = percentage >= 100;

            return (
               <div>
                  <div
                     className={`font-medium ${isOverBudget ? "text-destructive" : ""}`}
                  >
                     {formatCurrency(spent)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                     {Math.round(percentage)}%{" "}
                     {translate(
                        "dashboard.routes.budgets.details.progress.of-budget",
                     )}
                  </div>
               </div>
            );
         },
         header: translate("dashboard.routes.budgets.table.progress"),
      },
      {
         accessorKey: "isActive",
         cell: ({ row }) => {
            const isActive = row.getValue("isActive") as boolean;
            return (
               <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive
                     ? translate("dashboard.routes.budgets.status.active")
                     : translate("dashboard.routes.budgets.status.inactive")}
               </Badge>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.budgets.table.status"),
      },
      {
         cell: ({ row }) => <BudgetActionsCell budget={row.original} />,
         header: "",
         id: "actions",
      },
   ];
}

interface BudgetExpandedContentProps {
   row: Row<Budget>;
}

export function BudgetExpandedContent({ row }: BudgetExpandedContentProps) {
   const budget = row.original;
   const { activeOrganization } = useActiveOrganization();
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
   const isMobile = useIsMobile();
   const trpc = useTRPC();

   const totalAmount = parseFloat(budget.amount);
   const currentPeriod = budget.periods?.[0];
   const spent = currentPeriod
      ? parseFloat(currentPeriod.spentAmount || "0")
      : 0;
   const scheduled = currentPeriod
      ? parseFloat(currentPeriod.scheduledAmount || "0")
      : 0;
   const available = Math.max(0, totalAmount - spent - scheduled);
   const percentage = totalAmount > 0 ? (spent / totalAmount) * 100 : 0;

   const updateMutation = useMutation(
      trpc.budgets.update.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.budgets.notifications.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               budget.isActive
                  ? translate(
                       "dashboard.routes.budgets.notifications.deactivated",
                    )
                  : translate(
                       "dashboard.routes.budgets.notifications.activated",
                    ),
            );
         },
      }),
   );

   const handleStatusToggle = () => {
      updateMutation.mutate({
         data: { isActive: !budget.isActive },
         id: budget.id,
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
               disabled={updateMutation.isPending}
               onClick={(e) => e.stopPropagation()}
               size="sm"
               variant="outline"
            >
               <Power className="size-4" />
               {budget.isActive
                  ? translate("dashboard.routes.budgets.status.active")
                  : translate("dashboard.routes.budgets.status.inactive")}
            </Button>
         </AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {budget.isActive
                     ? translate(
                          "dashboard.routes.budgets.status-toggle.deactivate-title",
                       )
                     : translate(
                          "dashboard.routes.budgets.status-toggle.activate-title",
                       )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {budget.isActive
                     ? translate(
                          "dashboard.routes.budgets.status-toggle.deactivate-description",
                       )
                     : translate(
                          "dashboard.routes.budgets.status-toggle.activate-description",
                       )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction onClick={handleStatusToggle}>
                  {translate("dashboard.routes.budgets.status-toggle.confirm")}
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
                  <Target className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate("dashboard.routes.budgets.stats.total")}
                     </p>
                     <p className="text-sm font-medium">
                        {formatCurrency(totalAmount)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-destructive" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate("dashboard.routes.budgets.stats.spent")}
                     </p>
                     <p className="text-sm font-medium text-destructive">
                        {formatCurrency(spent)} ({Math.round(percentage)}%)
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-emerald-500" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate("dashboard.routes.budgets.stats.available")}
                     </p>
                     <p className="text-sm font-medium text-emerald-500">
                        {formatCurrency(available)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate("dashboard.routes.budgets.table.period")}
                     </p>
                     <p className="text-sm font-medium">
                        {periodLabels[budget.periodType]}
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
                        budgetId: budget.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/budgets/$budgetId"
                  >
                     <Eye className="size-4" />
                     {translate(
                        "dashboard.routes.budgets.list-section.actions.view-details",
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
                     "dashboard.routes.budgets.list-section.actions.edit",
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
                     "dashboard.routes.budgets.list-section.actions.delete",
                  )}
               </Button>
            </div>

            <ManageBudgetSheet
               budget={budget}
               onOpen={isEditOpen}
               onOpenChange={setIsEditOpen}
            />
            <DeleteBudget
               asDialog
               budget={budget}
               onOpenChange={setIsDeleteOpen}
               open={isDeleteOpen}
            />
         </div>
      );
   }

   return (
      <div className="p-4 flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Target className="size-4 text-muted-foreground" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate("dashboard.routes.budgets.stats.total")}
                  </p>
                  <p className="text-sm font-medium">
                     {formatCurrency(totalAmount)}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <TrendingUp className="size-4 text-destructive" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate("dashboard.routes.budgets.stats.spent")}
                  </p>
                  <p className="text-sm font-medium text-destructive">
                     {formatCurrency(spent)} ({Math.round(percentage)}%)
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <Wallet className="size-4 text-emerald-500" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate("dashboard.routes.budgets.stats.available")}
                  </p>
                  <p className="text-sm font-medium text-emerald-500">
                     {formatCurrency(available)}
                  </p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-2">
            {statusToggleElement}
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{
                     budgetId: budget.id,
                     slug: activeOrganization.slug,
                  }}
                  to="/$slug/budgets/$budgetId"
               >
                  <Eye className="size-4" />
                  {translate(
                     "dashboard.routes.budgets.list-section.actions.view-details",
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
               {translate("dashboard.routes.budgets.list-section.actions.edit")}
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
                  "dashboard.routes.budgets.list-section.actions.delete",
               )}
            </Button>
         </div>

         <ManageBudgetSheet
            budget={budget}
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
         />
         <DeleteBudget
            asDialog
            budget={budget}
            onOpenChange={setIsDeleteOpen}
            open={isDeleteOpen}
         />
      </div>
   );
}

interface BudgetMobileCardProps {
   row: Row<Budget>;
   isExpanded: boolean;
   toggleExpanded: () => void;
}

export function BudgetMobileCard({
   row,
   isExpanded,
   toggleExpanded,
}: BudgetMobileCardProps) {
   const budget = row.original;
   const totalAmount = parseFloat(budget.amount);
   const currentPeriod = budget.periods?.[0];
   const spent = currentPeriod
      ? parseFloat(currentPeriod.spentAmount || "0")
      : 0;
   const percentage = totalAmount > 0 ? (spent / totalAmount) * 100 : 0;

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <div className="flex items-center gap-3">
               <div
                  className="size-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: budget.color || "#6366f1" }}
               >
                  {budget.name.substring(0, 2).toUpperCase()}
               </div>
               <div className="flex-1">
                  <CardTitle className="text-base">{budget.name}</CardTitle>
                  <CardDescription>
                     {periodLabels[budget.periodType]}
                  </CardDescription>
               </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">
                  {formatCurrency(spent)} / {formatCurrency(totalAmount)}
               </span>
               <span
                  className={`text-sm font-medium ${percentage >= 100 ? "text-destructive" : ""}`}
               >
                  {Math.round(percentage)}%
               </span>
            </div>
            <div className="flex gap-2">
               <Badge variant={budget.isActive ? "default" : "secondary"}>
                  {budget.isActive
                     ? translate("dashboard.routes.budgets.status.active")
                     : translate("dashboard.routes.budgets.status.inactive")}
               </Badge>
            </div>
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
