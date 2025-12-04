import { createBillSchema } from "@packages/api/schemas/bill";
import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { MoneyInput } from "@packages/ui/components/money-input";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { defineStepper } from "@packages/ui/components/stepper";
import { Textarea } from "@packages/ui/components/textarea";
import { formatDate } from "@packages/utils/date";
import { formatCurrency } from "@packages/utils/money";
import type { RecurrencePattern } from "@packages/utils/recurrence";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon, Pencil, Plus } from "lucide-react";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useTRPC } from "@/integrations/clients";
import { useBillListOptional } from "./bill-list-context";

type ManageBillSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   bill?: Bill;
   asChild?: boolean;
};

const steps = [
   { id: "details", title: "details" },
   { id: "categorization", title: "categorization" },
   { id: "additional", title: "additional" },
] as const;

const { Stepper } = defineStepper(...steps);

export function ManageBillSheet({
   onOpen,
   onOpenChange,
   bill,
   asChild = false,
}: ManageBillSheetProps) {
   const trpc = useTRPC();
   const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
   const [counterpartyComboboxOpen, setCounterpartyComboboxOpen] =
      useState(false);
   const [counterpartySearch, setCounterpartySearch] = useState("");

   const billListContext = useBillListOptional();
   const currentFilterType = billListContext?.currentFilterType;

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const { data: counterparties = [] } = useQuery(
      trpc.counterparties.getAll.queryOptions({ isActive: true }),
   );

   const { data: interestTemplates = [] } = useQuery(
      trpc.interestTemplates.getAll.queryOptions({ isActive: true }),
   );

   const activeBankAccounts = useMemo(
      () => bankAccounts.filter((account) => account.status === "active"),
      [bankAccounts],
   );

   const isEditMode = !!bill;
   const isOpen = onOpen ?? false;

   const createBillMutation = useMutation(
      trpc.bills.create.mutationOptions({
         onSuccess: async () => {
            form.reset();
            onOpenChange?.(false);
         },
      }),
   );

   const updateBillMutation = useMutation(
      trpc.bills.update.mutationOptions({
         onSuccess: () => {
            onOpenChange?.(false);
         },
      }),
   );

   const createCounterpartyMutation = useMutation(
      trpc.counterparties.create.mutationOptions(),
   );

   const createWithInstallmentsMutation = useMutation(
      trpc.bills.createWithInstallments.mutationOptions({
         onSuccess: async () => {
            form.reset();
            onOpenChange?.(false);
         },
      }),
   );

   const editValues = bill
      ? {
           amount: Number(bill.amount),
           bankAccountId: bill.bankAccountId || "",
           category: bill.categoryId || "",
           counterpartyId: bill.counterpartyId || "",
           description: bill.description,
           dueDate: bill.dueDate ? new Date(bill.dueDate) : new Date(),
           interestTemplateId: bill.interestTemplateId || "",
           isRecurring: bill.isRecurring,
           issueDate: bill.issueDate ? new Date(bill.issueDate) : undefined,
           notes: bill.notes || "",
           recurrencePattern: bill.recurrencePattern as
              | RecurrencePattern
              | undefined,
           type: bill.type as "expense" | "income",
           hasInstallments: false,
           installmentCount: 2,
           installmentIntervalType: "monthly" as
              | "monthly"
              | "biweekly"
              | "weekly"
              | "custom",
           installmentCustomDays: 30,
           installmentAmountType: "equal" as "equal" | "custom",
           installmentCustomAmounts: [] as number[],
        }
      : {
           amount: 0,
           bankAccountId: "",
           category: "",
           counterpartyId: "",
           description: "",
           dueDate: new Date(),
           interestTemplateId: "",
           isRecurring: false,
           issueDate: undefined as Date | undefined,
           notes: "",
           recurrencePattern: undefined as RecurrencePattern | undefined,
           type: (currentFilterType === "payable"
              ? "expense"
              : currentFilterType === "receivable"
                ? "income"
                : "expense") as "expense" | "income",
           hasInstallments: false,
           installmentCount: 2,
           installmentIntervalType: "monthly" as
              | "monthly"
              | "biweekly"
              | "weekly"
              | "custom",
           installmentCustomDays: 30,
           installmentAmountType: "equal" as "equal" | "custom",
           installmentCustomAmounts: [] as number[],
        };

   const form = useForm({
      defaultValues: editValues,
      onSubmit: async ({ value }) => {
         const amount = Number(value.amount);

         try {
            if (isEditMode && bill) {
               await updateBillMutation.mutateAsync({
                  data: {
                     amount: amount,
                     bankAccountId: value.bankAccountId || undefined,
                     categoryId: value.category || undefined,
                     counterpartyId: value.counterpartyId || undefined,
                     description: value.description || undefined,
                     dueDate: formatDate(value.dueDate, "YYYY-MM-DD"),
                     interestTemplateId: value.interestTemplateId || undefined,
                     isRecurring: value.isRecurring,
                     issueDate: value.issueDate
                        ? formatDate(value.issueDate, "YYYY-MM-DD")
                        : undefined,
                     notes: value.notes || undefined,
                     recurrencePattern: value.recurrencePattern,
                     type: value.type,
                  },
                  id: bill.id,
               });
            } else if (value.hasInstallments && !value.isRecurring) {
               const intervalDays =
                  value.installmentIntervalType === "monthly"
                     ? 30
                     : value.installmentIntervalType === "biweekly"
                       ? 15
                       : value.installmentIntervalType === "weekly"
                         ? 7
                         : value.installmentCustomDays;

               const amounts =
                  value.installmentAmountType === "equal"
                     ? ("equal" as const)
                     : value.installmentCustomAmounts;

               await createWithInstallmentsMutation.mutateAsync({
                  amount: amount,
                  bankAccountId: value.bankAccountId || undefined,
                  categoryId: value.category || undefined,
                  counterpartyId: value.counterpartyId || undefined,
                  description: value.description ?? "",
                  dueDate: value.dueDate,
                  installments: {
                     amounts,
                     intervalDays,
                     totalInstallments: value.installmentCount,
                  },
                  interestTemplateId: value.interestTemplateId || undefined,
                  issueDate: value.issueDate
                     ? formatDate(value.issueDate, "YYYY-MM-DD")
                     : undefined,
                  notes: value.notes || undefined,
                  type: value.type ?? "expense",
               });
            } else {
               await createBillMutation.mutateAsync({
                  amount: amount,
                  bankAccountId: value.bankAccountId || undefined,
                  categoryId: value.category || undefined,
                  counterpartyId: value.counterpartyId || undefined,
                  description: value.description ?? "",
                  dueDate: value.dueDate,
                  interestTemplateId: value.interestTemplateId || undefined,
                  isRecurring: value.isRecurring,
                  issueDate: value.issueDate
                     ? formatDate(value.issueDate, "YYYY-MM-DD")
                     : undefined,
                  notes: value.notes || undefined,
                  recurrencePattern: value.isRecurring
                     ? value.recurrencePattern
                     : undefined,
                  type: value.type ?? "expense",
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} bill:`,
               error,
            );
         }
      },
      validators: {
         onChange: createBillSchema as unknown as undefined,
      },
   });

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.bills.features.create-bill.description",
         ),
         title: translate("dashboard.routes.bills.features.create-bill.title"),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.bills.features.edit-bill.description",
         ),
         title: translate("dashboard.routes.bills.features.edit-bill.title"),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   const isPending =
      createBillMutation.isPending || updateBillMutation.isPending;

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   const handleQuickCreateCounterparty = useCallback(
      async (name: string, type: "expense" | "income") => {
         try {
            const counterpartyType = type === "expense" ? "supplier" : "client";
            const newCounterparty =
               await createCounterpartyMutation.mutateAsync({
                  name,
                  type: counterpartyType,
               });
            if (newCounterparty) {
               form.setFieldValue("counterpartyId", newCounterparty.id);
            }
            setCounterpartyComboboxOpen(false);
            setCounterpartySearch("");
         } catch (error) {
            console.error("Failed to create counterparty:", error);
         }
      },
      [createCounterpartyMutation, form],
   );

   function DetailsStep() {
      return (
         <div className="space-y-4">
            <FieldGroup>
               <form.Field name="type">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.type.label")}
                           </FieldLabel>
                           <Select
                              onValueChange={(value) =>
                                 field.handleChange(
                                    value as "expense" | "income",
                                 )
                              }
                              value={field.state.value}
                           >
                              <SelectTrigger id={field.name}>
                                 <SelectValue
                                    placeholder={translate(
                                       "common.form.type.placeholder",
                                    )}
                                 />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="expense">
                                    {translate(
                                       "dashboard.routes.bills.features.create-bill.types.expense",
                                    )}
                                 </SelectItem>
                                 <SelectItem value="income">
                                    {translate(
                                       "dashboard.routes.bills.features.create-bill.types.income",
                                    )}
                                 </SelectItem>
                              </SelectContent>
                           </Select>
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="description">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.description.label")}
                           </FieldLabel>
                           <Textarea
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.description.placeholder",
                              )}
                              value={field.state.value || ""}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="amount">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.amount.label")}
                           </FieldLabel>
                           <MoneyInput
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(value) => {
                                 field.handleChange(value || 0);
                              }}
                              placeholder="0,00"
                              value={field.state.value}
                              valueInCents={false}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="dueDate">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.dueDate",
                              )}
                           </FieldLabel>
                           <DatePicker
                              date={field.state.value}
                              onSelect={(date) =>
                                 field.handleChange(date || new Date())
                              }
                              placeholder={translate(
                                 "common.form.date.placeholder",
                              )}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            {!isEditMode && (
               <form.Subscribe
                  selector={(state) => ({
                     hasInstallments: state.values.hasInstallments,
                     isRecurring: state.values.isRecurring,
                  })}
               >
                  {({ isRecurring }) =>
                     !isRecurring && (
                        <div className="space-y-4 rounded-lg border p-4">
                           <FieldGroup>
                              <form.Field name="hasInstallments">
                                 {(field) => (
                                    <div className="flex items-center space-x-2">
                                       <Checkbox
                                          checked={field.state.value}
                                          id="hasInstallments"
                                          onCheckedChange={(checked) =>
                                             field.handleChange(!!checked)
                                          }
                                       />
                                       <Label htmlFor="hasInstallments">
                                          {translate(
                                             "dashboard.routes.bills.features.create-bill.installments.enable",
                                          )}
                                       </Label>
                                    </div>
                                 )}
                              </form.Field>
                           </FieldGroup>

                           <form.Subscribe
                              selector={(state) => ({
                                 amount: state.values.amount,
                                 hasInstallments: state.values.hasInstallments,
                                 installmentAmountType:
                                    state.values.installmentAmountType,
                                 installmentCount:
                                    state.values.installmentCount,
                                 installmentIntervalType:
                                    state.values.installmentIntervalType,
                              })}
                           >
                              {({
                                 amount,
                                 hasInstallments,
                                 installmentAmountType,
                                 installmentCount,
                                 installmentIntervalType,
                              }) =>
                                 hasInstallments && (
                                    <div className="space-y-4">
                                       <FieldGroup>
                                          <form.Field name="installmentCount">
                                             {(field) => (
                                                <Field>
                                                   <FieldLabel
                                                      htmlFor={field.name}
                                                   >
                                                      {translate(
                                                         "dashboard.routes.bills.features.create-bill.installments.count",
                                                      )}
                                                   </FieldLabel>
                                                   <Input
                                                      id={field.name}
                                                      max={120}
                                                      min={2}
                                                      onChange={(e) =>
                                                         field.handleChange(
                                                            Number(
                                                               e.target.value,
                                                            ) || 2,
                                                         )
                                                      }
                                                      type="number"
                                                      value={field.state.value}
                                                   />
                                                </Field>
                                             )}
                                          </form.Field>
                                       </FieldGroup>

                                       <FieldGroup>
                                          <form.Field name="installmentIntervalType">
                                             {(field) => (
                                                <Field>
                                                   <FieldLabel
                                                      htmlFor={field.name}
                                                   >
                                                      {translate(
                                                         "dashboard.routes.bills.features.create-bill.installments.interval",
                                                      )}
                                                   </FieldLabel>
                                                   <Select
                                                      onValueChange={(value) =>
                                                         field.handleChange(
                                                            value as
                                                               | "monthly"
                                                               | "biweekly"
                                                               | "weekly"
                                                               | "custom",
                                                         )
                                                      }
                                                      value={field.state.value}
                                                   >
                                                      <SelectTrigger
                                                         id={field.name}
                                                      >
                                                         <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                         <SelectItem value="monthly">
                                                            {translate(
                                                               "dashboard.routes.bills.features.create-bill.installments.intervalOptions.monthly",
                                                            )}
                                                         </SelectItem>
                                                         <SelectItem value="biweekly">
                                                            {translate(
                                                               "dashboard.routes.bills.features.create-bill.installments.intervalOptions.biweekly",
                                                            )}
                                                         </SelectItem>
                                                         <SelectItem value="weekly">
                                                            {translate(
                                                               "dashboard.routes.bills.features.create-bill.installments.intervalOptions.weekly",
                                                            )}
                                                         </SelectItem>
                                                         <SelectItem value="custom">
                                                            {translate(
                                                               "dashboard.routes.bills.features.create-bill.installments.intervalOptions.custom",
                                                            )}
                                                         </SelectItem>
                                                      </SelectContent>
                                                   </Select>
                                                </Field>
                                             )}
                                          </form.Field>
                                       </FieldGroup>

                                       {installmentIntervalType ===
                                          "custom" && (
                                          <FieldGroup>
                                             <form.Field name="installmentCustomDays">
                                                {(field) => (
                                                   <Field>
                                                      <FieldLabel
                                                         htmlFor={field.name}
                                                      >
                                                         {translate(
                                                            "dashboard.routes.bills.features.create-bill.installments.customDays",
                                                         )}
                                                      </FieldLabel>
                                                      <Input
                                                         id={field.name}
                                                         max={365}
                                                         min={1}
                                                         onChange={(e) =>
                                                            field.handleChange(
                                                               Number(
                                                                  e.target
                                                                     .value,
                                                               ) || 1,
                                                            )
                                                         }
                                                         type="number"
                                                         value={
                                                            field.state.value
                                                         }
                                                      />
                                                   </Field>
                                                )}
                                             </form.Field>
                                          </FieldGroup>
                                       )}

                                       <FieldGroup>
                                          <form.Field name="installmentAmountType">
                                             {(field) => (
                                                <Field>
                                                   <FieldLabel
                                                      htmlFor={field.name}
                                                   >
                                                      {translate(
                                                         "dashboard.routes.bills.features.create-bill.installments.amountType",
                                                      )}
                                                   </FieldLabel>
                                                   <RadioGroup
                                                      className="flex flex-row gap-4"
                                                      onValueChange={(value) =>
                                                         field.handleChange(
                                                            value as
                                                               | "equal"
                                                               | "custom",
                                                         )
                                                      }
                                                      value={field.state.value}
                                                   >
                                                      <div className="flex items-center space-x-2">
                                                         <RadioGroupItem
                                                            id="amount-equal"
                                                            value="equal"
                                                         />
                                                         <Label htmlFor="amount-equal">
                                                            {translate(
                                                               "dashboard.routes.bills.features.create-bill.installments.amountEqual",
                                                            )}
                                                         </Label>
                                                      </div>
                                                      <div className="flex items-center space-x-2">
                                                         <RadioGroupItem
                                                            id="amount-custom"
                                                            value="custom"
                                                         />
                                                         <Label htmlFor="amount-custom">
                                                            {translate(
                                                               "dashboard.routes.bills.features.create-bill.installments.amountCustom",
                                                            )}
                                                         </Label>
                                                      </div>
                                                   </RadioGroup>
                                                </Field>
                                             )}
                                          </form.Field>
                                       </FieldGroup>

                                       {installmentAmountType === "equal" &&
                                          amount > 0 && (
                                             <div className="text-sm text-muted-foreground">
                                                {translate(
                                                   "dashboard.routes.bills.features.create-bill.installments.totalAmount",
                                                   {
                                                      amount:
                                                         formatCurrency(amount),
                                                   },
                                                )}{" "}
                                                {translate(
                                                   "dashboard.routes.bills.features.create-bill.installments.eachAmount",
                                                   {
                                                      amount: formatCurrency(
                                                         amount /
                                                            installmentCount,
                                                      ),
                                                   },
                                                )}
                                             </div>
                                          )}

                                       {installmentAmountType === "custom" && (
                                          <div className="space-y-2">
                                             {Array.from({
                                                length: installmentCount,
                                             }).map((_, index) => (
                                                <FieldGroup key={index}>
                                                   <form.Field name="installmentCustomAmounts">
                                                      {(field) => (
                                                         <Field>
                                                            <FieldLabel>
                                                               {translate(
                                                                  "dashboard.routes.bills.features.create-bill.installments.installmentLabel",
                                                                  {
                                                                     number:
                                                                        index +
                                                                        1,
                                                                  },
                                                               )}
                                                            </FieldLabel>
                                                            <MoneyInput
                                                               onChange={(
                                                                  value,
                                                               ) => {
                                                                  const newAmounts =
                                                                     [
                                                                        ...(field
                                                                           .state
                                                                           .value ||
                                                                           []),
                                                                     ];
                                                                  newAmounts[
                                                                     index
                                                                  ] =
                                                                     value || 0;
                                                                  field.handleChange(
                                                                     newAmounts,
                                                                  );
                                                               }}
                                                               placeholder="0,00"
                                                               value={
                                                                  (field.state
                                                                     .value ||
                                                                     [])[
                                                                     index
                                                                  ] || 0
                                                               }
                                                               valueInCents={
                                                                  false
                                                               }
                                                            />
                                                         </Field>
                                                      )}
                                                   </form.Field>
                                                </FieldGroup>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 )
                              }
                           </form.Subscribe>
                        </div>
                     )
                  }
               </form.Subscribe>
            )}
         </div>
      );
   }

   function CategorizationStep() {
      return (
         <div className="space-y-4">
            <FieldGroup>
               <form.Field name="category">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                     const selectedCategory = categories.find(
                        (category) => category.id === field.state.value,
                     );

                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.category.label")}
                           </FieldLabel>
                           <Popover
                              onOpenChange={setCategoryComboboxOpen}
                              open={categoryComboboxOpen}
                           >
                              <PopoverTrigger asChild>
                                 <Button
                                    aria-expanded={categoryComboboxOpen}
                                    className="w-full justify-between"
                                    role="combobox"
                                    variant="outline"
                                 >
                                    {selectedCategory ? (
                                       <div className="flex items-center gap-2">
                                          <IconDisplay
                                             iconName={
                                                selectedCategory.icon as IconName
                                             }
                                             size={16}
                                          />
                                          <span>{selectedCategory.name}</span>
                                       </div>
                                    ) : (
                                       <span className="text-muted-foreground">
                                          {translate(
                                             "common.form.category.placeholder",
                                          )}
                                       </span>
                                    )}
                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                 </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                 <Command>
                                    <CommandInput
                                       placeholder={translate(
                                          "common.form.search.placeholder",
                                       )}
                                    />
                                    <CommandList>
                                       <CommandEmpty>
                                          {translate(
                                             "common.form.search.no-results",
                                          )}
                                       </CommandEmpty>
                                       <CommandGroup>
                                          {categories.map((category) => (
                                             <CommandItem
                                                key={category.id}
                                                onSelect={() => {
                                                   field.handleChange(
                                                      category.id ===
                                                         field.state.value
                                                         ? ""
                                                         : category.id,
                                                   );
                                                   setCategoryComboboxOpen(
                                                      false,
                                                   );
                                                }}
                                                value={category.name}
                                             >
                                                <div className="flex items-center gap-2 flex-1">
                                                   <IconDisplay
                                                      iconName={
                                                         category.icon as IconName
                                                      }
                                                      size={16}
                                                   />
                                                   <span>{category.name}</span>
                                                </div>
                                                {field.state.value ===
                                                   category.id && (
                                                   <CheckIcon className="ml-2 h-4 w-4" />
                                                )}
                                             </CommandItem>
                                          ))}
                                       </CommandGroup>
                                    </CommandList>
                                 </Command>
                              </PopoverContent>
                           </Popover>
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="counterpartyId">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                     const selectedCounterparty = counterparties.find(
                        (cp) => cp.id === field.state.value,
                     );

                     const filteredCounterparties = counterpartySearch
                        ? counterparties.filter((cp) =>
                             cp.name
                                .toLowerCase()
                                .includes(counterpartySearch.toLowerCase()),
                          )
                        : counterparties;

                     const showQuickCreate =
                        counterpartySearch.length > 0 &&
                        !filteredCounterparties.some(
                           (cp) =>
                              cp.name.toLowerCase() ===
                              counterpartySearch.toLowerCase(),
                        );

                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.counterparty",
                              )}
                           </FieldLabel>
                           <Popover
                              onOpenChange={setCounterpartyComboboxOpen}
                              open={counterpartyComboboxOpen}
                           >
                              <PopoverTrigger asChild>
                                 <Button
                                    aria-expanded={counterpartyComboboxOpen}
                                    className="w-full justify-between"
                                    role="combobox"
                                    variant="outline"
                                 >
                                    {selectedCounterparty ? (
                                       <span>{selectedCounterparty.name}</span>
                                    ) : (
                                       <span className="text-muted-foreground">
                                          {translate(
                                             "dashboard.routes.bills.features.create-bill.placeholders.counterparty",
                                          )}
                                       </span>
                                    )}
                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                 </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                 <Command shouldFilter={false}>
                                    <CommandInput
                                       onValueChange={setCounterpartySearch}
                                       placeholder={translate(
                                          "common.form.search.placeholder",
                                       )}
                                       value={counterpartySearch}
                                    />
                                    <CommandList>
                                       <CommandEmpty>
                                          {translate(
                                             "common.form.search.no-results",
                                          )}
                                       </CommandEmpty>
                                       <CommandGroup>
                                          {filteredCounterparties.map((cp) => (
                                             <CommandItem
                                                key={cp.id}
                                                onSelect={() => {
                                                   field.handleChange(
                                                      cp.id ===
                                                         field.state.value
                                                         ? ""
                                                         : cp.id,
                                                   );
                                                   setCounterpartyComboboxOpen(
                                                      false,
                                                   );
                                                   setCounterpartySearch("");
                                                }}
                                                value={cp.name}
                                             >
                                                <span className="flex-1">
                                                   {cp.name}
                                                </span>
                                                {field.state.value ===
                                                   cp.id && (
                                                   <CheckIcon className="ml-2 h-4 w-4" />
                                                )}
                                             </CommandItem>
                                          ))}
                                       </CommandGroup>
                                       {showQuickCreate && (
                                          <CommandGroup>
                                             <form.Subscribe
                                                selector={(state) =>
                                                   state.values.type
                                                }
                                             >
                                                {(type) => (
                                                   <CommandItem
                                                      onSelect={() =>
                                                         handleQuickCreateCounterparty(
                                                            counterpartySearch,
                                                            type,
                                                         )
                                                      }
                                                   >
                                                      <Plus className="mr-2 h-4 w-4" />
                                                      {translate(
                                                         "dashboard.routes.bills.features.create-bill.quick-create-counterparty",
                                                      )}{" "}
                                                      "{counterpartySearch}"
                                                   </CommandItem>
                                                )}
                                             </form.Subscribe>
                                          </CommandGroup>
                                       )}
                                    </CommandList>
                                 </Command>
                              </PopoverContent>
                           </Popover>
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="bankAccountId">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.bank.label")}
                           </FieldLabel>
                           <Select
                              onValueChange={(value) =>
                                 field.handleChange(value)
                              }
                              value={field.state.value}
                           >
                              <SelectTrigger id={field.name}>
                                 <SelectValue
                                    placeholder={translate(
                                       "common.form.bank.placeholder",
                                    )}
                                 />
                              </SelectTrigger>
                              <SelectContent>
                                 {activeBankAccounts.map((account) => (
                                    <SelectItem
                                       key={account.id}
                                       value={account.id}
                                    >
                                       {account.name} - {account.bank}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <form.Subscribe selector={(state) => state.values.type}>
               {(type) =>
                  type === "income" && (
                     <FieldGroup>
                        <form.Field name="interestTemplateId">
                           {(field) => {
                              const isInvalid =
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid;
                              return (
                                 <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>
                                       {translate(
                                          "dashboard.routes.bills.features.create-bill.fields.interestTemplate",
                                       )}
                                    </FieldLabel>
                                    <Select
                                       onValueChange={(value) =>
                                          field.handleChange(value)
                                       }
                                       value={field.state.value}
                                    >
                                       <SelectTrigger id={field.name}>
                                          <SelectValue
                                             placeholder={translate(
                                                "dashboard.routes.bills.features.create-bill.placeholders.interestTemplate",
                                             )}
                                          />
                                       </SelectTrigger>
                                       <SelectContent>
                                          {interestTemplates.map((template) => (
                                             <SelectItem
                                                key={template.id}
                                                value={template.id}
                                             >
                                                {template.name}
                                             </SelectItem>
                                          ))}
                                       </SelectContent>
                                    </Select>
                                    {isInvalid && (
                                       <FieldError
                                          errors={field.state.meta.errors}
                                       />
                                    )}
                                 </Field>
                              );
                           }}
                        </form.Field>
                     </FieldGroup>
                  )
               }
            </form.Subscribe>
         </div>
      );
   }

   function AdditionalStep() {
      return (
         <div className="space-y-4">
            <FieldGroup>
               <form.Field name="isRecurring">
                  {(field) => {
                     return (
                        <div className="flex items-center space-x-2">
                           <Checkbox
                              checked={field.state.value}
                              id="isRecurring"
                              onCheckedChange={(checked) =>
                                 field.handleChange(!!checked)
                              }
                           />
                           <label
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              htmlFor="isRecurring"
                           >
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.isRecurring",
                              )}
                           </label>
                        </div>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <form.Subscribe selector={(state) => state.values.isRecurring}>
               {(isRecurring) =>
                  isRecurring && (
                     <FieldGroup>
                        <form.Field name="recurrencePattern">
                           {(field) => {
                              const isInvalid =
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid;
                              return (
                                 <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>
                                       {translate(
                                          "dashboard.routes.bills.features.create-bill.fields.recurrencePattern",
                                       )}
                                    </FieldLabel>
                                    <Select
                                       onValueChange={(value) =>
                                          field.handleChange(
                                             value as RecurrencePattern,
                                          )
                                       }
                                       value={field.state.value}
                                    >
                                       <SelectTrigger id={field.name}>
                                          <SelectValue
                                             placeholder={translate(
                                                "dashboard.routes.bills.features.create-bill.placeholders.recurrencePattern",
                                             )}
                                          />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="monthly">
                                             {translate(
                                                "dashboard.routes.bills.features.create-bill.recurrence.monthly",
                                             )}
                                          </SelectItem>
                                          <SelectItem value="quarterly">
                                             {translate(
                                                "dashboard.routes.bills.features.create-bill.recurrence.quarterly",
                                             )}
                                          </SelectItem>
                                          <SelectItem value="semiannual">
                                             {translate(
                                                "dashboard.routes.bills.features.create-bill.recurrence.semiannual",
                                             )}
                                          </SelectItem>
                                          <SelectItem value="annual">
                                             {translate(
                                                "dashboard.routes.bills.features.create-bill.recurrence.annual",
                                             )}
                                          </SelectItem>
                                       </SelectContent>
                                    </Select>
                                    {isInvalid && (
                                       <FieldError
                                          errors={field.state.meta.errors}
                                       />
                                    )}
                                 </Field>
                              );
                           }}
                        </form.Field>
                     </FieldGroup>
                  )
               }
            </form.Subscribe>

            <FieldGroup>
               <form.Field name="issueDate">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.issueDate",
                              )}
                           </FieldLabel>
                           <DatePicker
                              date={field.state.value}
                              onSelect={(date) => field.handleChange(date)}
                              placeholder={translate(
                                 "common.form.date.placeholder",
                              )}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="notes">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.notes.label")}
                           </FieldLabel>
                           <Textarea
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.notes.placeholder",
                              )}
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
         </div>
      );
   }

   const sheetContent = (
      <SheetContent>
         <Stepper.Provider className="h-full">
            {({ methods }) => (
               <form className="h-full flex flex-col" onSubmit={handleSubmit}>
                  <SheetHeader>
                     <SheetTitle>{modeTexts.title}</SheetTitle>
                     <SheetDescription>
                        {modeTexts.description}
                     </SheetDescription>
                  </SheetHeader>

                  <div className="px-4 py-2">
                     <Stepper.Navigation>
                        {steps.map((step) => (
                           <Stepper.Step key={step.id} of={step.id} />
                        ))}
                     </Stepper.Navigation>
                  </div>

                  <div className="px-4 flex-1 overflow-y-auto">
                     {methods.switch({
                        additional: () => <AdditionalStep />,
                        categorization: () => <CategorizationStep />,
                        details: () => <DetailsStep />,
                     })}
                  </div>

                  <SheetFooter className="px-4">
                     <Stepper.Controls className="flex flex-col w-full gap-2">
                        {methods.isFirst ? (
                           <form.Subscribe
                              selector={(state) => ({
                                 amountValid: state.fieldMeta.amount?.isValid,
                                 descriptionValid:
                                    state.fieldMeta.description?.isValid,
                                 dueDateValid: state.fieldMeta.dueDate?.isValid,
                                 typeValid: state.fieldMeta.type?.isValid,
                              })}
                           >
                              {({
                                 amountValid,
                                 descriptionValid,
                                 dueDateValid,
                                 typeValid,
                              }) => (
                                 <Button
                                    className="w-full"
                                    disabled={
                                       !amountValid ||
                                       !descriptionValid ||
                                       !dueDateValid ||
                                       !typeValid
                                    }
                                    onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       methods.next();
                                    }}
                                    type="button"
                                 >
                                    {translate("common.actions.next")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : methods.isLast ? (
                           <form.Subscribe
                              selector={(state) => ({
                                 canSubmit: state.canSubmit,
                                 isSubmitting: state.isSubmitting,
                              })}
                           >
                              {({ canSubmit, isSubmitting }) => (
                                 <>
                                    <Button
                                       className="w-full"
                                       disabled={
                                          !canSubmit ||
                                          isSubmitting ||
                                          isPending
                                       }
                                       type="submit"
                                    >
                                       {translate("common.actions.submit")}
                                    </Button>
                                    <Button
                                       className="w-full"
                                       onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          methods.prev();
                                       }}
                                       type="button"
                                       variant="ghost"
                                    >
                                       {translate("common.actions.previous")}
                                    </Button>
                                 </>
                              )}
                           </form.Subscribe>
                        ) : (
                           <>
                              <Button
                                 className="w-full"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    methods.next();
                                 }}
                                 type="button"
                              >
                                 {translate("common.actions.next")}
                              </Button>
                              <Button
                                 className="w-full"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    methods.prev();
                                 }}
                                 type="button"
                                 variant="ghost"
                              >
                                 {translate("common.actions.previous")}
                              </Button>
                           </>
                        )}
                     </Stepper.Controls>
                  </SheetFooter>
               </form>
            )}
         </Stepper.Provider>
      </SheetContent>
   );

   if (asChild) {
      return (
         <Sheet
            onOpenChange={(open) => {
               onOpenChange?.(open);
               if (!open && !isEditMode) {
                  form.reset();
               }
            }}
            open={isOpen}
         >
            <SheetTrigger asChild>
               <Button>
                  {isEditMode ? (
                     <Pencil className="h-4 w-4 mr-2" />
                  ) : (
                     <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isEditMode
                     ? translate("common.actions.edit")
                     : translate("common.actions.add")}
               </Button>
            </SheetTrigger>
            {sheetContent}
         </Sheet>
      );
   }

   return (
      <Sheet
         onOpenChange={(open) => {
            onOpenChange?.(open);
            if (!open && !isEditMode) {
               form.reset();
            }
         }}
         open={isOpen}
      >
         {sheetContent}
      </Sheet>
   );
}
