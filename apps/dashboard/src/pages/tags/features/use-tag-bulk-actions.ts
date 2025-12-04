import { translate } from "@packages/localization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface UseTagBulkActionsOptions {
   onSuccess?: () => void;
}

export function useTagBulkActions(options?: UseTagBulkActionsOptions) {
   const queryClient = useQueryClient();

   const deleteMutation = useMutation(
      trpc.tags.deleteMany.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["tags"],
            });
            options?.onSuccess?.();
         },
      }),
   );

   const deleteSelected = async (ids: string[]) => {
      if (ids.length === 0) return;

      try {
         await deleteMutation.mutateAsync({ ids });
         toast.success(
            translate("dashboard.routes.tags.bulk-actions.deleted-success", {
               count: ids.length,
            }),
         );
      } catch {
         toast.error(
            translate("dashboard.routes.tags.bulk-actions.deleted-error"),
         );
      }
   };

   return {
      deleteSelected,
      isLoading: deleteMutation.isPending,
   };
}
