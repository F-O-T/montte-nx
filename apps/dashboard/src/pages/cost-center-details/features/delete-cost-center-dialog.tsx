import type { CostCenter } from "@packages/database/repositories/cost-center-repository";
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

interface DeleteCostCenterDialogProps {
   costCenter: CostCenter;
   onSuccess?: () => void;
   open: boolean;
   setOpen: (open: boolean) => void;
}

export function DeleteCostCenterDialog({
   costCenter,
   onSuccess,
   open,
   setOpen,
}: DeleteCostCenterDialogProps) {
   const trpc = useTRPC();

   const deleteCostCenterMutation = useMutation(
      trpc.costCenters.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete cost center");
         },
         onSuccess: () => {
            toast.success("Cost center deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteCostCenterMutation.mutateAsync({ id: costCenter.id });
      } catch (error) {
         console.error("Failed to delete cost center:", error);
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
                  disabled={deleteCostCenterMutation.isPending}
                  onClick={handleDelete}
               >
                  {translate(
                     "dashboard.routes.cost-centers.list-section.actions.delete-cost-center",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
