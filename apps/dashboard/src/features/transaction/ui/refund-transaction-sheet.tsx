import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Choicebox,
   ChoiceboxIndicator,
   ChoiceboxItem,
   ChoiceboxItemDescription,
   ChoiceboxItemHeader,
   ChoiceboxItemTitle,
} from "@packages/ui/components/choicebox";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { formatDate } from "@packages/utils/date";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type RefundTransactionSheetProps = {
   transaction: {
      amount: string;
      bankAccountId: string | null;
      categoryIds: string[];
      costCenterId: string | null;
      date: Date;
      description: string;
      tagIds: string[];
      type: "expense" | "income" | "transfer";
   };
};

type DateOption = "same-day" | "today" | "custom";

const dateOptions: DateOption[] = ["same-day", "today", "custom"];

export function RefundTransactionSheet({
   transaction,
}: RefundTransactionSheetProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const [dateOption, setDateOption] = useState<DateOption>("today");
   const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

   const createTransactionMutation = useMutation(
      trpc.transactions.create.mutationOptions(),
   );

   const getRefundDate = (): Date => {
      switch (dateOption) {
         case "same-day":
            return transaction.date;
         case "today":
            return new Date();
         case "custom":
            return customDate || new Date();
      }
   };

   const handleSubmit = async () => {
      const refundType =
         transaction.type === "expense" || transaction.type === "transfer"
            ? "income"
            : "expense";

      await createTransactionMutation.mutateAsync({
         amount: Number(transaction.amount),
         bankAccountId: transaction.bankAccountId || undefined,
         categoryIds: transaction.categoryIds,
         costCenterId: transaction.costCenterId || undefined,
         date: formatDate(getRefundDate(), "YYYY-MM-DD"),
         description: `Estorno: ${transaction.description}`,
         tagIds: transaction.tagIds,
         type: refundType,
      });

      toast.success(
         translate(
            "dashboard.routes.transactions.notifications.create-success",
         ),
      );
      closeSheet();
   };

   const isSubmitDisabled =
      createTransactionMutation.isPending ||
      (dateOption === "custom" && !customDate);

   return (
      <>
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.transactions.features.refund.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.transactions.features.refund.description",
               )}
            </SheetDescription>
         </SheetHeader>

         <div className="px-4 flex-1 overflow-y-auto">
            <div className="space-y-4 py-4">
               <Choicebox
                  onValueChange={(value) => setDateOption(value as DateOption)}
                  value={dateOption}
               >
                  {dateOptions.map((option) => (
                     <ChoiceboxItem id={option} key={option} value={option}>
                        <ChoiceboxItemHeader>
                           <ChoiceboxItemTitle>
                              {translate(
                                 `dashboard.routes.transactions.features.refund.date-options.${option}.title`,
                              )}
                           </ChoiceboxItemTitle>
                           <ChoiceboxItemDescription>
                              {translate(
                                 `dashboard.routes.transactions.features.refund.date-options.${option}.description`,
                              )}
                           </ChoiceboxItemDescription>
                        </ChoiceboxItemHeader>
                        <ChoiceboxIndicator id={option} />
                     </ChoiceboxItem>
                  ))}
               </Choicebox>

               {dateOption === "custom" && (
                  <DatePicker
                     className="w-full"
                     date={customDate}
                     onSelect={setCustomDate}
                     placeholder={translate(
                        "dashboard.routes.transactions.features.refund.date-options.custom.title",
                     )}
                  />
               )}
            </div>
         </div>

         <SheetFooter>
            <Button disabled={isSubmitDisabled} onClick={handleSubmit}>
               {createTransactionMutation.isPending
                  ? translate("common.actions.loading")
                  : translate(
                       "dashboard.routes.transactions.features.refund.submit",
                    )}
            </Button>
         </SheetFooter>
      </>
   );
}
