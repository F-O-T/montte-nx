import { translate } from "@packages/localization";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface UseBankAccountBulkActionsOptions {
   onSuccess?: () => void;
}

export function useBankAccountBulkActions(
   options?: UseBankAccountBulkActionsOptions,
) {
   const trpc = useTRPC();

   const { data: allBankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

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

   const canDelete = allBankAccounts.length >= 2;

   const deleteSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      // Check if trying to delete all bank accounts
      if (allBankAccounts.length <= ids.length) {
         toast.error(
            "Cannot delete all bank accounts. You must have at least one bank account.",
         );
         return;
      }

      try {
         await deleteMutation.mutateAsync({ ids });
         toast.success(
            translate(
               "dashboard.routes.bank-accounts.bulk-actions.deleted-success",
               { count: ids.length },
            ),
         );
      } catch (error) {
         toast.error(
            error instanceof Error
               ? error.message
               : translate(
                    "dashboard.routes.bank-accounts.bulk-actions.deleted-error",
                 ),
         );
      }
   };

   return {
      allBankAccounts,
      canDelete,
      deleteSelected,
      isLoading: updateStatusMutation.isPending || deleteMutation.isPending,
      markAsActive,
      markAsInactive,
   };
}
