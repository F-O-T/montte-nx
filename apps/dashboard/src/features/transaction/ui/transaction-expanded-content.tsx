import { translate } from "@packages/localization";
import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import {
   ArrowLeftRight,
   ArrowRight,
   CalendarPlus,
   Copy,
   Eye,
   FolderOpen,
   Landmark,
   Paperclip,
   Pencil,
   PiggyBank,
   RotateCcw,
   Split,
   Trash2,
   TrendingUp,
} from "lucide-react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { CategorizeForm } from "./categorize-form";
import { CategorySplitForm } from "./category-split-form";
import { DuplicateTransactionSheet } from "./duplicate-transaction-sheet";
import { LinkFileForm } from "./link-file-form";
import { ManageTransactionForm } from "./manage-transaction-form";
import { MarkAsTransferForm } from "./mark-as-transfer-form";
import { RecurrenceTransactionSheet } from "./recurrence-transaction-sheet";
import { RefundTransactionSheet } from "./refund-transaction-sheet";
import type { Category, Transaction } from "./transaction-list";
import { useDeleteTransaction } from "./use-delete-transaction";

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

function getAccountTypeIcon(type: string | null | undefined) {
   switch (type) {
      case "savings":
         return PiggyBank;
      case "investment":
         return TrendingUp;
      default:
         return Landmark;
   }
}

export function TransactionExpandedContent({
   row,
   categories,
   slug,
}: TransactionExpandedContentProps) {
   const trpc = useTRPC();
   const { openSheet } = useSheet();
   const transaction = row.original;
   const tags = transaction.transactionTags || [];
   const categorySplits = transaction.categorySplits as CategorySplit[] | null;
   const hasSplit = categorySplits && categorySplits.length > 0;

   const { deleteTransaction } = useDeleteTransaction({ transaction });

   const handleDuplicate = () => {
      openSheet({
         children: (
            <DuplicateTransactionSheet
               transaction={{
                  amount: transaction.amount,
                  bankAccountId: transaction.bankAccountId,
                  categoryIds:
                     transaction.transactionCategories?.map(
                        (tc) => tc.category.id,
                     ) || [],
                  costCenterId: transaction.costCenterId,
                  date: new Date(transaction.date),
                  description: transaction.description,
                  tagIds:
                     transaction.transactionTags?.map((tt) => tt.tag.id) || [],
                  type: transaction.type as "expense" | "income" | "transfer",
               }}
            />
         ),
      });
   };

   const handleRefund = () => {
      openSheet({
         children: (
            <RefundTransactionSheet
               transaction={{
                  amount: transaction.amount,
                  bankAccountId: transaction.bankAccountId,
                  categoryIds:
                     transaction.transactionCategories?.map(
                        (tc) => tc.category.id,
                     ) || [],
                  costCenterId: transaction.costCenterId,
                  date: new Date(transaction.date),
                  description: transaction.description,
                  tagIds:
                     transaction.transactionTags?.map((tt) => tt.tag.id) || [],
                  type: transaction.type as "expense" | "income" | "transfer",
               }}
            />
         ),
      });
   };

   const handleCreateRecurrence = () => {
      const primaryCategoryId =
         transaction.transactionCategories?.[0]?.category.id;
      openSheet({
         children: (
            <RecurrenceTransactionSheet
               transaction={{
                  amount: transaction.amount,
                  bankAccountId: transaction.bankAccountId,
                  categoryId: primaryCategoryId,
                  description: transaction.description,
                  type: transaction.type as "expense" | "income" | "transfer",
               }}
            />
         ),
      });
   };

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
         {(hasSplit ||
            tags.length > 0 ||
            transaction.costCenter ||
            transaction.bankAccount ||
            attachments.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
               {hasSplit && (
                  <>
                     {categorySplits.map((split) => {
                        const cat = categories.find(
                           (c) => c.id === split.categoryId,
                        );
                        if (!cat) return null;
                        return (
                           <Announcement key={split.categoryId}>
                              <AnnouncementTag
                                 className="flex items-center gap-1.5"
                                 style={{
                                    backgroundColor: `${cat.color}20`,
                                    color: cat.color,
                                 }}
                              >
                                 <IconDisplay
                                    iconName={(cat.icon || "Tag") as IconName}
                                    size={14}
                                 />
                                 {cat.name}
                              </AnnouncementTag>
                              <AnnouncementTitle>
                                 {formatDecimalCurrency(split.value / 100)}
                              </AnnouncementTitle>
                           </Announcement>
                        );
                     })}
                     {(tags.length > 0 ||
                        transaction.costCenter ||
                        transaction.bankAccount ||
                        attachments.length > 0) && (
                        <div className="h-4 w-px bg-border" />
                     )}
                  </>
               )}

               {tags.length > 0 && (
                  <>
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
                     {(transaction.costCenter ||
                        transaction.bankAccount ||
                        attachments.length > 0) && (
                        <div className="h-4 w-px bg-border" />
                     )}
                  </>
               )}

               {transaction.costCenter && (
                  <>
                     <Announcement>
                        <AnnouncementTag>Centro de Custo</AnnouncementTag>
                        <AnnouncementTitle>
                           {transaction.costCenter.name}
                        </AnnouncementTitle>
                     </Announcement>
                     {(transaction.bankAccount || attachments.length > 0) && (
                        <div className="h-4 w-px bg-border" />
                     )}
                  </>
               )}

               {transaction.bankAccount && (
                  <>
                     <Announcement>
                        <AnnouncementTag className="flex items-center gap-1.5">
                           <Landmark className="size-3.5" />
                           Conta
                        </AnnouncementTag>
                        <AnnouncementTitle>
                           {transaction.bankAccount.name}
                        </AnnouncementTitle>
                     </Announcement>
                     {attachments.length > 0 && (
                        <div className="h-4 w-px bg-border" />
                     )}
                  </>
               )}

               {attachments.length > 0 && (
                  <Announcement>
                     <AnnouncementTag className="flex items-center gap-1.5">
                        <Paperclip className="size-3.5" />
                        Anexos
                     </AnnouncementTag>
                     <AnnouncementTitle>
                        {attachments.length}{" "}
                        {attachments.length === 1 ? "arquivo" : "arquivos"}
                     </AnnouncementTitle>
                  </Announcement>
               )}
            </div>
         )}

         {isTransfer &&
            transferLog &&
            (() => {
               const amount = Number.parseFloat(transaction.amount);
               const isIncoming = amount > 0;
               const formattedAmount = formatDecimalCurrency(Math.abs(amount));
               const FromIcon = getAccountTypeIcon(
                  transferLog.fromBankAccount?.type,
               );
               const ToIcon = getAccountTypeIcon(
                  transferLog.toBankAccount?.type,
               );

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
                     <div className="flex flex-wrap items-center gap-2">
                        <Announcement>
                           <AnnouncementTag className="flex items-center gap-1.5">
                              <FromIcon className="size-3.5" />
                              {transferLog.fromBankAccount?.name}
                           </AnnouncementTag>
                           <AnnouncementTitle className="text-destructive">
                              -{formattedAmount}
                           </AnnouncementTitle>
                        </Announcement>

                        <ArrowRight className="size-4 text-muted-foreground" />

                        <Announcement>
                           <AnnouncementTag className="flex items-center gap-1.5">
                              <ToIcon className="size-3.5" />
                              {transferLog.toBankAccount?.name}
                           </AnnouncementTag>
                           <AnnouncementTitle className="text-green-600">
                              +{formattedAmount}
                           </AnnouncementTitle>
                        </Announcement>
                     </div>
                  </div>
               );
            })()}

         <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {isNotTransfer && (
               <Button
                  onClick={() =>
                     openSheet({
                        children: (
                           <MarkAsTransferForm transactions={[transaction]} />
                        ),
                     })
                  }
                  size="sm"
                  variant="outline"
               >
                  <ArrowLeftRight className="size-4" />
                  Marcar Transferência
               </Button>
            )}

            <Button
               onClick={() =>
                  openSheet({
                     children: <CategorySplitForm transaction={transaction} />,
                  })
               }
               size="sm"
               variant="outline"
            >
               <Split className="size-4" />
               Dividir Categorias
            </Button>

            <Button
               onClick={() =>
                  openSheet({
                     children: <CategorizeForm transactions={[transaction]} />,
                  })
               }
               size="sm"
               variant="outline"
            >
               <FolderOpen className="size-4" />
               Categorizar
            </Button>

            <Button
               onClick={() =>
                  openSheet({
                     children: <LinkFileForm transaction={transaction} />,
                  })
               }
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
               onClick={() =>
                  openSheet({
                     children: (
                        <ManageTransactionForm transaction={transaction} />
                     ),
                  })
               }
               size="sm"
               variant="outline"
            >
               <Pencil className="size-4" />
               Editar
            </Button>

            <Button onClick={handleDuplicate} size="sm" variant="outline">
               <Copy className="size-4" />
               {translate(
                  "dashboard.routes.transactions.list-section.actions.duplicate",
               )}
            </Button>

            <Button onClick={handleRefund} size="sm" variant="outline">
               <RotateCcw className="size-4" />
               {translate(
                  "dashboard.routes.transactions.list-section.actions.refund",
               )}
            </Button>

            <Button onClick={handleCreateRecurrence} size="sm" variant="outline">
               <CalendarPlus className="size-4" />
               {translate(
                  "dashboard.routes.transactions.list-section.actions.create-bill",
               )}
            </Button>

            <Button onClick={deleteTransaction} size="sm" variant="destructive">
               <Trash2 className="size-4" />
               Excluir
            </Button>
         </div>
      </div>
   );
}
