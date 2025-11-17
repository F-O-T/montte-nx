import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import type { RecurrencePattern } from "@packages/utils/recurrence";
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
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";

type EditBillSheetProps = {
   bill: Bill;
   onOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function EditBillSheet({
   bill,
   onOpen,
   onOpenChange,
}: EditBillSheetProps) {
   const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
   const queryClient = useQueryClient();

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const activeBankAccounts = bankAccounts.filter(
      (account) => account.status === "active",
   );

   const updateBillMutation = useMutation(
      trpc.bills.update.mutationOptions({
         onError: (error) => {
            toast.error(
               error.message || translate("dashboard.routes.bills.edit.error"),
            );
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getAll.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getStats.queryKey(),
            });
            toast.success(translate("dashboard.routes.bills.edit.success"));
            onOpenChange(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         amount: bill.amount,
         bankAccountId: bill.bankAccountId || undefined,
         category: bill.category,
         counterparty: bill.counterparty || "",
         description: bill.description,
         dueDate: bill.dueDate ? new Date(bill.dueDate) : new Date(),
         issueDate: bill.issueDate ? new Date(bill.issueDate) : new Date(),
         notes: bill.notes || "",
         type: bill.type as "expense" | "income",
         isRecurring: bill.isRecurring || false,
         recurrencePattern: bill.recurrencePattern as RecurrencePattern | undefined,
      },
      onSubmit: async ({ value }) => {
         if (!value.amount || !value.category || !value.description) {
            return;
         }
         try {
            await updateBillMutation.mutateAsync({
               data: {
                  amount: parseFloat(value.amount),
                  bankAccountId: value.bankAccountId || undefined,
                  category: value.category as string,
                  counterparty: value.counterparty || undefined,
                  description: value.description,
                  dueDate: value.dueDate.toISOString().split("T")[0],
                  issueDate: value.issueDate.toISOString().split("T")[0],
                  notes: value.notes || undefined,
                  type: value.type,
                  isRecurring: value.isRecurring,
                  recurrencePattern: value.isRecurring ? value.recurrencePattern : undefined,
               },
               id: bill.id,
            });
         } catch (error) {
            console.error("Failed to update bill:", error);
         }
      },
   });

   return (
      <Sheet onOpenChange={onOpenChange} open={onOpen}>
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
                  <SheetTitle>
                     {translate("dashboard.routes.bills.edit.title")}
                  </SheetTitle>
                  <SheetDescription>
                     {translate("dashboard.routes.bills.edit.description")}
                  </SheetDescription>
               </SheetHeader>

               <div className="grid gap-4 px-4">
                  <FieldGroup>
                     <form.Field name="type">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.bills.create.fields.type",
                                    )}
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
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="expense">
                                          {translate(
                                             "dashboard.routes.bills.create.types.expense",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="income">
                                          {translate(
                                             "dashboard.routes.bills.create.types.income",
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
                                    {translate(
                                       "dashboard.routes.bills.create.fields.description",
                                    )}
                                 </FieldLabel>
                                 <Textarea
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.bills.create.placeholders.description",
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
                                    {translate(
                                       "dashboard.routes.bills.create.fields.amount",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder="0.00"
                                    step="0.01"
                                    type="number"
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
                     <form.Field name="category">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;

                           const selectedCategory = categories.find(
                              (category) => category.name === field.state.value,
                           );

                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.bills.create.fields.category",
                                    )}
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
                                                   "dashboard.routes.bills.create.placeholders.category",
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
                                                "dashboard.routes.bills.create.placeholders.searchCategory",
                                             )}
                                          />
                                          <CommandList>
                                             <CommandEmpty>
                                                {translate(
                                                   "dashboard.routes.bills.create.noCategoryFound",
                                                )}
                                             </CommandEmpty>
                                             <CommandGroup>
                                                {categories.map((category) => (
                                                   <CommandItem
                                                      key={category.id}
                                                      onSelect={() => {
                                                         field.handleChange(
                                                            category.name ===
                                                               field.state.value
                                                               ? ""
                                                               : category.name,
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
                                                         category.name && (
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
                     <form.Field name="counterparty">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.bills.create.fields.counterparty",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.bills.create.placeholders.counterparty",
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
                     <form.Field name="dueDate">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.bills.create.fields.dueDate",
                                    )}
                                 </FieldLabel>
                                 <DatePicker
                                    date={field.state.value}
                                    onSelect={(date) =>
                                       field.handleChange(date || new Date())
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.bills.create.placeholders.dueDate",
                                    )}
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
                     <form.Field name="issueDate">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.bills.create.fields.issueDate",
                                    )}
                                 </FieldLabel>
                                 <DatePicker
                                    date={field.state.value}
                                    onSelect={(date) =>
                                       field.handleChange(date || new Date())
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.bills.create.placeholders.issueDate",
                                    )}
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
                                       "dashboard.routes.bills.create.fields.bankAccount",
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
                                             "dashboard.routes.bills.create.placeholders.bankAccount",
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
                                       "dashboard.routes.bills.create.fields.notes",
                                    )}
                                 </FieldLabel>
                                 <Textarea
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.bills.create.placeholders.notes",
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
                     <form.Field name="isRecurring">
                        {(field) => {
                           return (
                              <div className="flex items-center space-x-2">
                                 <Checkbox
                                    id="isRecurring"
                                    checked={field.state.value}
                                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                                 />
                                 <label
                                    htmlFor="isRecurring"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                 >
                                    Conta recorrente
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
                                       field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                       <Field data-invalid={isInvalid}>
                                          <FieldLabel>
                                             Padrão de recorrência
                                          </FieldLabel>
                                          <Select
                                             onValueChange={(value) =>
                                                field.handleChange(value as RecurrencePattern)
                                             }
                                             value={field.state.value}
                                          >
                                             <SelectTrigger>
                                                <SelectValue placeholder="Selecione o período" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                <SelectItem value="semiannual">Semestral</SelectItem>
                                                <SelectItem value="annual">Anual</SelectItem>
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
                        )
                     }
                  </form.Subscribe>
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              updateBillMutation.isPending
                           }
                           type="submit"
                        >
                           {state.isSubmitting || updateBillMutation.isPending
                              ? translate(
                                   "dashboard.routes.bills.edit.updating",
                                )
                              : translate("dashboard.routes.bills.edit.submit")}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
