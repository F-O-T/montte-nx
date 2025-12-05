import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

type Budget = {
   id: string;
   rollover: boolean;
};

export function useToggleRollover({
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
            onSuccess?.();
         },
      }),
   );

   const toggleRollover = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.budgets.rollover-toggle.confirm",
         ),
         cancelLabel: translate(
            "dashboard.routes.budgets.rollover-toggle.cancel",
         ),
         description: budget.rollover
            ? translate(
                 "dashboard.routes.budgets.rollover-toggle.disable-description",
              )
            : translate(
                 "dashboard.routes.budgets.rollover-toggle.enable-description",
              ),
         onAction: async () => {
            await updateMutation.mutateAsync({
               data: { rollover: !budget.rollover },
               id: budget.id,
            });
         },
         title: budget.rollover
            ? translate(
                 "dashboard.routes.budgets.rollover-toggle.disable-title",
              )
            : translate(
                 "dashboard.routes.budgets.rollover-toggle.enable-title",
              ),
      });
   };

   return { isUpdating: updateMutation.isPending, toggleRollover };
}
