import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   ArrowLeftRight,
   CalendarPlus,
   Copy,
   FolderOpen,
   Paperclip,
   Pencil,
   RotateCcw,
   Split,
   Trash2,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CategorizeForm } from "@/features/transaction/ui/categorize-form";
import { CategorySplitForm } from "@/features/transaction/ui/category-split-form";
import { DuplicateTransactionSheet } from "@/features/transaction/ui/duplicate-transaction-sheet";
import { LinkFileForm } from "@/features/transaction/ui/link-file-form";
import { ManageTransactionForm } from "@/features/transaction/ui/manage-transaction-form";
import { MarkAsTransferForm } from "@/features/transaction/ui/mark-as-transfer-form";
import { RecurrenceTransactionSheet } from "@/features/transaction/ui/recurrence-transaction-sheet";
import { RefundTransactionSheet } from "@/features/transaction/ui/refund-transaction-sheet";
import { useDeleteTransaction } from "@/features/transaction/ui/use-delete-transaction";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

function ActionButtonsErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar ações</AlertDescription>
      </Alert>
   );
}

function ActionButtonsSkeleton() {
   return (
      <div className="flex flex-wrap items-center gap-2">
         <Skeleton className="h-8 w-40" />
         <Skeleton className="h-8 w-36" />
         <Skeleton className="h-8 w-28" />
         <Skeleton className="h-8 w-32" />
         <div className="h-4 w-px bg-border" />
         <Skeleton className="h-8 w-20" />
         <Skeleton className="h-8 w-24" />
         <Skeleton className="h-8 w-28" />
         <Skeleton className="h-8 w-32" />
         <div className="h-4 w-px bg-border" />
         <Skeleton className="h-8 w-20" />
      </div>
   );
}

function ActionButtonsContent({
   transactionId,
   onDeleteSuccess,
}: {
   transactionId: string;
   onDeleteSuccess: () => void;
}) {
   const trpc = useTRPC();
   const { openSheet } = useSheet();

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const { deleteTransaction } = useDeleteTransaction({
      onSuccess: onDeleteSuccess,
      transaction: transaction ?? { description: "", id: "" },
   });

   const handleDuplicate = () => {
      if (!transaction) return;
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
      if (!transaction) return;
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
      if (!transaction) return;
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

   if (!transaction) {
      return null;
   }

   const isNotTransfer = transaction.type !== "transfer";

   return (
      <div className="flex flex-wrap items-center gap-2">
         {/* Group 1: Classification Actions */}
         {isNotTransfer && (
            <>
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
               <Button
                  onClick={() =>
                     openSheet({
                        children: (
                           <CategorySplitForm transaction={transaction} />
                        ),
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
            </>
         )}
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

         {/* Separator */}
         <div className="h-4 w-px bg-border" />

         {/* Group 2: Management Actions */}
         <Button
            onClick={() =>
               openSheet({
                  children: <ManageTransactionForm transaction={transaction} />,
               })
            }
            size="sm"
            variant="outline"
         >
            <Pencil className="size-4" />
            {translate("dashboard.routes.transactions.features.edit.title")}
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

         {/* Separator */}
         <div className="h-4 w-px bg-border" />

         {/* Group 3: Destructive Action */}
         <Button onClick={deleteTransaction} size="sm" variant="destructive">
            <Trash2 className="size-4" />
            Excluir
         </Button>
      </div>
   );
}

export function TransactionActionButtons({
   transactionId,
   onDeleteSuccess,
}: {
   transactionId: string;
   onDeleteSuccess: () => void;
}) {
   return (
      <ErrorBoundary FallbackComponent={ActionButtonsErrorFallback}>
         <Suspense fallback={<ActionButtonsSkeleton />}>
            <ActionButtonsContent
               onDeleteSuccess={onDeleteSuccess}
               transactionId={transactionId}
            />
         </Suspense>
      </ErrorBoundary>
   );
}
