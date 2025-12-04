import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc, useTRPC } from "@/integrations/clients";

interface UseTransactionBulkActionsOptions {
   onSuccess?: () => void;
   bankAccountId?: string;
}

export function useTransactionBulkActions({
   onSuccess,
   bankAccountId,
}: UseTransactionBulkActionsOptions = {}) {
   const queryClient = useQueryClient();
   const trpcClient = useTRPC();

   const invalidateQueries = async () => {
      await queryClient.invalidateQueries({
         queryKey: trpcClient.transactions.getAllPaginated.queryKey(),
      });
      if (bankAccountId) {
         await queryClient.invalidateQueries({
            queryKey: trpcClient.bankAccounts.getTransactions.queryKey(),
         });
         await queryClient.invalidateQueries({
            queryKey: trpcClient.bankAccounts.getStats.queryKey(),
         });
      }
      await queryClient.invalidateQueries({
         queryKey: trpcClient.transactions.getStats.queryKey(),
      });
   };

   const deleteManyMutation = useMutation(
      trpc.transactions.deleteMany.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao excluir transações");
         },
         onSuccess: async (data) => {
            await invalidateQueries();
            toast.success(`${data.length} transações excluídas com sucesso`);
            onSuccess?.();
         },
      }),
   );

   const updateCategoryMutation = useMutation(
      trpc.transactions.updateCategory.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao atualizar categoria");
         },
         onSuccess: async (data) => {
            await invalidateQueries();
            toast.success(
               `Categoria atualizada para ${data.length} transações`,
            );
            onSuccess?.();
         },
      }),
   );

   const deleteSelected = (ids: string[]) => {
      if (ids.length === 0) return;
      deleteManyMutation.mutate({ ids });
   };

   const updateCategory = (ids: string[], categoryId: string) => {
      if (ids.length === 0) return;
      updateCategoryMutation.mutate({ categoryId, ids });
   };

   return {
      deleteSelected,
      isLoading:
         deleteManyMutation.isPending || updateCategoryMutation.isPending,
      updateCategory,
   };
}
