import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useDeleteBillDialog({
   bill,
   onSuccess,
}: {
   bill: Bill;
   onSuccess?: () => void;
}) {
   const { openAlertDialog, closeAlertDialog } = useAlertDialog();
   const trpc = useTRPC();

   const deleteBillMutation = useMutation(
      trpc.bills.delete.mutationOptions({
         onError: (error) => {
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.bills.features.delete-bill.error",
                  ),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.bills.features.delete-bill.success"),
            );
            closeAlertDialog();
            onSuccess?.();
         },
      }),
   );

   const handleDelete = () => {
      openAlertDialog({
         description: translate(
            "dashboard.routes.bills.features.delete-bill.description",
            { description: bill.description },
         ),

         onAction: async () => {
            await deleteBillMutation.mutateAsync({
               id: bill.id,
            });
         },
         title: translate("dashboard.routes.bills.features.delete-bill.title"),
      });
   };
   return {
      handleDeleteBill: handleDelete,
   };
}
