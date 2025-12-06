import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface UseBankAccountBulkActionsOptions {
   onSuccess?: () => void;
}

export function useBankAccountBulkActions(
   options?: UseBankAccountBulkActionsOptions,
) {
   const trpc = useTRPC();

   const updateStatusMutation = useMutation(
      trpc.bankAccounts.updateStatus.mutationOptions({
         onSuccess: () => {
            options?.onSuccess?.();
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.bankAccounts.deleteMany.mutationOptions({
         onSuccess: () => {
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
