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

type Transaction = {
   id: string;
   description: string;
};

type DeleteTransactionDialogProps = {
   transaction: Transaction;
   open: boolean;
   setOpen: (open: boolean) => void;
   onDeleted?: () => void;
};

export function DeleteTransactionDialog({
   transaction,
   open,
   setOpen,
   onDeleted,
}: DeleteTransactionDialogProps) {
   const trpc = useTRPC();

   const deleteTransactionMutation = useMutation(
      trpc.transactions.delete.mutationOptions({
         onSuccess: () => {
            setOpen(false);
            onDeleted?.();
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
      <AlertDialog onOpenChange={setOpen} open={open}>
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
