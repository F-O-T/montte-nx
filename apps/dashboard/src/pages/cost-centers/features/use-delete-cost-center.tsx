import type { CostCenter } from "@packages/database/repositories/cost-center-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useDeleteCostCenter({
   costCenter,
   onSuccess,
}: {
   costCenter: CostCenter;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteCostCenterMutation = useMutation(
      trpc.costCenters.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete cost center");
         },
         onSuccess: () => {
            toast.success("Cost center deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const deleteCostCenter = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.cost-centers.list-section.actions.delete-cost-center",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description",
         ),
         onAction: async () => {
            await deleteCostCenterMutation.mutateAsync({ id: costCenter.id });
         },
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   return { deleteCostCenter, isDeleting: deleteCostCenterMutation.isPending };
}
