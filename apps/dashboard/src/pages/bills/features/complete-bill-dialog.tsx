import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { DatePicker } from "@packages/ui/components/date-picker";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetClose,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { formatDate } from "@packages/utils/date";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

interface CompleteBillSheetContentProps {
   bill: Bill;
   onClose: () => void;
}

function CompleteBillSheetContent({
   bill,
   onClose,
}: CompleteBillSheetContentProps) {
   const [completionDate, setCompletionDate] = useState(new Date());
   const [bankAccountId, setBankAccountId] = useState(
      bill.bankAccountId || undefined,
   );
   const trpc = useTRPC();

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const activeBankAccounts = bankAccounts;

   const completeBillMutation = useMutation(
      trpc.bills.complete.mutationOptions({
         onError: (error) => {
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.bills.features.create-bill.error",
                  ),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.bills.features.create-bill.success"),
            );
            onClose();
         },
      }),
   );

   const handleComplete = async () => {
      try {
         await completeBillMutation.mutateAsync({
            data: {
               bankAccountId,
               completionDate: formatDate(completionDate, "YYYY-MM-DD"),
            },
            id: bill.id,
         });
      } catch (error) {
         console.error("Failed to complete bill:", error);
      }
   };

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.bills.features.complete-bill.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.bills.features.complete-bill.description",
               )}
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="grid gap-2">
               <Label>
                  {translate(
                     "dashboard.routes.bills.features.create-bill.fields.dueDate",
                  )}
               </Label>
               <DatePicker
                  date={completionDate}
                  onSelect={(date) => setCompletionDate(date || new Date())}
                  placeholder={translate(
                     "dashboard.routes.bills.features.create-bill.placeholders.dueDate",
                  )}
               />
            </div>

            <div className="grid gap-2">
               <Label>
                  {translate(
                     "dashboard.routes.bills.features.create-bill.fields.bankAccount",
                  )}
               </Label>
               <Select onValueChange={setBankAccountId} value={bankAccountId}>
                  <SelectTrigger>
                     <SelectValue
                        placeholder={translate(
                           "dashboard.routes.bills.features.create-bill.placeholders.bankAccount",
                        )}
                     />
                  </SelectTrigger>
                  <SelectContent>
                     {activeBankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                           {account.name} - {account.bank}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">
                  {translate("common.actions.cancel")}
               </Button>
            </SheetClose>
            <Button
               disabled={completeBillMutation.isPending}
               onClick={handleComplete}
            >
               {completeBillMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               {completeBillMutation.isPending
                  ? translate(
                       "dashboard.routes.bills.features.create-bill.creating",
                    )
                  : translate(
                       "dashboard.routes.bills.features.create-bill.submit",
                    )}
            </Button>
         </SheetFooter>
      </div>
   );
}

interface CompleteBillDialogProps {
   bill: Bill;
   children: React.ReactNode;
}

export function CompleteBillDialog({
   bill,
   children,
}: CompleteBillDialogProps) {
   const { openSheet, closeSheet } = useSheet();

   const handleOpen = () => {
      openSheet({
         children: (
            <CompleteBillSheetContent bill={bill} onClose={closeSheet} />
         ),
      });
   };

   return <div onClick={handleOpen}>{children}</div>;
}
