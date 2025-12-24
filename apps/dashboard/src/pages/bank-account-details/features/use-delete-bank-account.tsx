import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { translate } from "@packages/localization";
import { useMutation, useQuery } from "@tanstack/react-query";
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

   const { data: allBankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

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

   const canDelete = allBankAccounts.length >= 2;

   const deleteBankAccount = () => {
      if (allBankAccounts.length < 2) {
         toast.error(
            "Cannot delete the last bank account. You must have at least one bank account.",
         );
         return;
      }

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
      canDelete,
      deleteBankAccount,
      isDeleting: deleteBankAccountMutation.isPending,
   };
}
