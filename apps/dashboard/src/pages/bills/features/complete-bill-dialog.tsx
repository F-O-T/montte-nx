import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
   Field,
   FieldDescription,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Separator } from "@packages/ui/components/separator";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { formatDate } from "@packages/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AmountAnnouncement } from "@/features/transaction/ui/amount-announcement";
import { CategoryAnnouncement } from "@/features/transaction/ui/category-announcement";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type Bill = BillWithRelations;

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
   const queryClient = useQueryClient();

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const isExpense = bill.type === "expense";
   const category = categories.find((c) => c.id === bill.categoryId);

   const completeBillMutation = useMutation(
      trpc.bills.complete.mutationOptions({
         onError: (error) => {
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.bills.features.complete-bill.error",
                  ),
            );
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getById.queryKey({ id: bill.id }),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getAllPaginated.queryKey(),
            });
            toast.success(
               translate(
                  isExpense
                     ? "dashboard.routes.bills.features.complete-bill.success-payment"
                     : "dashboard.routes.bills.features.complete-bill.success-receipt",
               ),
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
                  isExpense
                     ? "dashboard.routes.bills.features.complete-bill.title-expense"
                     : "dashboard.routes.bills.features.complete-bill.title-income",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  isExpense
                     ? "dashboard.routes.bills.features.complete-bill.description-expense"
                     : "dashboard.routes.bills.features.complete-bill.description-income",
               )}
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {/* Bill Summary Card */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {translate(
                     "dashboard.routes.bills.features.complete-bill.summary",
                  )}
               </p>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">
                        {translate(
                           "dashboard.routes.bills.table.columns.description",
                        )}
                     </span>
                     <span className="font-medium text-sm truncate max-w-[200px]">
                        {bill.description}
                     </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">
                        {translate(
                           "dashboard.routes.bills.table.columns.dueDate",
                        )}
                     </span>
                     <span className="text-sm">
                        {formatDate(new Date(bill.dueDate), "DD/MM/YYYY")}
                     </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">
                        {translate(
                           "dashboard.routes.bills.table.columns.amount",
                        )}
                     </span>
                     <AmountAnnouncement
                        amount={Number(bill.amount)}
                        isPositive={!isExpense}
                     />
                  </div>
                  {category && (
                     <>
                        <Separator />
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-muted-foreground">
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.category",
                              )}
                           </span>
                           <CategoryAnnouncement
                              category={{
                                 color: category.color,
                                 icon: category.icon || "Wallet",
                                 name: category.name,
                              }}
                           />
                        </div>
                     </>
                  )}
               </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           isExpense
                              ? "dashboard.routes.bills.features.complete-bill.completion-date-expense"
                              : "dashboard.routes.bills.features.complete-bill.completion-date-income",
                        )}
                     </FieldLabel>
                     <DatePicker
                        className="w-full"
                        date={completionDate}
                        onSelect={(date) => setCompletionDate(date || new Date())}
                     />
                  </Field>
               </FieldGroup>

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           "dashboard.routes.bills.features.complete-bill.bank-account",
                        )}
                     </FieldLabel>
                     <Select
                        onValueChange={setBankAccountId}
                        value={bankAccountId}
                     >
                        <SelectTrigger>
                           <SelectValue
                              placeholder={translate(
                                 "dashboard.routes.bills.features.create-bill.placeholders.bankAccount",
                              )}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                 {account.name} - {account.bank}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FieldDescription>
                        {translate(
                           "dashboard.routes.bills.features.complete-bill.bank-account-description",
                        )}
                     </FieldDescription>
                  </Field>
               </FieldGroup>
            </div>
         </div>

         <SheetFooter className="px-4">
            <Button
               className="w-full"
               disabled={completeBillMutation.isPending}
               onClick={handleComplete}
            >
               {completeBillMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
               ) : (
                  <Check className="size-4" />
               )}
               {completeBillMutation.isPending
                  ? translate("common.actions.loading")
                  : translate(
                       isExpense
                          ? "dashboard.routes.bills.features.complete-bill.confirm-payment"
                          : "dashboard.routes.bills.features.complete-bill.confirm-receipt",
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
