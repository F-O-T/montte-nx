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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDecimalCurrency } from "@packages/utils/money";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   ArrowLeftRight,
   ChevronDown,
   Eye,
   FolderOpen,
   Paperclip,
   Pencil,
   Split,
   Trash2,
} from "lucide-react";
import { useState } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { CategorizeSheet } from "@/features/transaction/features/categorize-sheet";
import { CategorySplitSheet } from "@/features/transaction/features/category-split-sheet";
import { DeleteTransaction } from "@/features/transaction/features/delete-transaction-dialog";
import { LinkFileSheet } from "@/features/transaction/features/link-file-sheet";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";
import { MarkAsTransferSheet } from "@/features/transaction/features/mark-as-transfer-sheet";
import type { Transaction } from "@/features/transaction/ui/transaction-item";
import type { Category } from "@/pages/categories/ui/categories-page";

type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

function getCategoryDetails(transaction: Transaction, categories: Category[]) {
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
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   return (
      <>
         <div className="flex justify-end gap-1">
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
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     onClick={() => setIsEditOpen(true)}
                     size="icon"
                     variant="outline"
                  >
                     <Pencil className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.transactions.list-section.actions.edit",
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
                     "dashboard.routes.transactions.list-section.actions.delete",
                  )}
               </TooltipContent>
            </Tooltip>
         </div>
         <ManageTransactionSheet
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            transaction={transaction}
         />
         <DeleteTransaction
            onOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            transaction={transaction}
         />
      </>
   );
}

export function createTransactionColumns(
   categories: Category[],
   slug: string,
): ColumnDef<Transaction>[] {
   return [
      {
         cell: ({ row }) => {
            const transaction = row.original;
            const category = getCategoryDetails(transaction, categories);

            return (
               <ItemMedia
                  style={{ backgroundColor: category.color }}
                  variant="icon"
               >
                  <IconDisplay iconName={category.icon as IconName} size={16} />
               </ItemMedia>
            );
         },
         header: "",
         id: "icon",
         size: 48,
      },
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
               <Badge
                  className="font-normal truncate max-w-[120px]"
                  style={{
                     backgroundColor: `${category.color}20`,
                     color: category.color,
                  }}
                  variant="secondary"
               >
                  {category.name}
               </Badge>
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
            return new Date(row.getValue("date")).toLocaleDateString("pt-BR", {
               day: "2-digit",
               month: "short",
               year: "numeric",
            });
         },
         enableSorting: false,

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

type TransactionExpandedContentProps = {
   row: Row<Transaction>;
   categories: Category[];
   slug: string;
};

export function TransactionExpandedContent({
   row,
   categories,
   slug,
}: TransactionExpandedContentProps) {
   const transaction = row.original;
   const tags = transaction.transactionTags || [];
   const categorySplits = transaction.categorySplits as CategorySplit[] | null;
   const hasSplit = categorySplits && categorySplits.length > 0;
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isTransferOpen, setIsTransferOpen] = useState(false);
   const [isSplitOpen, setIsSplitOpen] = useState(false);
   const [isCategorizeOpen, setIsCategorizeOpen] = useState(false);
   const [isLinkFileOpen, setIsLinkFileOpen] = useState(false);

   const isNotTransfer = transaction.type !== "transfer";

   return (
      <div className="p-4 space-y-4">
         {hasSplit && (
            <div>
               <p className="text-xs text-muted-foreground mb-2">
                  Divisão por Categoria
               </p>
               <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {categorySplits.map((split) => {
                     const cat = categories.find(
                        (c) => c.id === split.categoryId,
                     );
                     if (!cat) return null;
                     return (
                        <div
                           className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50"
                           key={split.categoryId}
                        >
                           <div className="flex items-center gap-2">
                              <div
                                 className="size-3 rounded-sm shrink-0"
                                 style={{ backgroundColor: cat.color }}
                              />
                              <span className="text-sm truncate">
                                 {cat.name}
                              </span>
                           </div>
                           <span className="text-sm font-medium shrink-0">
                              {formatDecimalCurrency(split.value / 100)}
                           </span>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         {tags.length > 0 && (
            <div>
               <p className="text-xs text-muted-foreground mb-2">Tags</p>
               <div className="flex flex-wrap gap-1">
                  {tags.map((transactionTag) => (
                     <Link
                        key={transactionTag.tag.id}
                        params={{ slug, tagId: transactionTag.tag.id }}
                        to="/$slug/tags/$tagId"
                     >
                        <Badge
                           className="cursor-pointer hover:opacity-80 transition-opacity"
                           style={{
                              backgroundColor: transactionTag.tag.color,
                           }}
                           variant="secondary"
                        >
                           {transactionTag.tag.name}
                        </Badge>
                     </Link>
                  ))}
               </div>
            </div>
         )}

         {transaction.costCenter && (
            <div>
               <p className="text-xs text-muted-foreground mb-1">
                  Centro de Custo
               </p>
               <p className="text-sm font-medium">
                  {transaction.costCenter.name}
               </p>
            </div>
         )}

         {transaction.bankAccount && (
            <div>
               <p className="text-xs text-muted-foreground mb-1">Conta</p>
               <p className="text-sm font-medium">
                  {transaction.bankAccount.name}
               </p>
            </div>
         )}

         <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {isNotTransfer && (
               <>
                  <Button
                     onClick={() => setIsTransferOpen(true)}
                     size="sm"
                     variant="outline"
                  >
                     <ArrowLeftRight className="size-4" />
                     Marcar Transferência
                  </Button>
                  <Button
                     onClick={() => setIsSplitOpen(true)}
                     size="sm"
                     variant="outline"
                  >
                     <Split className="size-4" />
                     Dividir Categorias
                  </Button>
               </>
            )}
            <Button
               onClick={() => setIsCategorizeOpen(true)}
               size="sm"
               variant="outline"
            >
               <FolderOpen className="size-4" />
               Categorizar
            </Button>
            <Button
               onClick={() => setIsLinkFileOpen(true)}
               size="sm"
               variant="outline"
            >
               <Paperclip className="size-4" />
               {translate("dashboard.routes.transactions.link-file.button")}
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{ slug, transactionId: transaction.id }}
                  to="/$slug/transactions/$transactionId"
               >
                  <Eye className="size-4" />
                  Ver Detalhes
               </Link>
            </Button>
            <Button
               onClick={() => setIsEditOpen(true)}
               size="sm"
               variant="outline"
            >
               <Pencil className="size-4" />
               Editar
            </Button>
            <Button
               onClick={() => setIsDeleteOpen(true)}
               size="sm"
               variant="destructive"
            >
               <Trash2 className="size-4" />
               Excluir
            </Button>
         </div>

         <ManageTransactionSheet
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            transaction={transaction}
         />
         <DeleteTransaction
            onOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            transaction={transaction}
         />
         <MarkAsTransferSheet
            isOpen={isTransferOpen}
            onOpenChange={setIsTransferOpen}
            transactions={[transaction]}
         />
         <CategorySplitSheet
            isOpen={isSplitOpen}
            onOpenChange={setIsSplitOpen}
            transaction={transaction}
         />
         <CategorizeSheet
            isOpen={isCategorizeOpen}
            onOpenChange={setIsCategorizeOpen}
            transactions={[transaction]}
         />
         <LinkFileSheet
            isOpen={isLinkFileOpen}
            onOpenChange={setIsLinkFileOpen}
            transaction={transaction}
         />
      </div>
   );
}

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
                  {new Date(transaction.date).toLocaleDateString("pt-BR", {
                     day: "2-digit",
                     month: "short",
                     year: "numeric",
                  })}
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
