import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import type { Budget } from "../ui/budgets-page";

export function useDeleteBudget({
   budget,
   onSuccess,
}: {
   budget: Budget;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteBudgetMutation = useMutation(
      trpc.budgets.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete budget");
         },
         onSuccess: () => {
            toast.success("Budget deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const deleteBudget = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.budgets.features.delete-budget.confirm",
         ),
         cancelLabel: translate(
            "dashboard.routes.budgets.features.delete-budget.cancel",
         ),
         description: translate(
            "dashboard.routes.budgets.features.delete-budget.description",
         ),
         onAction: async () => {
            await deleteBudgetMutation.mutateAsync({ id: budget.id });
         },
         title: translate(
            "dashboard.routes.budgets.features.delete-budget.title",
         ),
         variant: "destructive",
      });
   };

   return { deleteBudget, isDeleting: deleteBudgetMutation.isPending };
}
