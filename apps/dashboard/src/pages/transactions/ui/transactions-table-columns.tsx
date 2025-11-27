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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDecimalCurrency } from "@packages/utils/money";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Split } from "lucide-react";
import { Suspense } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { DeleteTransaction } from "@/features/transaction/features/delete-transaction-dialog";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";
import type { Transaction } from "@/features/transaction/ui/transaction-item";
import type { Category } from "@/pages/categories/ui/categories-page";

type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

export function createTransactionColumns(
   categories: Category[],
   slug: string,
): ColumnDef<Transaction>[] {
   return [
      {
         accessorKey: "description",
         cell: ({ row }) => {
            const transaction = row.original;
            const transactionCategoryIds =
               transaction.transactionCategories?.map((tc) => tc.category.id) ||
               [];
            const categorySplits = transaction.categorySplits as
               | CategorySplit[]
               | null;
            const hasSplit = categorySplits && categorySplits.length > 0;
            const primaryCategoryId = transactionCategoryIds[0];
            const categoryDetails = categories.find(
               (cat) => cat.id === primaryCategoryId,
            );
            const categoryColor = categoryDetails?.color || "#6b7280";
            const categoryIcon = categoryDetails?.icon || "Wallet";

            const getSplitTooltipContent = () => {
               if (!hasSplit) return null;
               return categorySplits.map((split) => {
                  const cat = categories.find((c) => c.id === split.categoryId);
                  if (!cat) return null;
                  return (
                     <div
                        className="flex items-center justify-between gap-4"
                        key={split.categoryId}
                     >
                        <div className="flex items-center gap-2">
                           <div
                              className="size-3 rounded-sm"
                              style={{ backgroundColor: cat.color }}
                           />
                           <span>{cat.name}</span>
                        </div>
                        <span className="font-medium">
                           {formatDecimalCurrency(split.value / 100)}
                        </span>
                     </div>
                  );
               });
            };

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
                     <div className="flex items-center gap-1.5">
                        <span className="font-medium">
                           {transaction.description}
                        </span>
                        {hasSplit && (
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Split className="size-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="space-y-1.5 p-3">
                                 {getSplitTooltipContent()}
                              </TooltipContent>
                           </Tooltip>
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
         header: translate(
            "dashboard.routes.transactions.table.columns.description",
         ),
      },
      {
         accessorKey: "date",
         cell: ({ row }) => {
            return new Date(row.getValue("date")).toLocaleDateString("pt-BR", {
               day: "2-digit",
               month: "short",
               year: "numeric",
            });
         },
         enableSorting: true,
         header: translate("dashboard.routes.transactions.table.columns.date"),
      },
      {
         accessorKey: "type",
         cell: ({ row }) => {
            const type = row.getValue("type") as string;
            const typeMap = {
               expense: "Despesa",
               income: "Receita",
               transfer: "Transferência",
            };
            return <span>{typeMap[type as keyof typeof typeMap]}</span>;
         },
         enableSorting: true,
         header: translate("dashboard.routes.transactions.table.columns.type"),
      },
      {
         accessorKey: "amount",
         cell: ({ row }) => {
            const transaction = row.original;
            const amount = Number.parseFloat(transaction.amount);
            const isPositive =
               transaction.type === "income" ||
               (transaction.type === "transfer" && amount > 0);
            const formattedAmount = formatDecimalCurrency(Math.abs(amount));

            return (
               <div className="text-right">
                  <Badge variant={isPositive ? "default" : "destructive"}>
                     {isPositive ? "+" : "-"}
                     {formattedAmount}
                  </Badge>
               </div>
            );
         },
         enableSorting: true,
         header: () => (
            <div className="text-right">
               {translate("dashboard.routes.transactions.table.columns.amount")}
            </div>
         ),
      },
      {
         cell: ({ row }) => {
            const transaction = row.original;

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
                           {translate(
                              "dashboard.routes.transactions.list-section.actions.label",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link
                              params={{
                                 slug,
                                 transactionId: transaction.id,
                              }}
                              to="/$slug/transactions/$transactionId"
                           >
                              <Eye className="size-4" />
                              {translate(
                                 "dashboard.routes.transactions.list-section.actions.view-details",
                              )}
                           </Link>
                        </DropdownMenuItem>
                        <Suspense
                           fallback={
                              <DropdownMenuItem disabled>
                                 Loading...
                              </DropdownMenuItem>
                           }
                        >
                           <ManageTransactionSheet
                              asChild
                              transaction={transaction}
                           />
                           <DeleteTransaction
                              asChild
                              transaction={transaction}
                           />
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
