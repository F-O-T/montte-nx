import { Button } from "@packages/ui/components/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@packages/ui/components/dialog";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Transaction } from "../ui/transactions-list-section";
import { trpc } from "@/integrations/clients";

interface DeleteTransactionProps {
   transaction: Transaction;
   asChild?: boolean;
}

export function DeleteTransaction({ transaction, asChild }: DeleteTransactionProps) {
   const [open, setOpen] = useState(false);
   const queryClient = useQueryClient();

   const deleteTransactionMutation = useMutation({
      ...trpc.transactions.delete.mutationOptions(),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: trpc.transactions.getAll.queryKey() });
         setOpen(false);
      },
   });

   const handleDelete = () => {
      deleteTransactionMutation.mutate(transaction.id);
   };

   return (
      <Dialog onOpenChange={setOpen} open={open}>
         <DialogTrigger asChild={asChild}>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
               <Trash2 className="h-4 w-4" />
               Delete
            </Button>
         </DialogTrigger>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Delete Transaction</DialogTitle>
               <DialogDescription>
                  Are you sure you want to delete the transaction "{transaction.description}"?
                  This action cannot be undone.
               </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button
                  disabled={deleteTransactionMutation.isPending}
                  onClick={() => setOpen(false)}
                  variant="outline"
               >
                  Cancel
               </Button>
               <Button
                  disabled={deleteTransactionMutation.isPending}
                  onClick={handleDelete}
                  variant="destructive"
               >
                  {deleteTransactionMutation.isPending
                     ? "Deleting..."
                     : "Delete Transaction"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}