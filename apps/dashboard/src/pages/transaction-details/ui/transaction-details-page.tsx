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
   FolderOpen,
   Home,
   Paperclip,
   Pencil,
   Receipt,
   Split,
   Trash2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { CategorizeSheet } from "@/features/transaction/ui/categorize-sheet";
import { CategorySplitSheet } from "@/features/transaction/ui/category-split-sheet";
import { LinkFileSheet } from "@/features/transaction/ui/link-file-sheet";
import { ManageTransactionSheet } from "@/features/transaction/ui/manage-transaction-sheet";
import { MarkAsTransferSheet } from "@/features/transaction/ui/mark-as-transfer-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { DeleteTransactionDialog } from "../features/delete-transaction-dialog";
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

   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isTransferOpen, setIsTransferOpen] = useState(false);
   const [isSplitOpen, setIsSplitOpen] = useState(false);
   const [isCategorizeOpen, setIsCategorizeOpen] = useState(false);
   const [isLinkFileOpen, setIsLinkFileOpen] = useState(false);

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

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

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/transactions",
      });
   };

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
            <Button
               onClick={() => setIsEditOpen(true)}
               size="sm"
               variant="outline"
            >
               <Pencil className="size-4" />
               {translate("dashboard.routes.transactions.features.edit.title")}
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => setIsDeleteOpen(true)}
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

         <ManageTransactionSheet
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            transaction={transaction}
         />
         <DeleteTransactionDialog
            onDeleted={handleDeleteSuccess}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
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
