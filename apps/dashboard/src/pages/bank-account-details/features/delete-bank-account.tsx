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
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.profile.bank-accounts.delete.error",
                  ),
            );
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getAll.queryKey(),
            });
            toast.success(
               translate(
                  "dashboard.routes.profile.bank-accounts.delete.success",
               ),
            );
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
