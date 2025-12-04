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
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTRPC } from "@/integrations/clients";
import type { Category } from "../ui/categories-page";

interface DeleteCategoryProps {
   category: Category;
   open?: boolean;
   setOpen?: (open: boolean) => void;
   onSuccess?: () => void;
   children?: React.ReactNode;
}

export function DeleteCategory({
   category,
   open,
   setOpen,
   onSuccess,
   children,
}: DeleteCategoryProps) {
   const trpc = useTRPC();
   const isControlled = open !== undefined && setOpen !== undefined;

   const deleteCategoryMutation = useMutation(
      trpc.categories.delete.mutationOptions({
         onSuccess: () => {
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

   const dialogContent = (
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
   );

   if (isControlled) {
      return (
         <AlertDialog onOpenChange={setOpen} open={open}>
            {dialogContent}
         </AlertDialog>
      );
   }

   return (
      <AlertDialog>
         <AlertDialogTrigger asChild>
            {children || (
               <DropdownMenuItem
                  className="text-destructive flex items-center gap-2"
                  onSelect={(e) => e.preventDefault()}
               >
                  <Trash2 className="size-4" />
                  {translate(
                     "dashboard.routes.categories.list-section.actions.delete-category",
                  )}
               </DropdownMenuItem>
            )}
         </AlertDialogTrigger>
         {dialogContent}
      </AlertDialog>
   );
}
