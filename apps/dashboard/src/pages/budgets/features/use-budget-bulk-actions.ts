import { translate } from "@packages/localization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface UseBudgetBulkActionsOptions {
   onSuccess?: () => void;
}

export function useBudgetBulkActions(options?: UseBudgetBulkActionsOptions) {
   const queryClient = useQueryClient();

   const activateMutation = useMutation(
      trpc.budgets.bulkActivate.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["budgets"],
            });
            options?.onSuccess?.();
         },
      }),
   );

   const deactivateMutation = useMutation(
      trpc.budgets.bulkDeactivate.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["budgets"],
            });
            options?.onSuccess?.();
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.budgets.bulkDelete.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["budgets"],
            });
            options?.onSuccess?.();
         },
      }),
   );

   const markAsActive = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await activateMutation.mutateAsync({ ids });
         toast.success(
            translate(
               "dashboard.routes.budgets.bulk-actions.activated-success",
               {
                  count: ids.length,
               },
            ),
         );
      } catch {
         toast.error(
            translate("dashboard.routes.budgets.bulk-actions.activated-error"),
         );
      }
   };

   const markAsInactive = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await deactivateMutation.mutateAsync({ ids });
         toast.success(
            translate(
               "dashboard.routes.budgets.bulk-actions.deactivated-success",
               { count: ids.length },
            ),
         );
      } catch {
         toast.error(
            translate(
               "dashboard.routes.budgets.bulk-actions.deactivated-error",
            ),
         );
      }
   };

   const deleteSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await deleteMutation.mutateAsync({ ids });
         toast.success(
            translate("dashboard.routes.budgets.bulk-actions.deleted-success", {
               count: ids.length,
            }),
         );
      } catch {
         toast.error(
            translate("dashboard.routes.budgets.bulk-actions.deleted-error"),
         );
      }
   };

   return {
      deleteSelected,
      isLoading:
         activateMutation.isPending ||
         deactivateMutation.isPending ||
         deleteMutation.isPending,
      markAsActive,
      markAsInactive,
   };
}
