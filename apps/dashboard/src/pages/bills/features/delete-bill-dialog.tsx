import type { Bill } from "@packages/database/repositories/bill-repository";
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
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

interface DeleteBillDialogProps {
   bill: Bill;
   children: React.ReactNode;
}

export function DeleteBillDialog({ bill, children }: DeleteBillDialogProps) {
   const [isOpen, setIsOpen] = useState(false);
   const queryClient = useQueryClient();

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
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getAll.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getStats.queryKey(),
            });
            toast.success(
               translate("dashboard.routes.bills.features.delete-bill.success"),
            );
            setIsOpen(false);
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
      <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
         <div onClick={() => setIsOpen(true)}>{children}</div>
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
