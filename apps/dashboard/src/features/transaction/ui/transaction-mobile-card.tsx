import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import { CollapsibleTrigger } from "@packages/ui/components/collapsible";
import { ItemMedia } from "@packages/ui/components/item";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import type { Row } from "@tanstack/react-table";
import { ChevronDown, Split } from "lucide-react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category, Transaction } from "./transaction-list";
import { getCategoryDetails } from "./transaction-table-columns";

type TransactionMobileCardProps = {
   row: Row<Transaction>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   categories: Category[];
};

export function TransactionMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   categories,
}: TransactionMobileCardProps) {
   const transaction = row.original;
   const category = getCategoryDetails(transaction, categories);
   const amount = Number.parseFloat(transaction.amount);
   const isPositive =
      transaction.type === "income" ||
      (transaction.type === "transfer" && amount > 0);
   const formattedAmount = formatDecimalCurrency(Math.abs(amount));
   const categorySplits = transaction.categorySplits;
   const hasSplit = categorySplits && categorySplits.length > 0;

   return (
      <Card className={isExpanded ? "rounded-b-none py-4" : "py-4"}>
         <CardHeader className="flex items-center gap-2">
            <ItemMedia
               className="shrink-0"
               style={{ backgroundColor: category.color }}
               variant="icon"
            >
               <IconDisplay iconName={category.icon as IconName} size={16} />
            </ItemMedia>
            <div className="min-w-0 flex-1">
               <CardTitle className="flex items-center gap-1.5 text-sm">
                  <span className="truncate">{transaction.description}</span>
                  {hasSplit && (
                     <Split className="size-3.5 text-muted-foreground shrink-0" />
                  )}
               </CardTitle>
               <CardDescription>
                  {formatDate(new Date(transaction.date), "DD MMM YYYY")}
               </CardDescription>
            </div>
            <CardAction>
               <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
               />
            </CardAction>
         </CardHeader>
         <CardContent>
            <Badge variant={isPositive ? "default" : "destructive"}>
               {isPositive ? "+" : "-"}
               {formattedAmount}
            </Badge>
         </CardContent>
         <CardFooter>
            <CollapsibleTrigger asChild onClick={toggleExpanded}>
               <Button className="w-full" variant="outline">
                  <ChevronDown
                     className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                  {translate(
                     "dashboard.routes.transactions.list-section.actions.view-details",
                  )}
               </Button>
            </CollapsibleTrigger>
         </CardFooter>
      </Card>
   );
}
