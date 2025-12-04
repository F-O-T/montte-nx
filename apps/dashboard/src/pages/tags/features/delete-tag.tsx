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
import type { Tag } from "../ui/tags-page";

interface DeleteTagProps {
   tag: Tag;
   open?: boolean;
   setOpen?: (open: boolean) => void;
   onSuccess?: () => void;
   children?: React.ReactNode;
}

export function DeleteTag({
   tag,
   open,
   setOpen,
   onSuccess,
   children,
}: DeleteTagProps) {
   const trpc = useTRPC();
   const isControlled = open !== undefined && setOpen !== undefined;

   const deleteTagMutation = useMutation(
      trpc.tags.delete.mutationOptions({
         onSuccess: () => {
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
               disabled={deleteTagMutation.isPending}
               onClick={handleDelete}
            >
               {translate(
                  "dashboard.routes.tags.list-section.actions.delete-tag",
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
                     "dashboard.routes.tags.list-section.actions.delete-tag",
                  )}
               </DropdownMenuItem>
            )}
         </AlertDialogTrigger>
         {dialogContent}
      </AlertDialog>
   );
}
