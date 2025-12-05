import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import type { Category } from "../ui/categories-page";

export function useDeleteCategory({
   category,
   onSuccess,
}: {
   category: Category;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteCategoryMutation = useMutation(
      trpc.categories.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete category");
         },
         onSuccess: () => {
            toast.success("Category deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const deleteCategory = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.categories.list-section.actions.delete-category",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description",
         ),
         onAction: async () => {
            await deleteCategoryMutation.mutateAsync({ id: category.id });
         },
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   return { deleteCategory, isDeleting: deleteCategoryMutation.isPending };
}
