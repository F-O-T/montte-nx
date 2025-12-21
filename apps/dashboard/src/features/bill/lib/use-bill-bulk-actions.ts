import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface UseBillBulkActionsOptions {
   onSuccess?: () => void;
}

export function useBillBulkActions(options?: UseBillBulkActionsOptions) {
   const trpc = useTRPC();

   const completeMutation = useMutation(
      trpc.bills.completeMany.mutationOptions({
         onSuccess: () => {
            options?.onSuccess?.();
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.bills.deleteMany.mutationOptions({
         onSuccess: () => {
            options?.onSuccess?.();
         },
      }),
   );

   const completeSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         const completionDate = new Date().toISOString();
         await completeMutation.mutateAsync({ completionDate, ids });
         toast.success(
            translate("dashboard.routes.bills.bulk-actions.completed-success", {
               count: ids.length,
            }),
         );
      } catch {
         toast.error(
            translate("dashboard.routes.bills.bulk-actions.completed-error"),
         );
      }
   };

   const deleteSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await deleteMutation.mutateAsync({ ids });
         toast.success(
            translate("dashboard.routes.bills.bulk-actions.deleted-success", {
               count: ids.length,
            }),
         );
      } catch {
         toast.error(
            translate("dashboard.routes.bills.bulk-actions.deleted-error"),
         );
      }
   };

   return {
      completeSelected,
      deleteSelected,
      isLoading: completeMutation.isPending || deleteMutation.isPending,
   };
}
