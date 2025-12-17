import { translate } from "@packages/localization";
import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
   ArrowDownLeft,
   ArrowLeftRight,
   ArrowUpRight,
   Eye,
   Split,
} from "lucide-react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category, Transaction } from "./transaction-list";

const TRANSACTION_TYPE_CONFIG = {
   expense: {
      color: "#ef4444",
      icon: ArrowUpRight,
      label: translate("dashboard.routes.transactions.list-section.types.expense"),
   },
   income: {
      color: "#10b981",
      icon: ArrowDownLeft,
      label: translate("dashboard.routes.transactions.list-section.types.income"),
   },
   transfer: {
      color: "#3b82f6",
      icon: ArrowLeftRight,
      label: translate(
         "dashboard.routes.transactions.list-section.types.transfer",
      ),
   },
} as const;

type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

export function getCategoryDetails(
   transaction: Transaction,
   categories: Category[],
) {
   const transactionCategoryIds =
      transaction.transactionCategories?.map((tc) => tc.category.id) || [];
   const primaryCategoryId = transactionCategoryIds[0];
   const categoryDetails = categories.find(
      (cat) => cat.id === primaryCategoryId,
   );
   return {
      color: categoryDetails?.color || "#6b7280",
      icon: categoryDetails?.icon || "Wallet",
      name: categoryDetails?.name || "Sem categoria",
   };
}

function TransactionActionsCell({
   transaction,
   slug,
}: {
   transaction: Transaction;
   slug: string;
}) {
   return (
      <div className="flex justify-end">
         <Tooltip>
            <TooltipTrigger asChild>
               <Button asChild size="icon" variant="outline">
                  <Link
                     params={{
                        slug,
                        transactionId: transaction.id,
                     }}
                     to="/$slug/transactions/$transactionId"
                  >
                     <Eye className="size-4" />
                  </Link>
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.transactions.list-section.actions.view-details",
               )}
            </TooltipContent>
         </Tooltip>
      </div>
   );
}

export function createTransactionColumns(
   categories: Category[],
   slug: string,
): ColumnDef<Transaction>[] {
   return [
      {
         accessorKey: "description",
         cell: ({ row }) => {
            const transaction = row.original;
            const categorySplits = transaction.categorySplits as
               | CategorySplit[]
               | null;
            const hasSplit = categorySplits && categorySplits.length > 0;

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
               <div className="flex items-center gap-1.5">
                  <span className="font-medium block max-w-[200px] truncate">
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
            );
         },
         enableSorting: false,
         header: translate(
            "dashboard.routes.transactions.table.columns.description",
         ),

         maxSize: 200,
      },
      {
         cell: ({ row }) => {
            const transaction = row.original;
            const category = getCategoryDetails(transaction, categories);

            return (
               <Announcement>
                  <AnnouncementTag
                     style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                     }}
                  >
                     <IconDisplay iconName={category.icon as IconName} size={14} />
                  </AnnouncementTag>
                  <AnnouncementTitle className="max-w-[120px] truncate">
                     {category.name}
                  </AnnouncementTitle>
               </Announcement>
            );
         },
         enableSorting: false,
         header: translate(
            "dashboard.routes.transactions.table.columns.category",
         ),
         id: "category",
      },
      {
         accessorKey: "date",
         cell: ({ row }) => {
            return formatDate(new Date(row.getValue("date")), "DD MMM YYYY");
         },
         enableSorting: false,

         header: translate("dashboard.routes.transactions.table.columns.date"),
      },
      {
         accessorKey: "type",
         cell: ({ row }) => {
            const type = row.getValue("type") as keyof typeof TRANSACTION_TYPE_CONFIG;
            const config = TRANSACTION_TYPE_CONFIG[type];
            const Icon = config.icon;

            return (
               <Announcement>
                  <AnnouncementTag
                     style={{
                        backgroundColor: `${config.color}20`,
                        color: config.color,
                     }}
                  >
                     <Icon className="size-3.5" />
                  </AnnouncementTag>
                  <AnnouncementTitle>{config.label}</AnnouncementTitle>
               </Announcement>
            );
         },
         enableSorting: false,
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
               <div>
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
         cell: ({ row }) => (
            <TransactionActionsCell slug={slug} transaction={row.original} />
         ),
         header: "",
         id: "actions",
      },
   ];
}
