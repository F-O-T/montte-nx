import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import {
   ArrowLeftRight,
   ArrowRight,
   Eye,
   FolderOpen,
   Paperclip,
   Pencil,
   Split,
   Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/integrations/clients";
import { CategorizeSheet } from "./categorize-sheet";
import { CategorySplitSheet } from "./category-split-sheet";
import { DeleteTransaction } from "./delete-transaction-dialog";
import { LinkFileSheet } from "./link-file-sheet";
import { ManageTransactionSheet } from "./manage-transaction-sheet";
import { MarkAsTransferSheet } from "./mark-as-transfer-sheet";
import type { Category, Transaction } from "./transaction-list";

type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

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
   const trpc = useTRPC();
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

   const isTransfer = transaction.type === "transfer";
   const isNotTransfer = !isTransfer;

   const { data: attachments = [] } = useQuery(
      trpc.transactions.getAttachments.queryOptions({
         transactionId: transaction.id,
      }),
   );

   const { data: transferLog } = useQuery({
      ...trpc.transactions.getTransferLog.queryOptions({
         transactionId: transaction.id,
      }),
      enabled: isTransfer,
   });

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

         {isTransfer &&
            transferLog &&
            (() => {
               const amount = Number.parseFloat(transaction.amount);
               const isIncoming = amount > 0;

               return (
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <ArrowLeftRight className="size-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                           Transferência
                        </p>
                        <Badge variant={isIncoming ? "default" : "destructive"}>
                           {isIncoming ? "Entrada" : "Saída"}
                        </Badge>
                     </div>
                     <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                           <p className="text-[10px] uppercase text-muted-foreground mb-0.5">
                              Origem
                           </p>
                           <p className="text-sm font-medium">
                              {transferLog.fromBankAccount?.name}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              {transferLog.fromBankAccount?.bank}
                           </p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 text-right">
                           <p className="text-[10px] uppercase text-muted-foreground mb-0.5">
                              Destino
                           </p>
                           <p className="text-sm font-medium">
                              {transferLog.toBankAccount?.name}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              {transferLog.toBankAccount?.bank}
                           </p>
                        </div>
                     </div>
                  </div>
               );
            })()}

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

         {attachments.length > 0 && (
            <div>
               <p className="text-xs text-muted-foreground mb-1">Anexos</p>
               <Badge variant="outline">
                  <Paperclip className="size-3 mr-1.5" />
                  {attachments.length}{" "}
                  {attachments.length === 1 ? "arquivo" : "arquivos"}
               </Badge>
            </div>
         )}

         <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {isNotTransfer && (
               <Button
                  onClick={() => setIsTransferOpen(true)}
                  size="sm"
                  variant="outline"
               >
                  <ArrowLeftRight className="size-4" />
                  Marcar Transferência
               </Button>
            )}

            <Button
               onClick={() => setIsSplitOpen(true)}
               size="sm"
               variant="outline"
            >
               <Split className="size-4" />
               Dividir Categorias
            </Button>

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
