import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
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
import { MoneyInput } from "@packages/ui/components/money-input";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
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
import { Textarea } from "@packages/ui/components/textarea";
import type { RecurrencePattern } from "@packages/utils/recurrence";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   CheckIcon,
   ChevronDownIcon,
   ChevronsUpDownIcon,
   Pencil,
   Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";
import { useBillList } from "./bill-list-context";

type ManageBillSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   bill?: Bill; // If provided, edit mode. If not, create mode
   asChild?: boolean;
};

export function ManageBillSheet({
   onOpen,
   onOpenChange,
   bill,
   asChild = false,
}: ManageBillSheetProps) {
   const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
   const [isDetailsOpen, setIsDetailsOpen] = useState(false);
   const { currentFilterType } = useBillList();
   const queryClient = useQueryClient();

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const activeBankAccounts = bankAccounts;

   const isEditMode = !!bill;
   const isOpen = onOpen ?? false;

   const createBillMutation = useMutation(
      trpc.bills.create.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.bills.getAll.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.bills.getStats.queryKey(),
            });
            form.reset();
            onOpenChange?.(false);
         },
      }),
   );

   const updateBillMutation = useMutation(
      trpc.bills.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getAll.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getStats.queryKey(),
            });
            onOpenChange?.(false);
         },
      }),
   );

   // Default values for create mode
   const defaultValues = useMemo(
      () => ({
         amount: 0,
         bankAccountId: undefined as string | undefined,
         category: "",
         counterparty: "",
         description: "",
         dueDate: new Date(),
         isRecurring: false,
         issueDate: undefined as Date | undefined,
         notes: "",
         recurrencePattern: undefined as RecurrencePattern | undefined,
         type: (currentFilterType === "payable"
            ? "expense"
            : currentFilterType === "receivable"
              ? "income"
              : "expense") as "expense" | "income",
      }),
      [currentFilterType],
   );

   // Values for edit mode - convert from Bill data
   const editValues = bill
      ? {
           amount: Number(bill.amount),
           bankAccountId: bill.bankAccountId || undefined,
           category: bill.categoryId,
           counterparty: bill.counterparty || "",
           description: bill.description,
           dueDate: bill.dueDate ? new Date(bill.dueDate) : new Date(),
           isRecurring: bill.isRecurring,
           issueDate: bill.issueDate ? new Date(bill.issueDate) : undefined,
           notes: bill.notes || "",
           recurrencePattern: bill.recurrencePattern as
              | RecurrencePattern
              | undefined,
           type: bill.type as "expense" | "income",
        }
      : defaultValues;

   const form = useForm({
      defaultValues: editValues,
      onSubmit: async ({ value }) => {
         const amount = Number(value.amount);
         if (
            value.amount === undefined ||
            amount <= 0 ||
            !value.category ||
            !value.description
         ) {
            return;
         }

         try {
            if (isEditMode && bill) {
               // Update existing bill
               await updateBillMutation.mutateAsync({
                  data: {
                     amount: amount,
                     bankAccountId: value.bankAccountId,
                     categoryId: value.category,
                     counterparty: value.counterparty,
                     description: value.description,
                     dueDate: value.dueDate.toISOString().split("T")[0]!,
                     isRecurring: value.isRecurring,
                     issueDate: value.issueDate
                        ? value.issueDate.toISOString().split("T")[0]!
                        : undefined,
                     notes: value.notes,
                     recurrencePattern: value.recurrencePattern,
                     type: value.type,
                  },
                  id: bill.id,
               });
            } else {
               // Create new bill
               await createBillMutation.mutateAsync({
                  amount: amount,
                  bankAccountId: value.bankAccountId || undefined,
                  categoryId: value.category,
                  counterparty: value.counterparty || undefined,
                  description: value.description!,
                  dueDate: value.dueDate.toISOString().split("T")[0]!,
                  isRecurring: value.isRecurring,
                  issueDate: value.issueDate
                     ? value.issueDate.toISOString().split("T")[0]!
                     : undefined,
                  notes: value.notes || undefined,
                  recurrencePattern: value.isRecurring
                     ? value.recurrencePattern
                     : undefined,
                  type: value.type!,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} bill:`,
               error,
            );
         }
      },
   });

   const title = isEditMode
      ? translate("dashboard.routes.bills.features.edit-bill.title")
      : translate("dashboard.routes.bills.features.create-bill.title");

   const description = isEditMode
      ? translate("dashboard.routes.bills.features.edit-bill.description")
      : translate("dashboard.routes.bills.features.create-bill.description");

   const submitText = isEditMode
      ? translate("dashboard.routes.bills.features.edit-bill.submit")
      : translate("dashboard.routes.bills.features.create-bill.submit");

   const submittingText = isEditMode
      ? translate("dashboard.routes.bills.features.edit-bill.updating")
      : translate("dashboard.routes.bills.features.create-bill.creating");

   const isPending =
      createBillMutation.isPending || updateBillMutation.isPending;

   const content = (
      <SheetContent className="overflow-y-auto">
         <form
            className="h-full flex flex-col"
            onSubmit={(e) => {
               e.preventDefault();
               e.stopPropagation();
               form.handleSubmit();
            }}
         >
            <SheetHeader>
               <SheetTitle>{title}</SheetTitle>
               <SheetDescription>{description}</SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 px-4">
               {/* Essential Fields */}
               <div className="space-y-4">
                  <FieldGroup>
                     <form.Field name="type">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
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
                                    <SelectTrigger>
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate("common.form.notes.label")}
                                 </FieldLabel>
                                 <Textarea
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate("common.form.amount.label")}
                                 </FieldLabel>
                                 <MoneyInput
                                    onBlur={field.handleBlur}
                                    onChange={(value) => {
                                       field.handleChange(value || 0);
                                    }}
                                    placeholder="0,00"
                                    value={field.state.value}
                                    valueInCents={true}
                                 />
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

                  <FieldGroup>
                     <form.Field name="category">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;

                           const selectedCategory = categories.find(
                              (category) => category.id === field.state.value,
                           );

                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
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
                                                      selectedCategory.icon as any
                                                   }
                                                   size={16}
                                                />
                                                <span>
                                                   {selectedCategory.name}
                                                </span>
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
                                                               category.icon as any
                                                            }
                                                            size={16}
                                                         />
                                                         <span>
                                                            {category.name}
                                                         </span>
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.bills.features.create-bill.fields.dueDate",
                                    )}
                                 </FieldLabel>
                                 <DatePicker
                                    date={field.state.value}
                                    onSelect={(date) =>
                                       field.handleChange(date || new Date())
                                    }
                                 />
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
                                    Conta recorrente
                                 </label>
                              </div>
                           );
                        }}
                     </form.Field>
                  </FieldGroup>

                  <form.Subscribe
                     selector={(state) => state.values.isRecurring}
                  >
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
                                          <FieldLabel>
                                             Padrão de recorrência
                                          </FieldLabel>
                                          <Select
                                             onValueChange={(value) =>
                                                field.handleChange(
                                                   value as RecurrencePattern,
                                                )
                                             }
                                             value={field.state.value}
                                          >
                                             <SelectTrigger>
                                                <SelectValue placeholder="Selecione o período" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                <SelectItem value="monthly">
                                                   Mensal
                                                </SelectItem>
                                                <SelectItem value="quarterly">
                                                   Trimestral
                                                </SelectItem>
                                                <SelectItem value="semiannual">
                                                   Semestral
                                                </SelectItem>
                                                <SelectItem value="annual">
                                                   Anual
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
               </div>

               {/* Optional Details Section */}
               <Collapsible
                  onOpenChange={setIsDetailsOpen}
                  open={isDetailsOpen}
               >
                  <CollapsibleTrigger asChild>
                     <Button
                        className="w-full justify-between text-sm font-medium"
                        variant="ghost"
                     >
                        Detalhes adicionais
                        <ChevronDownIcon
                           className="h-4 w-4 transition-transform duration-200"
                           style={{
                              transform: isDetailsOpen
                                 ? "rotate(180deg)"
                                 : "rotate(0deg)",
                           }}
                        />
                     </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                     <FieldGroup>
                        <form.Field name="issueDate">
                           {(field) => {
                              const isInvalid =
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid;
                              return (
                                 <Field data-invalid={isInvalid}>
                                    <FieldLabel>
                                       {translate(
                                          "dashboard.routes.bills.features.create-bill.fields.issueDate",
                                       )}
                                    </FieldLabel>
                                    <DatePicker
                                       date={field.state.value}
                                       onSelect={(date) =>
                                          field.handleChange(date)
                                       }
                                    />
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

                     <FieldGroup>
                        <form.Field name="counterparty">
                           {(field) => {
                              const isInvalid =
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid;
                              return (
                                 <Field data-invalid={isInvalid}>
                                    <FieldLabel>
                                       {translate("common.form.name.label")}
                                    </FieldLabel>
                                    <Input
                                       onBlur={field.handleBlur}
                                       onChange={(e) =>
                                          field.handleChange(e.target.value)
                                       }
                                       placeholder={translate(
                                          "common.form.name.placeholder",
                                       )}
                                       value={field.state.value}
                                    />
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

                     <FieldGroup>
                        <form.Field name="bankAccountId">
                           {(field) => {
                              const isInvalid =
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid;
                              return (
                                 <Field data-invalid={isInvalid}>
                                    <FieldLabel>
                                       {translate(
                                          "common.form.from-account.label",
                                       )}
                                    </FieldLabel>
                                    <Select
                                       onValueChange={(value) =>
                                          field.handleChange(value)
                                       }
                                       value={field.state.value}
                                    >
                                       <SelectTrigger>
                                          <SelectValue
                                             placeholder={translate(
                                                "common.form.from-account.placeholder",
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
                                       <FieldError
                                          errors={field.state.meta.errors}
                                       />
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
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid;
                              return (
                                 <Field data-invalid={isInvalid}>
                                    <FieldLabel>
                                       {translate(
                                          "common.form.description.label",
                                       )}
                                    </FieldLabel>
                                    <Textarea
                                       onBlur={field.handleBlur}
                                       onChange={(e) =>
                                          field.handleChange(e.target.value)
                                       }
                                       placeholder={translate(
                                          "common.form.description.placeholder",
                                       )}
                                       value={field.state.value}
                                    />
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
                  </CollapsibleContent>
               </Collapsible>
            </div>

            <SheetFooter>
               <form.Subscribe>
                  {(state) => (
                     <Button
                        className="w-full"
                        disabled={
                           !state.canSubmit || state.isSubmitting || isPending
                        }
                        type="submit"
                     >
                        {state.isSubmitting || isPending
                           ? submittingText
                           : submitText}
                     </Button>
                  )}
               </form.Subscribe>
            </SheetFooter>
         </form>
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
            {content}
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
         {content}
      </Sheet>
   );
}
