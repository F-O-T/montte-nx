import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface UseCounterpartyBulkActionsOptions {
   onSuccess?: () => void;
}

export function useCounterpartyBulkActions(
   options?: UseCounterpartyBulkActionsOptions,
) {
   const trpc = useTRPC();

   const deleteMutation = useMutation(
      trpc.counterparties.deleteMany.mutationOptions({
         onError: () => {
            toast.error(
               translate(
                  "dashboard.routes.counterparties.bulk-actions.deleted-error",
               ),
            );
         },
         onSuccess: () => {
            toast.success(
               translate(
                  "dashboard.routes.counterparties.bulk-actions.deleted-success",
               ),
            );
            options?.onSuccess?.();
         },
      }),
   );

   const deleteSelected = async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids });
   };

   return {
      deleteSelected,
      isLoading: deleteMutation.isPending,
   };
}
