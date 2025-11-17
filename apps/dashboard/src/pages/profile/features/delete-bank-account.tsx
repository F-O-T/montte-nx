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
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface DeleteBankAccountProps {
   bankAccount: BankAccount;
}

export function DeleteBankAccount({ bankAccount }: DeleteBankAccountProps) {
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
      <AlertDialog>
         <AlertDialogTrigger asChild>
            <DropdownMenuItem
               className="text-destructive flex items-center gap-2"
               onSelect={(e) => e.preventDefault()}
            >
               <Trash2 className="size-4" />
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.delete",
               )}
            </DropdownMenuItem>
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
