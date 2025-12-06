import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface UseCategoryBulkActionsOptions {
   onSuccess?: () => void;
}

export function useCategoryBulkActions(
   options?: UseCategoryBulkActionsOptions,
) {
   const trpc = useTRPC();

   const deleteMutation = useMutation(
      trpc.categories.deleteMany.mutationOptions({
         onSuccess: () => {
            options?.onSuccess?.();
         },
      }),
   );

   const deleteSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await deleteMutation.mutateAsync({ ids });
         toast.success(
            translate(
               "dashboard.routes.categories.bulk-actions.deleted-success",
               { count: ids.length },
            ),
         );
      } catch {
         toast.error(
            translate("dashboard.routes.categories.bulk-actions.deleted-error"),
         );
      }
   };

   return {
      deleteSelected,
      isLoading: deleteMutation.isPending,
   };
}
