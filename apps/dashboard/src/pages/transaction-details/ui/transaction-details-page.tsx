import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import {
   ArrowLeftRight,
   CalendarPlus,
   Copy,
   FolderOpen,
   Home,
   Paperclip,
   Pencil,
   Receipt,
   RotateCcw,
   Split,
   Trash2,
} from "lucide-react";
import { Suspense } from "react";
// useState removed as unused
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { CategorizeForm } from "@/features/transaction/ui/categorize-form";
import { CategorySplitForm } from "@/features/transaction/ui/category-split-form";
import { LinkFileForm } from "@/features/transaction/ui/link-file-form";
import { ManageTransactionForm } from "@/features/transaction/ui/manage-transaction-form";
import { MarkAsTransferForm } from "@/features/transaction/ui/mark-as-transfer-form";
import { useDeleteTransaction } from "@/features/transaction/ui/use-delete-transaction";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { ManageBillForm } from "@/pages/bills/features/manage-bill-form";
import { TransactionCategorizationSection } from "./transaction-categories-section";
import { TransactionDetailsSection } from "./transaction-details-section";
import { TransactionStats } from "./transaction-stats";

function TransactionContent() {
   const params = useParams({ strict: false });
   const transactionId =
      (params as { transactionId?: string }).transactionId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/transactions",
      });
   };

   const { deleteTransaction } = useDeleteTransaction({
      onSuccess: handleDeleteSuccess,
      transaction: transaction ?? { description: "", id: "" },
   });

   const handleDuplicate = () => {
      if (!transaction) return;
      openSheet({
         children: (
            <ManageTransactionForm
               duplicateFrom={{
                  amount: Number(transaction.amount),
                  bankAccountId: transaction.bankAccountId || "",
                  categoryIds:
                     transaction.transactionCategories?.map(
                        (tc) => tc.category.id,
                     ) || [],
                  costCenterId: transaction.costCenterId || "",
                  description: transaction.description,
                  tagIds:
                     transaction.transactionTags?.map((tt) => tt.tag.id) || [],
                  type:
                     transaction.type === "transfer"
                        ? "expense"
                        : (transaction.type as "expense" | "income"),
               }}
            />
         ),
      });
   };

   const handleRefund = () => {
      if (!transaction) return;
      openSheet({
         children: (
            <ManageTransactionForm
               refundFrom={{
                  amount: Number(transaction.amount),
                  bankAccountId: transaction.bankAccountId || "",
                  categoryIds:
                     transaction.transactionCategories?.map(
                        (tc) => tc.category.id,
                     ) || [],
                  costCenterId: transaction.costCenterId || "",
                  originalDescription: transaction.description,
                  tagIds:
                     transaction.transactionTags?.map((tt) => tt.tag.id) || [],
                  type:
                     transaction.type === "transfer"
                        ? "expense"
                        : (transaction.type as "expense" | "income"),
               }}
            />
         ),
      });
   };

   const handleCreateBill = () => {
      if (!transaction) return;
      const primaryCategoryId =
         transaction.transactionCategories?.[0]?.category.id;
      openSheet({
         children: (
            <ManageBillForm
               fromTransaction={{
                  amount: Math.abs(Number(transaction.amount)),
                  bankAccountId: transaction.bankAccountId || undefined,
                  categoryId: primaryCategoryId,
                  description: transaction.description,
                  type:
                     transaction.type === "transfer"
                        ? "expense"
                        : (transaction.type as "expense" | "income"),
               }}
            />
         ),
      });
   };

   if (!transactionId) {
      return (
         <TransactionPageError
            error={new Error("Invalid transaction ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!transaction) {
      return null;
   }

   const isNotTransfer = transaction.type !== "transfer";

   return (
      <main className="space-y-4">
         <DefaultHeader
            description="Detalhes da sua transação"
            title={transaction.description}
         />

         <div className="flex flex-wrap items-center gap-2">
            {isNotTransfer && (
               <>
                  <Button
                     onClick={() =>
                        openSheet({
                           children: (
                              <MarkAsTransferForm
                                 transactions={[transaction]}
                              />
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
               </>
            )}
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
            <Button onClick={handleCreateBill} size="sm" variant="outline">
               <CalendarPlus className="size-4" />
               {translate(
                  "dashboard.routes.transactions.list-section.actions.create-bill",
               )}
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={deleteTransaction}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4" />
               Excluir
            </Button>
         </div>

         <TransactionStats transactionId={transactionId} />
         <TransactionCategorizationSection transactionId={transactionId} />
         <TransactionDetailsSection transactionId={transactionId} />
      </main>
   );
}

function TransactionPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-48" />
         </div>
         <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
         </div>
         <Skeleton className="h-48 w-full" />
      </main>
   );
}

function TransactionPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();

   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Receipt className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate(
                        "dashboard.routes.transactions.details.error.title",
                     )}
                  </EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/transactions",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        {translate(
                           "dashboard.routes.transactions.details.error.back",
                        )}
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate("common.actions.retry")}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function TransactionDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={TransactionPageError}>
         <Suspense fallback={<TransactionPageSkeleton />}>
            <TransactionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
