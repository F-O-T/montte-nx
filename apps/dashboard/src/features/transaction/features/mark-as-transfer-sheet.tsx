import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";
import type { Transaction } from "../ui/transaction-item";

type MarkAsTransferSheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   transactions: Transaction[];
   onSuccess?: () => void;
};

export function MarkAsTransferSheet({
   isOpen,
   onOpenChange,
   transactions,
   onSuccess,
}: MarkAsTransferSheetProps) {
   const queryClient = useQueryClient();
   const [selectedBankAccountId, setSelectedBankAccountId] =
      useState<string>("");

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const markAsTransferMutation = useMutation(
      trpc.transactions.markAsTransfer.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao marcar como transferência");
         },
         onSuccess: async (data) => {
            await Promise.all([
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getAllPaginated.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.bankAccounts.getTransactions.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getStats.queryKey(),
               }),
            ]);
            toast.success(
               `${data.length} ${data.length === 1 ? "transação marcada" : "transações marcadas"} como transferência`,
            );
            onSuccess?.();
            handleOpenChange(false);
         },
      }),
   );

   const sourceBankAccountIds = [
      ...new Set(
         transactions
            .filter((t) => t.bankAccountId)
            .map((t) => t.bankAccountId),
      ),
   ];

   const availableBankAccounts = bankAccounts.filter(
      (account) => !sourceBankAccountIds.includes(account.id),
   );

   const bankAccountOptions = availableBankAccounts.map((account) => ({
      label: `${account.name} - ${account.bank}`,
      value: account.id,
   }));

   const handleConfirm = () => {
      if (selectedBankAccountId && transactions.length > 0) {
         markAsTransferMutation.mutate({
            ids: transactions.map((t) => t.id),
            toBankAccountId: selectedBankAccountId,
         });
      }
   };

   const handleOpenChange = (open: boolean) => {
      if (!open) {
         setSelectedBankAccountId("");
      }
      onOpenChange(open);
   };

   return (
      <Sheet onOpenChange={handleOpenChange} open={isOpen}>
         <SheetContent side="right">
            <SheetHeader>
               <SheetTitle>Marcar como Transferência</SheetTitle>
               <SheetDescription>
                  Marque {transactions.length}{" "}
                  {transactions.length === 1 ? "transação" : "transações"} como
                  transferência para outra conta.
               </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4 py-4">
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.to-account.label")}
                     </FieldLabel>
                     <Combobox
                        emptyMessage={translate(
                           "common.form.search.no-results",
                        )}
                        onValueChange={setSelectedBankAccountId}
                        options={bankAccountOptions}
                        placeholder={translate(
                           "common.form.to-account.placeholder",
                        )}
                        searchPlaceholder={translate(
                           "common.form.search.label",
                        )}
                        value={selectedBankAccountId}
                     />
                  </Field>
               </FieldGroup>
            </div>
            <SheetFooter className="px-4">
               <Button
                  className="w-full"
                  disabled={
                     !selectedBankAccountId || markAsTransferMutation.isPending
                  }
                  onClick={handleConfirm}
               >
                  {markAsTransferMutation.isPending
                     ? "Salvando..."
                     : "Confirmar"}
               </Button>
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
}
