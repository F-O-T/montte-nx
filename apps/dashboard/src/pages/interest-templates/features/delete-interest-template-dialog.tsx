import type { InterestTemplate } from "@packages/database/repositories/interest-template-repository";
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
import { toast } from "@packages/ui/components/sonner";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";

type DeleteInterestTemplateDialogProps = {
   template: InterestTemplate;
   open: boolean;
   setOpen: (open: boolean) => void;
   onSuccess?: () => void;
};

export function DeleteInterestTemplateDialog({
   template,
   open,
   setOpen,
   onSuccess,
}: DeleteInterestTemplateDialogProps) {
   const trpc = useTRPC();

   const deleteTemplateMutation = useMutation(
      trpc.interestTemplates.delete.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.interest-templates.delete.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.interest-templates.delete.success"),
            );
            setOpen(false);
            onSuccess?.();
         },
      }),
   );

   return (
      <AlertDialog onOpenChange={setOpen} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {translate(
                     "dashboard.routes.interest-templates.delete.confirm-title",
                  )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate(
                     "dashboard.routes.interest-templates.delete.confirm-description",
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={deleteTemplateMutation.isPending}>
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteTemplateMutation.isPending}
                  onClick={() => {
                     deleteTemplateMutation.mutate({ id: template.id });
                  }}
               >
                  {translate(
                     "dashboard.routes.interest-templates.bulk-actions.delete",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
