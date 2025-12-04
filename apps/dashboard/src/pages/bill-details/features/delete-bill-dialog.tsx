import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
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
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface DeleteBillDialogProps {
   bill: BillWithRelations;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess?: () => void;
}

export function DeleteBillDialog({
   bill,
   open,
   onOpenChange,
   onSuccess,
}: DeleteBillDialogProps) {
   const trpc = useTRPC();

   const deleteBillMutation = useMutation(
      trpc.bills.delete.mutationOptions({
         onError: (error) => {
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.bills.features.delete-bill.error",
                  ),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.bills.features.delete-bill.success"),
            );
            onOpenChange(false);
            onSuccess?.();
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteBillMutation.mutateAsync({
            id: bill.id,
         });
      } catch (error) {
         console.error("Failed to delete bill:", error);
      }
   };

   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {translate(
                     "dashboard.routes.bills.features.delete-bill.title",
                  )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate(
                     "dashboard.routes.bills.features.delete-bill.description",
                     {
                        description: bill.description,
                     },
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate(
                     "dashboard.routes.bills.features.delete-bill.cancel",
                  )}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteBillMutation.isPending}
                  onClick={(e) => {
                     e.preventDefault();
                     handleDelete();
                  }}
               >
                  {deleteBillMutation.isPending
                     ? translate(
                          "dashboard.routes.bills.features.delete-bill.deleting",
                       )
                     : translate(
                          "dashboard.routes.bills.features.delete-bill.confirm",
                       )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
