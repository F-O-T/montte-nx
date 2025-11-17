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
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { trpc } from "@/integrations/clients";
import type { Category } from "../ui/categories-page";

interface DeleteCategoryProps {
   category: Category;
}

export function DeleteCategory({ category }: DeleteCategoryProps) {
   const queryClient = useQueryClient();

   const deleteCategoryMutation = useMutation(
      trpc.categories.delete.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.categories.getAll.queryKey(),
            });
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
      <AlertDialog>
         <AlertDialogTrigger asChild>
            <DropdownMenuItem
               className="text-destructive flex items-center gap-2"
               onSelect={(e) => e.preventDefault()}
            >
               <Trash2 className="size-4" />
               {translate(
                  "dashboard.routes.categories.list-section.actions.delete-category",
               )}
            </DropdownMenuItem>
         </AlertDialogTrigger>
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
