import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
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
import {
   getRecurrenceLabel,
   type RecurrencePattern,
} from "@packages/utils/recurrence";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   AlertCircle,
   Building,
   Calendar,
   CalendarDays,
   CheckCircle2,
   ChevronDown,
   Clock,
   Edit,
   Eye,
   FileText,
   Pencil,
   Trash2,
   User,
   Wallet,
} from "lucide-react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import type { Category } from "@/pages/categories/ui/categories-page";
import { CompleteBillDialog } from "../features/complete-bill-dialog";
import { useDeleteBillDialog } from "../features/delete-bill-dialog";
import { ManageBillForm } from "../features/manage-bill-form";

type Bill = BillWithRelations;

function BillActionsCell({ bill }: { bill: Bill }) {
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { handleDeleteBill } = useDeleteBillDialog({ bill });

   const isCompleted = !!bill.completionDate;

   return (
      <div className="flex justify-end gap-1">
         <Tooltip>
            <TooltipTrigger asChild>
               <Button asChild size="icon" variant="outline">
                  <Link
                     params={{
                        billId: bill.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/bills/$billId"
                  >
                     <Eye className="size-4" />
                  </Link>
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.bills.list-section.actions.view-details",
               )}
            </TooltipContent>
         </Tooltip>

         {!bill.completionDate && (
            <CompleteBillDialog bill={bill}>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button size="icon" variant="outline">
                        <Wallet className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                     {bill.type === "expense"
                        ? translate("dashboard.routes.bills.actions.pay")
                        : translate("dashboard.routes.bills.actions.receive")}
                  </TooltipContent>
               </Tooltip>
            </CompleteBillDialog>
         )}

         {!isCompleted && (
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     onClick={() =>
                        openSheet({
                           children: <ManageBillForm bill={bill} />,
                        })
                     }
                     size="icon"
                     variant="outline"
                  >
                     <Pencil className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate("dashboard.routes.bills.actions.edit")}
               </TooltipContent>
            </Tooltip>
         )}

         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  className="text-destructive hover:text-destructive"
                  onClick={handleDeleteBill}
                  size="icon"
                  variant="outline"
               >
                  <Trash2 className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate("dashboard.routes.bills.actions.delete")}
            </TooltipContent>
         </Tooltip>
      </div>
   );
}

export function createBillColumns(categories: Category[]): ColumnDef<Bill>[] {
   return [
      {
         accessorKey: "description",
         cell: ({ row }) => {
            const bill = row.original;
            const categoryDetails = categories.find(
               (cat) => cat.id === bill.categoryId,
            );
            const categoryColor = categoryDetails?.color || "#6b7280";
            const categoryIcon = categoryDetails?.icon || "Wallet";

            return (
               <div className="flex items-center gap-3">
                  <div
                     className="size-8 rounded-sm flex items-center justify-center"
                     style={{
                        backgroundColor: categoryColor,
                     }}
                  >
                     <IconDisplay
                        iconName={categoryIcon as IconName}
                        size={16}
                     />
                  </div>
                  <div className="flex flex-col">
                     <div className="flex items-center gap-2">
                        <span className="font-medium">{bill.description}</span>
                        {bill.isRecurring && bill.recurrencePattern && (
                           <Badge
                              className="text-[10px] h-5 px-1"
                              variant="outline"
                           >
                              <CalendarDays className="size-3 mr-1" />
                              {getRecurrenceLabel(
                                 bill.recurrencePattern as RecurrencePattern,
                              )}
                           </Badge>
                        )}
                     </div>
                     <span className="text-xs text-muted-foreground">
                        {categoryDetails?.name || "Sem categoria"}
                     </span>
                  </div>
               </div>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.bills.table.columns.description"),
      },
      {
         accessorKey: "dueDate",
         cell: ({ row }) => {
            const date = new Date(row.getValue("dueDate"));
            return formatDate(date, "DD/MM/YYYY");
         },
         enableSorting: true,
         header: translate("dashboard.routes.bills.table.columns.dueDate"),
      },
      {
         accessorKey: "status",
         cell: ({ row }) => {
            const bill = row.original;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue =
               bill.dueDate &&
               !bill.completionDate &&
               new Date(bill.dueDate) < today;
            const isCompleted = !!bill.completionDate;

            if (isCompleted) {
               return (
                  <Badge
                     className="gap-1 border-green-500 text-green-500"
                     variant="outline"
                  >
                     <CheckCircle2 className="size-3" />
                     {translate("dashboard.routes.bills.status.paid")}
                  </Badge>
               );
            }

            if (isOverdue) {
               return (
                  <Badge className="gap-1" variant="destructive">
                     <AlertCircle className="size-3" />
                     {translate("dashboard.routes.bills.status.overdue")}
                  </Badge>
               );
            }

            return (
               <Badge className="gap-1" variant="secondary">
                  <Clock className="size-3" />
                  {translate("dashboard.routes.bills.status.pending")}
               </Badge>
            );
         },
         header: translate("dashboard.routes.bills.table.columns.status"),
      },
      {
         accessorKey: "type",
         cell: ({ row }) => {
            const type = row.getValue("type") as string;
            const typeMap = {
               expense: translate("dashboard.routes.bills.type.payable"),
               income: translate("dashboard.routes.bills.type.receivable"),
            };
            return <span>{typeMap[type as keyof typeof typeMap]}</span>;
         },
         enableSorting: true,
         header: translate("dashboard.routes.bills.table.columns.type"),
      },
      {
         accessorKey: "amount",
         cell: ({ row }) => {
            const bill = row.original;
            const amount = Number.parseFloat(bill.amount);

            const formattedAmount = formatDecimalCurrency(amount);

            const variant = bill.type === "expense" ? "destructive" : "default";

            return (
               <div className="text-right">
                  <Badge variant={variant}>
                     {bill.type === "expense" ? "-" : "+"}
                     {formattedAmount}
                  </Badge>
               </div>
            );
         },
         enableSorting: true,
         header: () => (
            <div className="text-right">
               {translate("dashboard.routes.bills.table.columns.amount")}
            </div>
         ),
      },
      {
         cell: ({ row }) => {
            return <BillActionsCell bill={row.original} />;
         },
         header: "",
         id: "actions",
      },
   ];
}

function getBillStatus(bill: Bill) {
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const isOverdue =
      bill.dueDate && !bill.completionDate && new Date(bill.dueDate) < today;
   const isCompleted = !!bill.completionDate;

   if (isCompleted) {
      return {
         className: "border-green-500 text-green-500",
         icon: CheckCircle2,
         label: translate("dashboard.routes.bills.status.paid"),
         variant: "outline" as const,
      };
   }

   if (isOverdue) {
      return {
         className: "",
         icon: AlertCircle,
         label: translate("dashboard.routes.bills.status.overdue"),
         variant: "destructive" as const,
      };
   }

   return {
      className: "",
      icon: Clock,
      label: translate("dashboard.routes.bills.status.pending"),
      variant: "secondary" as const,
   };
}

interface BillMobileCardProps {
   row: Row<Bill>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   categories: Category[];
}

export function BillMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   categories,
}: BillMobileCardProps) {
   const bill = row.original;
   const category = categories.find((c) => c.id === bill.categoryId);
   const status = getBillStatus(bill);
   const StatusIcon = status.icon;

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <CardDescription className="flex items-center gap-2">
               <div
                  className="size-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: category?.color || "#6b7280" }}
               >
                  <IconDisplay
                     iconName={(category?.icon || "Wallet") as IconName}
                     size={12}
                  />
               </div>
               {category?.name || "Sem categoria"}
            </CardDescription>
            <CardTitle className="truncate">{bill.description}</CardTitle>
            <CardDescription>
               {translate("dashboard.routes.bills.table.columns.dueDate")}:{" "}
               {formatDate(new Date(bill.dueDate), "DD/MM/YYYY")}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex flex-wrap gap-2">
            <Badge className={status.className} variant={status.variant}>
               <StatusIcon className="size-3 mr-1" />
               {status.label}
            </Badge>
            <Badge
               variant={bill.type === "expense" ? "destructive" : "default"}
            >
               {bill.type === "expense" ? "-" : "+"}
               {formatDecimalCurrency(Number(bill.amount))}
            </Badge>
            {bill.isRecurring && bill.recurrencePattern && (
               <Badge variant="outline">
                  <CalendarDays className="size-3 mr-1" />
                  {getRecurrenceLabel(
                     bill.recurrencePattern as RecurrencePattern,
                  )}
               </Badge>
            )}
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

interface BillExpandedContentProps {
   row: Row<Bill>;
   categories: Category[];
}

export function BillExpandedContent({
   row,
   categories,
}: BillExpandedContentProps) {
   const { openSheet } = useSheet();
   const bill = row.original;
   const category = categories.find((c) => c.id === bill.categoryId);
   const { activeOrganization } = useActiveOrganization();
   const isMobile = useIsMobile();
   const { handleDeleteBill } = useDeleteBillDialog({ bill });

   const InfoItem = ({
      icon: Icon,
      label,
      value,
   }: {
      icon: React.ElementType;
      label: string;
      value: React.ReactNode;
   }) => (
      <div className="flex items-center gap-2">
         <Icon className="size-4 text-muted-foreground" />
         <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value}</p>
         </div>
      </div>
   );

   if (isMobile) {
      return (
         <div className="p-4 space-y-4">
            <div className="space-y-3">
               <InfoItem
                  icon={Wallet}
                  label={translate(
                     "dashboard.routes.bills.table.columns.amount",
                  )}
                  value={
                     <span
                        className={
                           bill.type === "expense"
                              ? "text-destructive"
                              : "text-emerald-500"
                        }
                     >
                        {bill.type === "expense" ? "-" : "+"}
                        {formatDecimalCurrency(Number(bill.amount))}
                     </span>
                  }
               />
               <Separator />
               <InfoItem
                  icon={Calendar}
                  label={translate(
                     "dashboard.routes.bills.table.columns.dueDate",
                  )}
                  value={formatDate(new Date(bill.dueDate), "DD/MM/YYYY")}
               />
               {bill.issueDate && (
                  <>
                     <Separator />
                     <InfoItem
                        icon={FileText}
                        label={translate(
                           "dashboard.routes.bills.features.create-bill.fields.issueDate",
                        )}
                        value={formatDate(
                           new Date(bill.issueDate),
                           "DD/MM/YYYY",
                        )}
                     />
                  </>
               )}
               <Separator />
               <div className="flex items-center gap-2">
                  <div
                     className="size-4 rounded flex items-center justify-center"
                     style={{ backgroundColor: category?.color || "#6b7280" }}
                  >
                     <IconDisplay
                        iconName={(category?.icon || "Wallet") as IconName}
                        size={10}
                     />
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bills.features.create-bill.fields.category",
                        )}
                     </p>
                     <p className="text-sm font-medium">
                        {category?.name || "Sem categoria"}
                     </p>
                  </div>
               </div>
               {bill.isRecurring && bill.recurrencePattern && (
                  <>
                     <Separator />
                     <InfoItem
                        icon={CalendarDays}
                        label="Recorrência"
                        value={getRecurrenceLabel(
                           bill.recurrencePattern as RecurrencePattern,
                        )}
                     />
                  </>
               )}
               {bill.bankAccount && (
                  <>
                     <Separator />
                     <InfoItem
                        icon={Building}
                        label={translate(
                           "dashboard.routes.bills.features.create-bill.fields.bankAccount",
                        )}
                        value={bill.bankAccount.name}
                     />
                  </>
               )}
               {bill.counterparty && (
                  <>
                     <Separator />
                     <InfoItem
                        icon={User}
                        label={translate(
                           "dashboard.routes.bills.features.create-bill.fields.counterparty",
                        )}
                        value={bill.counterparty?.name}
                     />
                  </>
               )}
               {bill.notes && (
                  <>
                     <Separator />
                     <InfoItem
                        icon={FileText}
                        label={translate(
                           "dashboard.routes.bills.features.create-bill.fields.notes",
                        )}
                        value={
                           <span className="truncate max-w-[200px]">
                              {bill.notes}
                           </span>
                        }
                     />
                  </>
               )}
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
                        billId: bill.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/bills/$billId"
                  >
                     <Eye className="size-4" />
                     {translate(
                        "dashboard.routes.bills.list-section.actions.view-details",
                     )}
                  </Link>
               </Button>
               {!bill.completionDate && (
                  <CompleteBillDialog bill={bill}>
                     <Button
                        className="w-full justify-start"
                        size="sm"
                        variant="outline"
                     >
                        <Wallet className="size-4" />
                        {bill.type === "expense"
                           ? translate("dashboard.routes.bills.actions.pay")
                           : translate(
                                "dashboard.routes.bills.actions.receive",
                             )}
                     </Button>
                  </CompleteBillDialog>
               )}
               {!bill.completionDate && (
                  <Button
                     className="w-full justify-start"
                     onClick={() => {
                        openSheet({ children: <ManageBillForm bill={bill} /> });
                     }}
                     size="sm"
                     variant="outline"
                  >
                     <Edit className="size-4" />
                     {translate("dashboard.routes.bills.actions.edit")}
                  </Button>
               )}
               <Button
                  className="w-full justify-start"
                  onClick={handleDeleteBill}
                  size="sm"
                  variant="destructive"
               >
                  <Trash2 className="size-4" />
                  {translate("dashboard.routes.bills.actions.delete")}
               </Button>
            </div>
         </div>
      );
   }

   return (
      <div className="p-4 flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <InfoItem
               icon={Wallet}
               label={translate("dashboard.routes.bills.table.columns.amount")}
               value={
                  <span
                     className={
                        bill.type === "expense"
                           ? "text-destructive"
                           : "text-emerald-500"
                     }
                  >
                     {bill.type === "expense" ? "-" : "+"}
                     {formatDecimalCurrency(Number(bill.amount))}
                  </span>
               }
            />
            <Separator className="h-8" orientation="vertical" />
            <InfoItem
               icon={Calendar}
               label={translate("dashboard.routes.bills.table.columns.dueDate")}
               value={formatDate(new Date(bill.dueDate), "DD/MM/YYYY")}
            />
            {bill.issueDate && (
               <>
                  <Separator className="h-8" orientation="vertical" />
                  <InfoItem
                     icon={FileText}
                     label={translate(
                        "dashboard.routes.bills.features.create-bill.fields.issueDate",
                     )}
                     value={formatDate(new Date(bill.issueDate), "DD/MM/YYYY")}
                  />
               </>
            )}
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <div
                  className="size-4 rounded flex items-center justify-center"
                  style={{ backgroundColor: category?.color || "#6b7280" }}
               >
                  <IconDisplay
                     iconName={(category?.icon || "Wallet") as IconName}
                     size={10}
                  />
               </div>
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.bills.features.create-bill.fields.category",
                     )}
                  </p>
                  <p className="text-sm font-medium">
                     {category?.name || "Sem categoria"}
                  </p>
               </div>
            </div>
            {bill.isRecurring && bill.recurrencePattern && (
               <>
                  <Separator className="h-8" orientation="vertical" />
                  <InfoItem
                     icon={CalendarDays}
                     label="Recorrência"
                     value={getRecurrenceLabel(
                        bill.recurrencePattern as RecurrencePattern,
                     )}
                  />
               </>
            )}
            {bill.bankAccount && (
               <>
                  <Separator className="h-8" orientation="vertical" />
                  <InfoItem
                     icon={Building}
                     label={translate(
                        "dashboard.routes.bills.features.create-bill.fields.bankAccount",
                     )}
                     value={bill.bankAccount.name}
                  />
               </>
            )}
            {bill.counterparty && (
               <>
                  <Separator className="h-8" orientation="vertical" />
                  <InfoItem
                     icon={User}
                     label={translate(
                        "dashboard.routes.bills.features.create-bill.fields.counterparty",
                     )}
                     value={bill.counterparty?.name}
                  />
               </>
            )}
         </div>

         <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{
                     billId: bill.id,
                     slug: activeOrganization.slug,
                  }}
                  to="/$slug/bills/$billId"
               >
                  <Eye className="size-4" />
                  {translate(
                     "dashboard.routes.bills.list-section.actions.view-details",
                  )}
               </Link>
            </Button>
            {!bill.completionDate && (
               <CompleteBillDialog bill={bill}>
                  <Button size="sm" variant="outline">
                     <Wallet className="size-4" />
                     {bill.type === "expense"
                        ? translate("dashboard.routes.bills.actions.pay")
                        : translate("dashboard.routes.bills.actions.receive")}
                  </Button>
               </CompleteBillDialog>
            )}

            {!bill.completionDate && (
               <Button
                  onClick={() => {
                     openSheet({ children: <ManageBillForm bill={bill} /> });
                  }}
                  size="sm"
                  variant="outline"
               >
                  <Edit className="size-4" />
                  {translate("dashboard.routes.bills.actions.edit")}
               </Button>
            )}
            <Button onClick={handleDeleteBill} size="sm" variant="destructive">
               <Trash2 className="size-4" />
               {translate("dashboard.routes.bills.actions.delete")}
            </Button>
         </div>
      </div>
   );
}
