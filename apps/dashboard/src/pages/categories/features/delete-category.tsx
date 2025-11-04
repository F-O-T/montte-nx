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
import { Button } from "@packages/ui/components/button";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { trpc } from "@/integrations/clients";
import type { Category } from "../ui/categories-page";

interface DeleteCategoryProps {
   category: Category;
   asChild?: boolean;
}

export function DeleteCategory({
   category,
   asChild = false,
}: DeleteCategoryProps) {
   const queryClient = useQueryClient();

   const deleteCategoryMutation = useMutation(
      trpc.categories.delete.mutationOptions({
         onError: (error) => {
            console.error("Failed to delete category:", error);
         },
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
            {asChild ? (
               <DropdownMenuItem
                  className="text-destructive"
                  onSelect={(e) => e.preventDefault()}
               >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
               </DropdownMenuItem>
            ) : (
               <Button className="text-destructive" size="sm" variant="ghost">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
               </Button>
            )}
         </AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Delete Category</AlertDialogTitle>
               <AlertDialogDescription>
                  Are you sure you want to delete "{category.name}"? This action
                  cannot be undone and may affect transactions that use this
                  category.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteCategoryMutation.isPending}
                  onClick={handleDelete}
               >
                  {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
