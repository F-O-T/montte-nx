import type { Counterparty } from "@packages/database/repositories/counterparty-repository";
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

type DeleteCounterpartyDialogProps = {
   counterparty: Counterparty;
   open: boolean;
   setOpen: (open: boolean) => void;
   onSuccess?: () => void;
};

export function DeleteCounterpartyDialog({
   counterparty,
   open,
   setOpen,
   onSuccess,
}: DeleteCounterpartyDialogProps) {
   const trpc = useTRPC();

   const deleteCounterpartyMutation = useMutation(
      trpc.counterparties.delete.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.counterparties.delete.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.counterparties.delete.success"),
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
                     "dashboard.routes.counterparties.delete.confirm-title",
                  )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate(
                     "dashboard.routes.counterparties.delete.confirm-description",
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel
                  disabled={deleteCounterpartyMutation.isPending}
               >
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteCounterpartyMutation.isPending}
                  onClick={() => {
                     deleteCounterpartyMutation.mutate({ id: counterparty.id });
                  }}
               >
                  {translate(
                     "dashboard.routes.counterparties.bulk-actions.delete",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
