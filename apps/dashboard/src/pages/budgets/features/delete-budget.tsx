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
import type { Budget } from "../ui/budgets-page";

interface DeleteBudgetProps {
   budget: Budget;
   children?: React.ReactNode;
   asDropdownItem?: boolean;
}

export function DeleteBudget({
   budget,
   children,
   asDropdownItem = false,
}: DeleteBudgetProps) {
   const queryClient = useQueryClient();

   const deleteBudgetMutation = useMutation(
      trpc.budgets.delete.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.budgets.getAllPaginated.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.budgets.getStats.queryKey(),
            });
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteBudgetMutation.mutateAsync({ id: budget.id });
      } catch (error) {
         console.error("Failed to delete budget:", error);
      }
   };

   const trigger = asDropdownItem ? (
      <DropdownMenuItem
         className="text-destructive flex items-center gap-2"
         onSelect={(e) => e.preventDefault()}
      >
         <Trash2 className="size-4" />
         {translate("dashboard.routes.budgets.list-section.actions.delete")}
      </DropdownMenuItem>
   ) : (
      children
   );

   return (
      <AlertDialog>
         <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {translate(
                     "dashboard.routes.budgets.features.delete-budget.title",
                  )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate(
                     "dashboard.routes.budgets.features.delete-budget.description",
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>
                  {translate(
                     "dashboard.routes.budgets.features.delete-budget.cancel",
                  )}
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  disabled={deleteBudgetMutation.isPending}
                  onClick={handleDelete}
               >
                  {translate(
                     "dashboard.routes.budgets.features.delete-budget.confirm",
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
