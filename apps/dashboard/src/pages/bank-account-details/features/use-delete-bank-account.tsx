import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useDeleteBankAccount({
   bankAccount,
   onSuccess,
}: {
   bankAccount: BankAccount;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteBankAccountMutation = useMutation(
      trpc.bankAccounts.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete bank account");
         },
         onSuccess: () => {
            toast.success("Bank account deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const deleteBankAccount = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.profile.bank-accounts.actions.delete",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description",
         ),
         onAction: async () => {
            await deleteBankAccountMutation.mutateAsync({ id: bankAccount.id });
         },
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   return {
      deleteBankAccount,
      isDeleting: deleteBankAccountMutation.isPending,
   };
}
