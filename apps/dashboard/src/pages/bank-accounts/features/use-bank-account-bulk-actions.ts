import { translate } from "@packages/localization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface UseBankAccountBulkActionsOptions {
   onSuccess?: () => void;
}

export function useBankAccountBulkActions(
   options?: UseBankAccountBulkActionsOptions,
) {
   const queryClient = useQueryClient();

   const updateStatusMutation = useMutation(
      trpc.bankAccounts.updateStatus.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["bankAccounts"],
            });
            options?.onSuccess?.();
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.bankAccounts.deleteMany.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["bankAccounts"],
            });
            options?.onSuccess?.();
         },
      }),
   );

   const markAsActive = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await updateStatusMutation.mutateAsync({
            ids,
            status: "active",
         });
         toast.success(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.activated-success",
               { count: ids.length },
            ),
         );
      } catch {
         toast.error(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.activated-error",
            ),
         );
      }
   };

   const markAsInactive = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await updateStatusMutation.mutateAsync({
            ids,
            status: "inactive",
         });
         toast.success(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.inactivated-success",
               { count: ids.length },
            ),
         );
      } catch {
         toast.error(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.inactivated-error",
            ),
         );
      }
   };

   const deleteSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await deleteMutation.mutateAsync({ ids });
         toast.success(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.deleted-success",
               { count: ids.length },
            ),
         );
      } catch {
         toast.error(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.deleted-error",
            ),
         );
      }
   };

   return {
      deleteSelected,
      isLoading: updateStatusMutation.isPending || deleteMutation.isPending,
      markAsActive,
      markAsInactive,
   };
}
