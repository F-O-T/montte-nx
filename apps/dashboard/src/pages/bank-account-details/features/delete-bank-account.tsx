import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface DeleteBankAccountProps {
   bankAccount: BankAccount;
   open: boolean;
   setOpen: (open: boolean) => void;
}

export function DeleteBankAccount({
   bankAccount,
   open,
   setOpen,
}: DeleteBankAccountProps) {
   const queryClient = useQueryClient();

   const deleteBankAccountMutation = useMutation(
      trpc.bankAccounts.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete bank account");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getAll.queryKey(),
            });
            toast.success("Bank account deleted successfully");
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteBankAccountMutation.mutateAsync({ id: bankAccount.id });
      } catch (error) {
         console.error("Failed to delete bank account:", error);
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
                  className="bg-destructive text-destructive-foreground "
                  disabled={deleteBankAccountMutation.isPending}
                  onClick={handleDelete}
               >
                  {translate(
                     "dashboard.routes.profile.bank-accounts.actions.delete",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
