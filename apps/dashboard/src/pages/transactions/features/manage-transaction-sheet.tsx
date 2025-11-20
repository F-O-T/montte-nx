import type { Transaction } from "@packages/database/repositories/transaction-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { DatePicker } from "@packages/ui/components/date-picker";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { MoneyInput } from "@packages/ui/components/money-input";
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
import { reaisToCents, centsToReais } from "@packages/utils/money";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";

type ManageTransactionSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   transaction?: Transaction; // If provided, edit mode. If not, create mode
   asChild?: boolean;
};

export function ManageTransactionSheet({
   onOpen,
   onOpenChange,
   transaction,
   asChild = false,
}: ManageTransactionSheetProps) {
   const queryClient = useQueryClient();
   const isEditMode = !!transaction;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.transactions.features.add-new.description",
         ),
         title: translate(
            "dashboard.routes.transactions.features.add-new.title",
         ),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.transactions.features.edit.description",
         ),
         title: translate("dashboard.routes.transactions.features.edit.title"),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   // For asChild usage, manage internal state
   const [internalOpen, setInternalOpen] = useState(false);
   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const activeBankAccounts = bankAccounts.filter(
      (account) => account.status === "active",
   );

   const createTransactionMutation = useMutation(
      trpc.transactions.create.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAllPaginated.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getTransactions.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const updateTransactionMutation = useMutation(
      trpc.transactions.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update transaction:", error);
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAllPaginated.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getTransactions.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const transferTransactionMutation = useMutation(
      trpc.transactions.transfer.mutationOptions({
         onError: (error) => {
            console.error("Failed to create transfer:", error);
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAllPaginated.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getTransactions.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         amount: transaction?.amount
            ? Math.round(Number(transaction.amount) * 100)
            : 0, // Store as cents
         bankAccountId: transaction?.bankAccountId || "",
         toBankAccountId: "",
         category: transaction?.category || "",
         date: transaction?.date ? new Date(transaction.date) : new Date(),
         description: transaction?.description || "",
         type: transaction?.type || ("expense" as "expense" | "income" | "transfer"),
      },
      onSubmit: async ({ value }) => {
         if (!value.amount || !value.description) {
             return;
         }

         if (value.type !== "transfer" && !value.category) {
             return;
         }

         try {
            // Convert cents back to decimal for database
            const amountInDecimal = centsToReais(value.amount);

            if (isEditMode && transaction) {
               await updateTransactionMutation.mutateAsync({
                  data: {
                     amount: amountInDecimal,
                     bankAccountId: value.bankAccountId || undefined,
                     category: value.category,
                     date: value.date.toISOString().split("T")[0],
                     description: value.description,
                     type: value.type,
                  },
                  id: transaction.id,
               });
            } else {
               if (value.type === "transfer") {
                  if (!value.toBankAccountId || !value.bankAccountId) return;
                  await transferTransactionMutation.mutateAsync({
                     amount: amountInDecimal,
                     fromBankAccountId: value.bankAccountId,
                     toBankAccountId: value.toBankAccountId,
                     date: value.date.toISOString().split("T")[0],
                     description: value.description,
                  });
               } else {
                   if (!value.category) return;
                  await createTransactionMutation.mutateAsync({
                     amount: amountInDecimal,
                     bankAccountId: value.bankAccountId || undefined,
                     category: value.category,
                     date: value.date.toISOString().split("T")[0],
                     description: value.description,
                     type: value.type,
                  });
               }
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} transaction:`,
               error,
            );
         }
      },
   });

   const TriggerComponent = asChild ? (
      <DropdownMenuItem
         className="flex items-center gap-2"
         onSelect={(e) => {
            e.preventDefault();
            setIsOpen?.(true);
         }}
      >
         {isEditMode ? (
            <>
               <Pencil className="size-4" />
               {translate("dashboard.routes.transactions.features.edit.title")}
            </>
         ) : (
            <>
               <Plus className="size-4" />
               {translate(
                  "dashboard.routes.transactions.features.add-new.title",
               )}
            </>
         )}
      </DropdownMenuItem>
   ) : null;

   return (
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
         {asChild && <SheetTrigger asChild>{TriggerComponent}</SheetTrigger>}
         <SheetContent>
            <form
               className="h-full flex flex-col"
               onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
               }}
            >
               <SheetHeader>
                  <SheetTitle>{modeTexts.title}</SheetTitle>
                  <SheetDescription>{modeTexts.description}</SheetDescription>
               </SheetHeader>
               <div className="grid gap-4 px-4">
                  <FieldGroup>
                     <form.Field name="description">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate("common.form.description.label")}
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
                                    value={field.state.value}
                                    onChange={(value) => {
                                       field.handleChange(value || 0);
                                    }}
                                    onBlur={field.handleBlur}
                                    placeholder="0,00"
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

                  <form.Subscribe selector={(state) => state.values.type}>
                    {(type) => (
                        <>
                         <FieldGroup>
                             <form.Field name="bankAccountId">
                                {(field) => {
                                   const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;
                                   return (
                                      <Field data-invalid={isInvalid}>
                                         <FieldLabel>
                                            {type === "transfer" 
                                                ? translate("common.form.from-account.label")
                                                : translate("common.form.bank.label")}
                                         </FieldLabel>
                                         <Select
                                            onValueChange={(value) =>
                                               field.handleChange(value)
                                            }
                                            value={field.state.value}
                                         >
                                            <SelectTrigger>
                                               <SelectValue
                                                  placeholder={type === "transfer"
                                                    ? translate("common.form.from-account.placeholder")
                                                    : translate("common.form.bank.placeholder")}
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

                          {type === "transfer" && (
                            <FieldGroup>
                                <form.Field name="toBankAccountId">
                                    {(field) => {
                                    const isInvalid =
                                        field.state.meta.isTouched &&
                                        !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel>
                                                {translate("common.form.to-account.label")}
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
                                                        "common.form.to-account.placeholder",
                                                    )}
                                                />
                                                </SelectTrigger>
                                                <SelectContent>
                                                {activeBankAccounts.map((account) => (
                                                    <SelectItem
                                                        key={account.id}
                                                        value={account.id}
                                                        disabled={account.id === form.getFieldValue("bankAccountId")}
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
                          )}

                          {type !== "transfer" && (
                              <FieldGroup>
                                 <form.Field name="category">
                                    {(field) => {
                                       const isInvalid =
                                          field.state.meta.isTouched &&
                                          !field.state.meta.isValid;
            
                                       const categoryOptions = categories.map(
                                          (category) => ({
                                             label: category.name,
                                             value: category.name,
                                             icon: category.icon,
                                          }),
                                       );
            
                                       return (
                                          <Field data-invalid={isInvalid}>
                                             <FieldLabel>
                                                {translate("common.form.category.label")}
                                             </FieldLabel>
                                             <Combobox
                                                className="flex-1"
                                                emptyMessage={translate(
                                                   "common.form.search.no-results",
                                                )}
                                                onValueChange={field.handleChange}
                                                options={categoryOptions.map((opt) => ({
                                                   label: (
                                                      <div className="flex items-center gap-2">
                                                         <IconDisplay
                                                            iconName={opt.icon}
                                                            size={16}
                                                         />
                                                         <span>{opt.label}</span>
                                                      </div>
                                                   ),
                                                   value: opt.value,
                                                }))}
                                                placeholder={translate(
                                                   "common.form.category.placeholder",
                                                )}
                                                searchPlaceholder={translate(
                                                   "common.form.search.label",
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
                          )}
                        </>
                    )}
                  </form.Subscribe>

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
                                          value as "expense" | "income" | "transfer",
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
                                             "dashboard.routes.transactions.list-section.types.expense",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="income">
                                          {translate(
                                             "dashboard.routes.transactions.list-section.types.income",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="transfer">
                                          {translate(
                                             "dashboard.routes.transactions.list-section.types.transfer",
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
                     <form.Field name="date">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate("common.form.date.label")}
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           );
                        }}
                     </form.Field>
                  </FieldGroup>
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createTransactionMutation.isPending ||
                              updateTransactionMutation.isPending ||
                              transferTransactionMutation.isPending
                           }
                           type="submit"
                        >
                           {modeTexts.title}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
