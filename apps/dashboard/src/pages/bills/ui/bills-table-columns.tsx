import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { formatDecimalCurrency } from "@packages/utils/money";
import {
   getRecurrenceLabel,
   type RecurrencePattern,
} from "@packages/utils/recurrence";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
   AlertCircle,
   CalendarDays,
   CheckCircle2,
   Clock,
   MoreVertical,
   Pencil,
   Trash2,
   Wallet,
} from "lucide-react";
import { Suspense, useState } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category } from "@/pages/categories/ui/categories-page";
import { CompleteBillDialog } from "../features/complete-bill-dialog";
import { DeleteBillDialog } from "../features/delete-bill-dialog";
import { ManageBillSheet } from "../features/manage-bill-sheet";

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
            return format(date, "dd/MM/yyyy");
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
            const bill = row.original;

            return (
               <div className="flex justify-end">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label="Actions"
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                           {translate("dashboard.routes.bills.actions.label")}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Suspense
                           fallback={
                              <DropdownMenuItem disabled>
                                 Loading...
                              </DropdownMenuItem>
                           }
                        >
                           {!bill.completionDate && (
                              <CompleteBillDialog bill={bill}>
                                 <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                 >
                                    <Wallet className="size-4 mr-2" />
                                    {bill.type === "expense"
                                       ? translate(
                                            "dashboard.routes.bills.actions.pay",
                                         )
                                       : translate(
                                            "dashboard.routes.bills.actions.receive",
                                         )}
                                 </DropdownMenuItem>
                              </CompleteBillDialog>
                           )}

                           <ManageBillSheetWrapper bill={bill} />

                           <DeleteBillDialog bill={bill}>
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onSelect={(e) => e.preventDefault()}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 {translate(
                                    "dashboard.routes.bills.actions.delete",
                                 )}
                              </DropdownMenuItem>
                           </DeleteBillDialog>
                        </Suspense>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            );
         },
         header: "",
         id: "actions",
      },
   ];
}

// Wrapper for ManageBillSheet to handle state if needed, or just use it if adapted
// Looking at BillItem, it uses useState for isOpen.
// Transaction uses `asChild` which likely means `ManageTransactionSheet` wraps `SheetTrigger` or similar.
// I'll check ManageBillSheet. If it doesn't support asChild, I might need to rewrite it or wrap it.
// For now I'll create a small wrapper component inside this file or just put the logic here.

function ManageBillSheetWrapper({ bill }: { bill: Bill }) {
   const [isOpen, setIsOpen] = useState(false);
   return (
      <>
         <DropdownMenuItem
            onSelect={(e) => {
               e.preventDefault();
               setIsOpen(true);
            }}
         >
            <Pencil className="size-4 mr-2" />
            {translate("dashboard.routes.bills.actions.edit")}
         </DropdownMenuItem>
         <ManageBillSheet
            bill={bill}
            onOpen={isOpen}
            onOpenChange={setIsOpen}
         />
      </>
   );
}
