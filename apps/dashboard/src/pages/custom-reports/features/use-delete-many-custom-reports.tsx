import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

export function useDeleteManyCustomReports({
   onSuccess,
}: {
   onSuccess?: () => void;
} = {}) {
   const trpc = useTRPC();

   const deleteManyMutation = useMutation(
      trpc.customReports.deleteMany.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao excluir relatórios");
         },
         onSuccess: (result) => {
            toast.success(
               `${result.count} relatório(s) excluído(s) com sucesso`,
            );
            onSuccess?.();
         },
      }),
   );

   const deleteMany = async (ids: string[]) => {
      await deleteManyMutation.mutateAsync({ ids });
   };

   return { deleteMany, isDeleting: deleteManyMutation.isPending };
}
