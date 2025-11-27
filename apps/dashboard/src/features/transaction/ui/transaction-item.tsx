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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDecimalCurrency } from "@packages/utils/money";
import { Link } from "@tanstack/react-router";
import { Eye, MoreVertical, Split } from "lucide-react";
import { Suspense } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import type { Category } from "@/pages/categories/ui/categories-page";
import { DeleteTransaction } from "../features/delete-transaction-dialog";
import { ManageTransactionSheet } from "../features/manage-transaction-sheet";

type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

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
   const { activeOrganization } = useActiveOrganization();
   const transactionCategoryIds =
      transaction.transactionCategories?.map((tc) => tc.category.id) || [];
   const categorySplits = transaction.categorySplits as CategorySplit[] | null;
   const hasSplit = categorySplits && categorySplits.length > 0;

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
      <Item size="sm">
         <ItemMedia
            className="shrink-0"
            style={{
               backgroundColor: categoryColor,
            }}
            variant="icon"
         >
            <IconDisplay iconName={categoryIcon as IconName} size={16} />
         </ItemMedia>
         <ItemContent className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
               <ItemTitle className="truncate flex-1 min-w-0">
                  {transaction.description}
               </ItemTitle>
               {hasSplit && (
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Split className="size-3.5 text-muted-foreground shrink-0" />
                     </TooltipTrigger>
                     <TooltipContent className="space-y-1.5 p-3">
                        {getSplitTooltipContent()}
                     </TooltipContent>
                  </Tooltip>
               )}
            </div>
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
                  <DropdownMenuItem asChild>
                     <Link
                        params={{
                           slug: activeOrganization.slug,
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
