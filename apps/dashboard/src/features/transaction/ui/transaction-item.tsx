import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { formatDecimalCurrency } from "@packages/utils/money";
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
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { MoreVertical } from "lucide-react";
import { Suspense } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category } from "@/pages/categories/ui/categories-page";
import { DeleteTransaction } from "../features/delete-transaction-dialog";
import { ManageTransactionSheet } from "../features/manage-transaction-sheet";

export type Transaction =
   RouterOutput["transactions"]["getAllPaginated"]["transactions"][number];
type TransactionItemProps = {
   transaction: Transaction;
   categories: Category[];
};
export function TransactionItem({
   transaction,
   categories,
}: TransactionItemProps) {
   const transactionCategoryIds = transaction.categoryIds;

   const primaryCategoryId = transactionCategoryIds[0];
   const categoryDetails = categories.find(
      (cat) => cat.id === primaryCategoryId,
   );
   const categoryColor = categoryDetails?.color || "#6b7280";
   const categoryIcon = categoryDetails?.icon || "Wallet";

   const amount = parseFloat(transaction.amount);
   const isPositive =
      transaction.type === "income" ||
      (transaction.type === "transfer" && amount > 0);
   const formattedAmount = formatDecimalCurrency(Math.abs(amount));

   return (
      <Item>
         <ItemMedia
            style={{
               backgroundColor: categoryColor,
            }}
            variant="icon"
         >
            <IconDisplay iconName={categoryIcon as IconName} size={16} />
         </ItemMedia>
         <ItemContent>
            <ItemTitle className="truncate">
               {transaction.description}
            </ItemTitle>
            <ItemDescription>
               {new Date(transaction.date).toLocaleDateString()}
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            <Badge variant={isPositive ? "default" : "destructive"}>
               {isPositive ? "+" : "-"}
               {formattedAmount}
            </Badge>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button aria-label="Actions" size="icon" variant="ghost">
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
                  <Suspense
                     fallback={
                        <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                     }
                  ></Suspense>
                  <ManageTransactionSheet asChild transaction={transaction} />
                  <DeleteTransaction asChild transaction={transaction} />
               </DropdownMenuContent>
            </DropdownMenu>
         </ItemActions>
      </Item>
   );
}
