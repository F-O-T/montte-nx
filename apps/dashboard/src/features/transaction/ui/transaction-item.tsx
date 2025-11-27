import type { RouterOutput } from "@packages/api/client";
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
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { formatDecimalCurrency } from "@packages/utils/money";
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
   const transactionCategoryIds =
      transaction.transactionCategories?.map((tc) => tc.category.id) || [];

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
      <Item size="sm">
         <ItemMedia
            style={{
               backgroundColor: categoryColor,
            }}
            variant="icon"
         >
            <IconDisplay iconName={categoryIcon as IconName} size={16} />
         </ItemMedia>
         <ItemContent className="min-w-0 flex-1 overflow-hidden">
            <ItemTitle className="truncate">
               {transaction.description}
            </ItemTitle>
            <ItemDescription>
               {new Date(transaction.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
               })}
            </ItemDescription>
         </ItemContent>
         <ItemActions className="ml-auto shrink-0">
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
                  >
                     <ManageTransactionSheet
                        asChild
                        transaction={transaction}
                     />
                     <DeleteTransaction asChild transaction={transaction} />
                  </Suspense>
               </DropdownMenuContent>
            </DropdownMenu>
         </ItemActions>
      </Item>
   );
}
