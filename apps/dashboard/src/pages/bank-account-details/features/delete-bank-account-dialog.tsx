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
import { useRouter } from "@tanstack/react-router";

interface DeleteBankAccountDialogProps {
   bankAccountId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function DeleteBankAccountDialog({
   bankAccountId,
   open,
   onOpenChange,
}: DeleteBankAccountDialogProps) {
   const queryClient = useQueryClient();
   const router = useRouter();

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
            onOpenChange(false);
            // Navigate back to profile or dashboard
            router.navigate({ to: "/profile" });
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteBankAccountMutation.mutateAsync({ id: bankAccountId });
      } catch (error) {
         console.error("Failed to delete bank account:", error);
      }
   };

   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
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
                  onClick={(e) => {
                     e.preventDefault();
                     handleDelete();
                  }}
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
