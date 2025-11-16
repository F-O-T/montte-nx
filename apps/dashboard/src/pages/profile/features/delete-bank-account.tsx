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
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface DeleteBankAccountProps {
   bankAccount: BankAccount;
   asChild?: boolean;
}

export function DeleteBankAccount({
   bankAccount,
   asChild = false,
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
      <AlertDialog>
         <AlertDialogTrigger asChild>
            {asChild ? (
               <DropdownMenuItem
                  className="text-destructive"
                  onSelect={(e) => e.preventDefault()}
               >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {translate(
                     "dashboard.routes.profile.bank-accounts.actions.delete",
                  )}
               </DropdownMenuItem>
            ) : (
               <Button className="text-destructive" size="sm" variant="ghost">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {translate(
                     "dashboard.routes.profile.bank-accounts.actions.delete",
                  )}
               </Button>
            )}
         </AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {translate(
                     "dashboard.routes.profile.bank-accounts.delete.title",
                  )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate(
                     "dashboard.routes.profile.bank-accounts.delete.description",
                     { name: bankAccount.name },
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate(
                     "dashboard.routes.profile.bank-accounts.delete.cancel",
                  )}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteBankAccountMutation.isPending}
                  onClick={handleDelete}
               >
                  {deleteBankAccountMutation.isPending
                     ? translate(
                          "dashboard.routes.profile.bank-accounts.delete.deleting",
                       )
                     : translate(
                          "dashboard.routes.profile.bank-accounts.delete.confirm",
                       )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
