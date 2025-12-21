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
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type DuplicateBillSheetProps = {
   bill: {
      amount: string;
      bankAccountId: string | null;
      categoryId: string | null;
      counterpartyId: string | null;
      description: string;
      dueDate: Date;
      issueDate: Date | null;
      notes: string | null;
      type: "expense" | "income";
   };
};

type DateOption = "same-day" | "today" | "custom";

export function DuplicateBillSheet({ bill }: DuplicateBillSheetProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const [dateOption, setDateOption] = useState<DateOption>("today");
   const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

   const createBillMutation = useMutation(
      trpc.bills.create.mutationOptions({
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.bills.features.create-bill.success"),
            );
            closeSheet();
         },
         onError: (error) => {
            console.error("Failed to duplicate bill:", error);
            toast.error(
               translate("dashboard.routes.bills.features.create-bill.error"),
            );
         },
      }),
   );

   const getDuplicateDate = (): Date => {
      switch (dateOption) {
         case "same-day":
            return bill.dueDate;
         case "today":
            return new Date();
         case "custom":
            if (!customDate) {
               throw new Error(
                  "Custom date is required when dateOption is 'custom'",
               );
            }
            return customDate;
      }
   };

   const handleSubmit = () => {
      createBillMutation.mutate({
         amount: Number(bill.amount),
         bankAccountId: bill.bankAccountId || undefined,
         categoryId: bill.categoryId || undefined,
         counterpartyId: bill.counterpartyId || undefined,
         description: bill.description,
         dueDate: getDuplicateDate(),
         issueDate: bill.issueDate || undefined,
         notes: bill.notes || undefined,
         type: bill.type,
      });
   };

   const isSubmitDisabled =
      createBillMutation.isPending || (dateOption === "custom" && !customDate);

   const dateOptionLabels: Record<
      DateOption,
      { title: string; description: string }
   > = {
      "same-day": {
         title: translate(
            "dashboard.routes.bills.features.duplicate-bill.date-options.same-day",
         ),
         description: "",
      },
      today: {
         title: translate(
            "dashboard.routes.bills.features.duplicate-bill.date-options.today",
         ),
         description: "",
      },
      custom: {
         title: translate(
            "dashboard.routes.bills.features.duplicate-bill.date-options.custom",
         ),
         description: "",
      },
   };

   return (
      <>
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.bills.features.duplicate-bill.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.bills.features.duplicate-bill.description",
               )}
            </SheetDescription>
         </SheetHeader>

         <div className="px-4 flex-1 overflow-y-auto">
            <div className="space-y-4 py-4">
               <Choicebox
                  onValueChange={(value) => setDateOption(value as DateOption)}
                  value={dateOption}
               >
                  {(["same-day", "today", "custom"] as DateOption[]).map(
                     (option) => (
                        <ChoiceboxItem id={option} key={option} value={option}>
                           <ChoiceboxItemHeader>
                              <ChoiceboxItemTitle>
                                 {dateOptionLabels[option].title}
                              </ChoiceboxItemTitle>
                              {dateOptionLabels[option].description && (
                                 <ChoiceboxItemDescription>
                                    {dateOptionLabels[option].description}
                                 </ChoiceboxItemDescription>
                              )}
                           </ChoiceboxItemHeader>
                           <ChoiceboxIndicator id={option} />
                        </ChoiceboxItem>
                     ),
                  )}
               </Choicebox>

               {dateOption === "custom" && (
                  <DatePicker
                     className="w-full"
                     date={customDate}
                     onSelect={setCustomDate}
                     placeholder={translate(
                        "dashboard.routes.bills.features.duplicate-bill.date-options.custom",
                     )}
                  />
               )}
            </div>
         </div>

         <SheetFooter>
            <Button disabled={isSubmitDisabled} onClick={handleSubmit}>
               {createBillMutation.isPending
                  ? translate("common.actions.loading")
                  : translate(
                       "dashboard.routes.bills.features.duplicate-bill.submit",
                    )}
            </Button>
         </SheetFooter>
      </>
   );
}
