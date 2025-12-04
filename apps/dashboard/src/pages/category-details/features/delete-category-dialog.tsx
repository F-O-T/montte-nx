import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";
import type { Category } from "../../categories/ui/categories-page";

interface DeleteCategoryDialogProps {
   category: Category;
   onSuccess?: () => void;
   open: boolean;
   setOpen: (open: boolean) => void;
}

export function DeleteCategoryDialog({
   category,
   onSuccess,
   open,
   setOpen,
}: DeleteCategoryDialogProps) {
   const queryClient = useQueryClient();

   const deleteCategoryMutation = useMutation(
      trpc.categories.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete category");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.categories.getAll.queryKey(),
            });
            toast.success("Category deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteCategoryMutation.mutateAsync({ id: category.id });
      } catch (error) {
         console.error("Failed to delete category:", error);
      }
   };

   return (
      <AlertDialog onOpenChange={setOpen} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {translate("common.headers.delete-confirmation.title")}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate("common.headers.delete-confirmation.description")}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  disabled={deleteCategoryMutation.isPending}
                  onClick={handleDelete}
               >
                  {translate(
                     "dashboard.routes.categories.list-section.actions.delete-category",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
