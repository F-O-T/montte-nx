import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { formatDecimalCurrency } from "@packages/money";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Choicebox,
   ChoiceboxIndicator,
   ChoiceboxItem,
   ChoiceboxItemHeader,
   ChoiceboxItemTitle,
} from "@packages/ui/components/choicebox";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Check, ChevronDown, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

type Bill = BillWithRelations;

type CreateInstallmentsFormProps = {
   bill: Bill;
   onSuccess?: () => void;
};

type InstallmentSection = "count" | "interval" | "review";

type IntervalType = "monthly" | "biweekly" | "weekly" | "custom";

const INTERVAL_OPTIONS = ["monthly", "biweekly", "weekly", "custom"] as const;

export function CreateInstallmentsForm({
   bill,
   onSuccess,
}: CreateInstallmentsFormProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const [activeSection, setActiveSection] =
      useState<InstallmentSection>("count");
   const [installmentCount, setInstallmentCount] = useState<number>(12);
   const [intervalType, setIntervalType] = useState<IntervalType | undefined>(
      undefined,
   );
   const [customDays, setCustomDays] = useState<number>(30);

   const totalAmount = Number(bill.amount);
   const amountPerInstallment = useMemo(() => {
      if (installmentCount < 1) return 0;
      return totalAmount / installmentCount;
   }, [totalAmount, installmentCount]);

   const intervalLabels: Record<string, string> = {
      biweekly: translate(
         "dashboard.routes.bills.features.create-bill.installments.intervalOptions.biweekly",
      ),
      custom: translate(
         "dashboard.routes.bills.features.create-bill.installments.intervalOptions.custom",
      ),
      monthly: translate(
         "dashboard.routes.bills.features.create-bill.installments.intervalOptions.monthly",
      ),
      weekly: translate(
         "dashboard.routes.bills.features.create-bill.installments.intervalOptions.weekly",
      ),
   };

   const createWithInstallmentsMutation = useMutation(
      trpc.bills.createWithInstallments.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao criar parcelas");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getAllPaginated.queryKey(),
            });
            toast.success(
               translate(
                  "dashboard.routes.bills.features.create-installments.success",
               ),
            );
            onSuccess?.();
         },
      }),
   );

   const handleSubmit = () => {
      if (!intervalType) return;

      const intervalDays =
         intervalType === "monthly"
            ? 30
            : intervalType === "biweekly"
              ? 15
              : intervalType === "weekly"
                ? 7
                : customDays;

      createWithInstallmentsMutation.mutate({
         amount: totalAmount,
         bankAccountId: bill.bankAccountId || undefined,
         categoryId: bill.categoryId || undefined,
         counterpartyId: bill.counterpartyId || undefined,
         description: bill.description,
         dueDate: new Date(bill.dueDate),
         installments: {
            amounts: "equal",
            intervalDays,
            totalInstallments: installmentCount,
         },
         interestTemplateId: bill.interestTemplateId || undefined,
         issueDate: bill.issueDate ? String(bill.issueDate) : undefined,
         notes: bill.notes || undefined,
         type: bill.type as "expense" | "income",
      });
   };

   const isSubmitDisabled =
      createWithInstallmentsMutation.isPending ||
      installmentCount < 2 ||
      !intervalType ||
      (intervalType === "custom" && customDays < 1);

   return (
      <>
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.bills.features.create-installments.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.bills.features.create-installments.description",
               )}
            </SheetDescription>
         </SheetHeader>

         <div className="px-4 flex-1 overflow-y-auto">
            <div className="space-y-4 py-4">
               {/* Step 1: Count */}
               <Collapsible
                  onOpenChange={(open) => {
                     if (open) setActiveSection("count");
                     else if (installmentCount >= 2)
                        setActiveSection("interval");
                  }}
                  open={activeSection === "count"}
               >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div
                           className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              installmentCount >= 2
                                 ? "bg-primary text-primary-foreground"
                                 : "bg-muted text-muted-foreground"
                           }`}
                        >
                           {installmentCount >= 2 ? (
                              <Check className="h-3.5 w-3.5" />
                           ) : (
                              "1"
                           )}
                        </div>
                        <div className="text-left">
                           <div className="font-medium">
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.installments.count",
                              )}
                           </div>
                           <div className="text-sm text-muted-foreground">
                              {activeSection !== "count" &&
                              installmentCount >= 2
                                 ? `${installmentCount}x`
                                 : translate(
                                      "dashboard.routes.bills.features.create-bill.recurrence-step.installment.count.description",
                                   )}
                           </div>
                        </div>
                     </div>
                     <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                           activeSection === "count" ? "rotate-180" : ""
                        }`}
                     />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                     <div className="pt-3 space-y-3">
                        <div className="space-y-3">
                           <div className="flex items-center justify-center gap-4">
                              <Button
                                 className="h-9 w-9 rounded-full"
                                 disabled={installmentCount <= 2}
                                 onClick={() =>
                                    setInstallmentCount(
                                       Math.max(2, installmentCount - 1),
                                    )
                                 }
                                 size="icon"
                                 type="button"
                                 variant="outline"
                              >
                                 <Minus className="h-4 w-4" />
                              </Button>
                              <div className="flex flex-col items-center">
                                 <span className="text-2xl font-bold tabular-nums">
                                    {installmentCount}
                                 </span>
                                 <span className="text-xs text-muted-foreground">
                                    parcelas
                                 </span>
                              </div>
                              <Button
                                 className="h-9 w-9 rounded-full"
                                 disabled={installmentCount >= 120}
                                 onClick={() =>
                                    setInstallmentCount(
                                       Math.min(120, installmentCount + 1),
                                    )
                                 }
                                 size="icon"
                                 type="button"
                                 variant="outline"
                              >
                                 <Plus className="h-4 w-4" />
                              </Button>
                           </div>
                           <div className="flex flex-wrap justify-center gap-1.5">
                              {[2, 3, 6, 10, 12, 24].map((count) => (
                                 <Button
                                    className="h-7 px-2.5 text-xs"
                                    key={`installment-${count}`}
                                    onClick={() => setInstallmentCount(count)}
                                    size="sm"
                                    type="button"
                                    variant={
                                       installmentCount === count
                                          ? "default"
                                          : "outline"
                                    }
                                 >
                                    {count}x
                                 </Button>
                              ))}
                           </div>
                        </div>

                        {/* Value summary */}
                        <div className="p-3 bg-muted/50 rounded-lg space-y-1.5 text-sm">
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                 Valor total:
                              </span>
                              <span className="font-medium">
                                 {formatDecimalCurrency(totalAmount)}
                              </span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                 Valor por parcela:
                              </span>
                              <span className="font-medium">
                                 {formatDecimalCurrency(amountPerInstallment)}
                              </span>
                           </div>
                        </div>
                     </div>
                  </CollapsibleContent>
               </Collapsible>

               {/* Step 2: Interval */}
               <Collapsible
                  onOpenChange={(open) => {
                     if (open && installmentCount >= 2)
                        setActiveSection("interval");
                     else if (intervalType) setActiveSection("review");
                     else if (installmentCount >= 2) setActiveSection("count");
                  }}
                  open={activeSection === "interval"}
               >
                  <CollapsibleTrigger
                     className={`flex w-full items-center justify-between rounded-lg border p-4 transition-colors ${
                        installmentCount >= 2
                           ? "hover:bg-muted/50"
                           : "opacity-50 cursor-not-allowed"
                     }`}
                     disabled={installmentCount < 2}
                  >
                     <div className="flex items-center gap-3">
                        <div
                           className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              intervalType
                                 ? "bg-primary text-primary-foreground"
                                 : "bg-muted text-muted-foreground"
                           }`}
                        >
                           {intervalType ? (
                              <Check className="h-3.5 w-3.5" />
                           ) : (
                              "2"
                           )}
                        </div>
                        <div className="text-left">
                           <div className="font-medium">
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.installments.interval",
                              )}
                           </div>
                           <div className="text-sm text-muted-foreground">
                              {intervalType && activeSection !== "interval"
                                 ? intervalType === "custom"
                                    ? `${customDays} dias`
                                    : intervalLabels[intervalType]
                                 : translate(
                                      "dashboard.routes.bills.features.create-bill.recurrence-step.installment.interval.description",
                                   )}
                           </div>
                        </div>
                     </div>
                     <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                           activeSection === "interval" ? "rotate-180" : ""
                        }`}
                     />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                     <div className="pt-4 space-y-4">
                        <Choicebox
                           onValueChange={(value) => {
                              const interval = value as IntervalType;
                              setIntervalType(interval);
                              if (interval !== "custom") {
                                 setActiveSection("review");
                              }
                           }}
                           value={intervalType || ""}
                        >
                           {INTERVAL_OPTIONS.map((option) => (
                              <ChoiceboxItem
                                 id={`interval-${option}`}
                                 key={option}
                                 value={option}
                              >
                                 <ChoiceboxItemHeader>
                                    <ChoiceboxItemTitle>
                                       {intervalLabels[option]}
                                    </ChoiceboxItemTitle>
                                 </ChoiceboxItemHeader>
                                 <ChoiceboxIndicator
                                    id={`interval-${option}`}
                                 />
                              </ChoiceboxItem>
                           ))}
                        </Choicebox>

                        {intervalType === "custom" && (
                           <div className="space-y-2">
                              <Label>
                                 {translate(
                                    "dashboard.routes.bills.features.create-bill.installments.customDays",
                                 )}
                              </Label>
                              <Input
                                 max={365}
                                 min={1}
                                 onBlur={() => {
                                    // Safety net - ensure value is in valid range
                                    if (customDays < 1) {
                                       setCustomDays(1);
                                    } else if (customDays > 365) {
                                       setCustomDays(365);
                                    }
                                 }}
                                 onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                       // Treat empty input as minimum valid value
                                       setCustomDays(1);
                                    } else {
                                       const parsed = Number(val);
                                       // Immediately clamp to valid range [1, 365]
                                       const clamped = Math.max(
                                          1,
                                          Math.min(365, parsed),
                                       );
                                       setCustomDays(clamped);
                                    }
                                 }}
                                 type="number"
                                 value={customDays}
                              />
                              <Button
                                 className="w-full mt-2"
                                 onClick={() => setActiveSection("review")}
                                 size="sm"
                                 type="button"
                              >
                                 {translate("common.actions.confirm")}
                              </Button>
                           </div>
                        )}
                     </div>
                  </CollapsibleContent>
               </Collapsible>

               {/* Preview - Shows when all steps are complete */}
               {installmentCount >= 2 &&
                  intervalType &&
                  activeSection === "review" && (
                     <Alert>
                        <CalendarCheck className="h-4 w-4" />
                        <AlertTitle>
                           {translate(
                              "dashboard.routes.bills.features.create-bill.recurrence-step.preview.title",
                           )}
                        </AlertTitle>
                        <AlertDescription>
                           {translate(
                              "dashboard.routes.bills.features.create-bill.installments.preview",
                              {
                                 count: installmentCount,
                                 value: formatDecimalCurrency(
                                    amountPerInstallment,
                                 ),
                              },
                           )}
                        </AlertDescription>
                     </Alert>
                  )}
            </div>
         </div>

         <SheetFooter className="px-4">
            <Button
               className="w-full"
               disabled={isSubmitDisabled}
               onClick={handleSubmit}
            >
               {createWithInstallmentsMutation.isPending
                  ? translate("common.actions.loading")
                  : translate(
                       "dashboard.routes.bills.features.create-installments.submit",
                    )}
            </Button>
         </SheetFooter>
      </>
   );
}
