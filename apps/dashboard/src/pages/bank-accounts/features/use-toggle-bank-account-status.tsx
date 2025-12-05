import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useToggleBankAccountStatus({
   bankAccount,
   onSuccess,
}: {
   bankAccount: BankAccount;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const updateStatusMutation = useMutation(
      trpc.bankAccounts.update.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.bank-accounts.notifications.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               bankAccount.status === "active"
                  ? translate(
                       "dashboard.routes.bank-accounts.notifications.deactivated",
                    )
                  : translate(
                       "dashboard.routes.bank-accounts.notifications.activated",
                    ),
            );
            onSuccess?.();
         },
      }),
   );

   const toggleStatus = () => {
      const isActive = bankAccount.status === "active";
      const newStatus = isActive ? "inactive" : "active";

      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.bank-accounts.status-toggle.confirm",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: isActive
            ? translate(
                 "dashboard.routes.bank-accounts.status-toggle.deactivate-description",
              )
            : translate(
                 "dashboard.routes.bank-accounts.status-toggle.activate-description",
              ),
         onAction: async () => {
            await updateStatusMutation.mutateAsync({
               data: { status: newStatus },
               id: bankAccount.id,
            });
         },
         title: isActive
            ? translate(
                 "dashboard.routes.bank-accounts.status-toggle.deactivate-title",
              )
            : translate(
                 "dashboard.routes.bank-accounts.status-toggle.activate-title",
              ),
         variant: "default",
      });
   };

   return {
      isUpdating: updateStatusMutation.isPending,
      toggleStatus,
   };
}
