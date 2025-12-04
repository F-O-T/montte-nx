import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import type { Transaction } from "./transaction-list";

export interface DeleteTransactionProps {
   transaction: Transaction;
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function DeleteTransaction({
   transaction,
   onOpen,
   onOpenChange,
}: DeleteTransactionProps) {
   const trpc = useTRPC();

   const deleteTransactionMutation = useMutation(
      trpc.transactions.delete.mutationOptions({
         onSuccess: () => {
            onOpenChange?.(false);
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteTransactionMutation.mutateAsync({ id: transaction.id });
      } catch (error) {
         console.error("Failed to delete transaction:", error);
      }
   };

   return (
      <AlertDialog onOpenChange={onOpenChange} open={onOpen}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {translate("common.headers.delete-confirmation.title")}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate("common.headers.delete-confirmation.description")}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  disabled={deleteTransactionMutation.isPending}
                  onClick={handleDelete}
               >
                  {translate(
                     "dashboard.routes.transactions.list-section.actions.delete",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
