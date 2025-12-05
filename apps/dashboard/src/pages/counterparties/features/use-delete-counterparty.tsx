import type { Counterparty } from "@packages/database/repositories/counterparty-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useDeleteCounterparty({
   counterparty,
   onSuccess,
}: {
   counterparty: Counterparty;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteCounterpartyMutation = useMutation(
      trpc.counterparties.delete.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.counterparties.delete.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.counterparties.delete.success"),
            );
            onSuccess?.();
         },
      }),
   );

   const deleteCounterparty = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.counterparties.bulk-actions.delete",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "dashboard.routes.counterparties.delete.confirm-description",
         ),
         onAction: async () => {
            await deleteCounterpartyMutation.mutateAsync({
               id: counterparty.id,
            });
         },
         title: translate(
            "dashboard.routes.counterparties.delete.confirm-title",
         ),
         variant: "destructive",
      });
   };

   return {
      deleteCounterparty,
      isDeleting: deleteCounterpartyMutation.isPending,
   };
}
