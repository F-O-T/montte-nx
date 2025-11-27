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
import type { Tag } from "../ui/tags-page";

interface DeleteTagProps {
   tag: Tag;
   children: React.ReactNode;
}

export function DeleteTag({ tag, children: _children }: DeleteTagProps) {
   const queryClient = useQueryClient();

   const deleteTagMutation = useMutation(
      trpc.tags.delete.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.tags.getAll.queryKey(),
            });
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteTagMutation.mutateAsync({ id: tag.id });
      } catch (error) {
         console.error("Failed to delete tag:", error);
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
                  "dashboard.routes.tags.list-section.actions.delete-tag",
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
                  disabled={deleteTagMutation.isPending}
                  onClick={handleDelete}
               >
                  {translate(
                     "dashboard.routes.tags.list-section.actions.delete-tag",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
