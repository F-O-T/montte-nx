import type { RouterOutput } from "@packages/api/client";

type Transaction =
   RouterOutput["transactions"]["getAllPaginated"]["transactions"][number];

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { DatePicker } from "@packages/ui/components/date-picker";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { MoneyInput } from "@packages/ui/components/money-input";
import { MultiSelect } from "@packages/ui/components/multi-select";
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
import { centsToReais } from "@packages/utils/money";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, Plus, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
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

   const { data: tags = [] } = useQuery(trpc.tags.getAll.queryOptions());

   const { data: costCenters = [] } = useQuery(
      trpc.costCenters.getAll.queryOptions(),
   );

   const activeBankAccounts = bankAccounts;

   const createTransactionMutation = useMutation(
      trpc.transactions.create.mutationOptions({
         onSuccess: async () => {
            await Promise.all([
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getAllPaginated.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.bankAccounts.getTransactions.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getBreakdown.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getMonthlyTrend.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getTopCategories.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getTypeDistribution.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getUsageFrequency.queryKey(),
               }),
            ]);

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
            await Promise.all([
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getAllPaginated.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.bankAccounts.getTransactions.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getBreakdown.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getMonthlyTrend.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getTopCategories.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getTypeDistribution.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getUsageFrequency.queryKey(),
               }),
            ]);

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
            await Promise.all([
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getAllPaginated.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.bankAccounts.getTransactions.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getBreakdown.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getMonthlyTrend.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getTopCategories.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getTypeDistribution.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.categories.getUsageFrequency.queryKey(),
               }),
            ]);
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
         categoryIds:
            transaction?.transactionCategories?.map((tc) => tc.category.id) ||
            [],
         costCenterId: transaction?.costCenterId || "",
         date: transaction?.date ? new Date(transaction.date) : new Date(),
         description: transaction?.description || "",
         tagIds: transaction?.transactionTags?.map((tt) => tt.tag.id) || [],
         toBankAccountId: "",
         type: (transaction?.type || "expense") as
            | "expense"
            | "income"
            | "transfer",
      },
      onSubmit: async ({ value }) => {
         if (!value.amount || !value.description) {
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
                     categoryIds: value.categoryIds || [],
                     costCenterId: value.costCenterId || null,
                     date: value.date.toISOString().split("T")[0] ?? "",
                     description: value.description,
                     tagIds: value.tagIds || [],
                     type: value.type as "income" | "expense" | "transfer",
                  },
                  id: transaction.id,
               });
            } else {
               if (value.type === "transfer") {
                  if (!value.toBankAccountId || !value.bankAccountId) return;
                  await transferTransactionMutation.mutateAsync({
                     amount: amountInDecimal,
                     date: value.date.toISOString().split("T")[0] ?? "",
                     description: value.description,
                     fromBankAccountId: value.bankAccountId,
                     toBankAccountId: value.toBankAccountId,
                  });
               } else {
                  await createTransactionMutation.mutateAsync({
                     amount: amountInDecimal,
                     bankAccountId: value.bankAccountId || undefined,
                     categoryIds: (value.categoryIds || []) as string[],
                     costCenterId: value.costCenterId || undefined,
                     date: value.date.toISOString().split("T")[0] ?? "",
                     description: value.description,
                     tagIds: (value.tagIds || []) as string[],
                     type: value.type as "income" | "expense",
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
                                                ? translate(
                                                     "common.form.from-account.label",
                                                  )
                                                : translate(
                                                     "common.form.bank.label",
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
                                                   placeholder={
                                                      type === "transfer"
                                                         ? translate(
                                                              "common.form.from-account.placeholder",
                                                           )
                                                         : translate(
                                                              "common.form.bank.placeholder",
                                                           )
                                                   }
                                                />
                                             </SelectTrigger>
                                             <SelectContent>
                                                {activeBankAccounts.map(
                                                   (account) => (
                                                      <SelectItem
                                                         key={account.id}
                                                         value={account.id}
                                                      >
                                                         {account.name} -{" "}
                                                         {account.bank}
                                                      </SelectItem>
                                                   ),
                                                )}
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
                                                {translate(
                                                   "common.form.to-account.label",
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
                                                         "common.form.to-account.placeholder",
                                                      )}
                                                   />
                                                </SelectTrigger>
                                                <SelectContent>
                                                   {activeBankAccounts.map(
                                                      (account) => (
                                                         <SelectItem
                                                            disabled={
                                                               account.id ===
                                                               form.getFieldValue(
                                                                  "bankAccountId",
                                                               )
                                                            }
                                                            key={account.id}
                                                            value={account.id}
                                                         >
                                                            {account.name} -{" "}
                                                            {account.bank}
                                                         </SelectItem>
                                                      ),
                                                   )}
                                                </SelectContent>
                                             </Select>
                                             {isInvalid && (
                                                <FieldError
                                                   errors={
                                                      field.state.meta.errors
                                                   }
                                                />
                                             )}
                                          </Field>
                                       );
                                    }}
                                 </form.Field>
                              </FieldGroup>
                           )}

                           {type !== "transfer" && (
                              <Collapsible className="space-y-2">
                                 <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-180">
                                    <ChevronDown className="size-4 transition-transform duration-200" />
                                    {translate(
                                       "common.form.advanced-options.label",
                                    )}
                                 </CollapsibleTrigger>
                                 <CollapsibleContent className="space-y-4">
                                    <FieldGroup>
                                       <form.Field name="categoryIds">
                                          {(field) => {
                                             const isInvalid =
                                                field.state.meta.isTouched &&
                                                !field.state.meta.isValid;

                                             const categoryOptions =
                                                categories.map((category) => {
                                                   const iconName =
                                                      (category.icon ||
                                                         "Wallet") as IconName;
                                                   return {
                                                      icon: (
                                                         <IconDisplay
                                                            iconName={iconName}
                                                            size={16}
                                                         />
                                                      ),
                                                      label: category.name,
                                                      value: category.id,
                                                   };
                                                });

                                             return (
                                                <Field data-invalid={isInvalid}>
                                                   <FieldLabel>
                                                      {translate(
                                                         "common.form.category.label",
                                                      )}
                                                   </FieldLabel>
                                                   <MultiSelect
                                                      className="flex-1"
                                                      emptyMessage={translate(
                                                         "common.form.search.no-results",
                                                      )}
                                                      onChange={(val) =>
                                                         field.handleChange(val)
                                                      }
                                                      options={categoryOptions}
                                                      placeholder={translate(
                                                         "common.form.category.placeholder",
                                                      )}
                                                      selected={
                                                         (field.state
                                                            .value as unknown as string[]) ||
                                                         []
                                                      }
                                                   />
                                                   {isInvalid && (
                                                      <FieldError
                                                         errors={
                                                            field.state.meta
                                                               .errors
                                                         }
                                                      />
                                                   )}
                                                </Field>
                                             );
                                          }}
                                       </form.Field>
                                    </FieldGroup>

                                    <FieldGroup>
                                       <form.Field name="tagIds">
                                          {(field) => {
                                             const tagOptions = tags.map(
                                                (tag) => ({
                                                   icon: (
                                                      <Tag
                                                         className="size-4"
                                                         style={{
                                                            color: tag.color,
                                                         }}
                                                      />
                                                   ),
                                                   label: tag.name,
                                                   value: tag.id,
                                                }),
                                             );

                                             return (
                                                <Field>
                                                   <FieldLabel>
                                                      {translate(
                                                         "common.form.tags.label",
                                                      )}
                                                   </FieldLabel>
                                                   <MultiSelect
                                                      className="flex-1"
                                                      emptyMessage={translate(
                                                         "common.form.search.no-results",
                                                      )}
                                                      onChange={(val) =>
                                                         field.handleChange(val)
                                                      }
                                                      options={tagOptions}
                                                      placeholder={translate(
                                                         "common.form.tags.placeholder",
                                                      )}
                                                      selected={
                                                         (field.state
                                                            .value as unknown as string[]) ||
                                                         []
                                                      }
                                                   />
                                                </Field>
                                             );
                                          }}
                                       </form.Field>
                                    </FieldGroup>

                                    <FieldGroup>
                                       <form.Field name="costCenterId">
                                          {(field) => (
                                             <Field>
                                                <FieldLabel>
                                                   {translate(
                                                      "common.form.cost-center.label",
                                                   )}
                                                </FieldLabel>
                                                <Select
                                                   onValueChange={(value) =>
                                                      field.handleChange(
                                                         value === "none"
                                                            ? ""
                                                            : value,
                                                      )
                                                   }
                                                   value={
                                                      field.state.value ||
                                                      "none"
                                                   }
                                                >
                                                   <SelectTrigger>
                                                      <SelectValue
                                                         placeholder={translate(
                                                            "common.form.cost-center.placeholder",
                                                         )}
                                                      />
                                                   </SelectTrigger>
                                                   <SelectContent>
                                                      <SelectItem value="none">
                                                         {translate(
                                                            "common.form.cost-center.none",
                                                         )}
                                                      </SelectItem>
                                                      {costCenters.map(
                                                         (costCenter) => (
                                                            <SelectItem
                                                               key={
                                                                  costCenter.id
                                                               }
                                                               value={
                                                                  costCenter.id
                                                               }
                                                            >
                                                               {costCenter.name}
                                                               {costCenter.code &&
                                                                  ` (${costCenter.code})`}
                                                            </SelectItem>
                                                         ),
                                                      )}
                                                   </SelectContent>
                                                </Select>
                                             </Field>
                                          )}
                                       </form.Field>
                                    </FieldGroup>
                                 </CollapsibleContent>
                              </Collapsible>
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
                                          value as
                                             | "expense"
                                             | "income"
                                             | "transfer",
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
