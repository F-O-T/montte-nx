import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import type { Budget } from "../ui/budgets-page";

export function useToggleBudgetStatus({
   budget,
   onSuccess,
}: {
   budget: Budget;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const updateMutation = useMutation(
      trpc.budgets.update.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.budgets.notifications.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               budget.isActive
                  ? translate(
                       "dashboard.routes.budgets.notifications.deactivated",
                    )
                  : translate(
                       "dashboard.routes.budgets.notifications.activated",
                    ),
            );
            onSuccess?.();
         },
      }),
   );

   const toggleStatus = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.budgets.status-toggle.confirm",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: budget.isActive
            ? translate(
                 "dashboard.routes.budgets.status-toggle.deactivate-description",
              )
            : translate(
                 "dashboard.routes.budgets.status-toggle.activate-description",
              ),
         onAction: async () => {
            await updateMutation.mutateAsync({
               data: { isActive: !budget.isActive },
               id: budget.id,
            });
         },
         title: budget.isActive
            ? translate(
                 "dashboard.routes.budgets.status-toggle.deactivate-title",
              )
            : translate(
                 "dashboard.routes.budgets.status-toggle.activate-title",
              ),
      });
   };

   return { isUpdating: updateMutation.isPending, toggleStatus };
}
