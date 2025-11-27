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
import type { CostCenter } from "../ui/cost-centers-page";

interface DeleteCostCenterProps {
   costCenter: CostCenter;
   children: React.ReactNode;
}

export function DeleteCostCenter({
   costCenter,
   children: _children,
}: DeleteCostCenterProps) {
   const queryClient = useQueryClient();

   const deleteCostCenterMutation = useMutation(
      trpc.costCenters.delete.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.costCenters.getAll.queryKey(),
            });
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
      <AlertDialog>
         <AlertDialogTrigger asChild>
            <DropdownMenuItem
               className="text-destructive flex items-center gap-2"
               onSelect={(e) => e.preventDefault()}
            >
               <Trash2 className="size-4" />
               {translate(
                  "dashboard.routes.cost-centers.list-section.actions.delete-cost-center",
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
