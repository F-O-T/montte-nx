import type { Tag } from "@packages/database/repositories/tag-repository";
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

interface DeleteTagDialogProps {
   tag: Tag;
   onSuccess?: () => void;
   open: boolean;
   setOpen: (open: boolean) => void;
}

export function DeleteTagDialog({
   tag,
   onSuccess,
   open,
   setOpen,
}: DeleteTagDialogProps) {
   const queryClient = useQueryClient();

   const deleteTagMutation = useMutation(
      trpc.tags.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete tag");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.tags.getAll.queryKey(),
            });
            toast.success("Tag deleted successfully");
            onSuccess?.();
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
