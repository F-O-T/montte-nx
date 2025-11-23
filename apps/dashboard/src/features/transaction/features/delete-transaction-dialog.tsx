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
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { trpc } from "@/integrations/clients";
import type { Transaction } from "../ui/transaction-item";

interface DeleteTransactionProps {
   transaction: Transaction;
   asChild?: boolean;
}

export function DeleteTransaction({
   transaction,
   asChild,
}: DeleteTransactionProps) {
   const queryClient = useQueryClient();

   const deleteTransactionMutation = useMutation(
      trpc.transactions.delete.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAllPaginated.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getTransactions.queryKey(),
            });
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
      <AlertDialog>
         <AlertDialogTrigger asChild={asChild}>
            <Button
               className="text-destructive hover:text-destructive"
               size="sm"
               variant="ghost"
            >
               <Trash2 className="h-4 w-4" />
               {translate(
                  "dashboard.routes.transactions.list-section.actions.delete",
               )}
            </Button>
         </AlertDialogTrigger>
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
