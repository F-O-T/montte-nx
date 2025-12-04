import type { RouterOutput } from "@packages/api/client";
import { toast } from "sonner";

type Transaction =
   RouterOutput["transactions"]["getAllPaginated"]["transactions"][number];

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
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
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { Textarea } from "@packages/ui/components/textarea";
import { centsToReais } from "@packages/utils/money";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Landmark, Pencil, Plus, Receipt, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";

type ManageTransactionSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   transaction?: Transaction;
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

   const transactionSchema = z.object({
      amount: z.number().min(1, translate("common.validation.required")),
      bankAccountId: z.string().min(1, translate("common.validation.required")),
      categoryIds: z.array(z.string()),
      costCenterId: z.string(),
      date: z.date({ message: translate("common.validation.required") }),
      description: z.string().min(1, translate("common.validation.required")),
      tagIds: z.array(z.string()),
      type: z.enum(["expense", "income"]),
   });

   const form = useForm({
      defaultValues: {
         amount: transaction?.amount
            ? Math.round(Number(transaction.amount) * 100)
            : 0,
         bankAccountId: transaction?.bankAccountId || "",
         categoryIds:
            transaction?.transactionCategories?.map((tc) => tc.category.id) ||
            [],
         costCenterId: transaction?.costCenterId || "",
         date: transaction?.date ? new Date(transaction.date) : new Date(),
         description: transaction?.description || "",
         tagIds: transaction?.transactionTags?.map((tt) => tt.tag.id) || [],
         type: (transaction?.type === "transfer"
            ? "expense"
            : transaction?.type || "expense") as "expense" | "income",
      },
      onSubmit: async ({ value }) => {
         if (!value.amount || !value.description) {
            return;
         }

         try {
            const amountInDecimal = centsToReais(value.amount);

            if (isEditMode && transaction) {
               await updateTransactionMutation.mutateAsync({
                  data: {
                     amount: amountInDecimal,
                     bankAccountId: value.bankAccountId || undefined,
                     categoryIds: value.categoryIds || [],
                     categorySplits: null,
                     costCenterId: value.costCenterId || null,
                     date: value.date.toISOString().split("T")[0] ?? "",
                     description: value.description,
                     tagIds: value.tagIds || [],
                     type: value.type,
                  },
                  id: transaction.id,
               });
               toast.success("Transação atualizada com sucesso");
            } else {
               await createTransactionMutation.mutateAsync({
                  amount: amountInDecimal,
                  bankAccountId: value.bankAccountId || undefined,
                  categoryIds: (value.categoryIds || []) as string[],
                  costCenterId: value.costCenterId || undefined,
                  date: value.date.toISOString().split("T")[0] ?? "",
                  description: value.description,
                  tagIds: (value.tagIds || []) as string[],
                  type: value.type,
               });
               toast.success("Transação criada com sucesso");
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} transaction:`,
               error,
            );
            toast.error(
               `Falha ao ${isEditMode ? "atualizar" : "criar"} transação`,
            );
         }
      },
      validators: {
         onBlur: transactionSchema,
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

   const categoryOptions = categories.map((category) => {
      const iconName = (category.icon || "Wallet") as IconName;
      return {
         icon: <IconDisplay iconName={iconName} size={16} />,
         label: category.name,
         value: category.id,
      };
   });

   const tagOptions = tags.map((tag) => ({
      icon: <Tag className="size-4" style={{ color: tag.color }} />,
      label: tag.name,
      value: tag.id,
   }));

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

               <div className="px-4 flex-1 overflow-y-auto">
                  <Tabs className="w-full" defaultValue="details">
                     <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger className="gap-1.5" value="details">
                           <Receipt className="size-3.5" />
                           <span className="hidden sm:inline">Detalhes</span>
                        </TabsTrigger>
                        <TabsTrigger className="gap-1.5" value="categorization">
                           <FolderOpen className="size-3.5" />
                           <span className="hidden sm:inline">
                              Categorização
                           </span>
                        </TabsTrigger>
                     </TabsList>

                     <TabsContent className="space-y-4 mt-4" value="details">
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
                                             "common.form.amount.label",
                                          )}
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
                           <form.Field name="bankAccountId">
                              {(field) => {
                                 const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                 return (
                                    <Field data-invalid={isInvalid}>
                                       <FieldLabel>
                                          {translate("common.form.bank.label")}
                                       </FieldLabel>
                                       <Select
                                          onOpenChange={(open) => {
                                             if (!open) field.handleBlur();
                                          }}
                                          onValueChange={(value) =>
                                             field.handleChange(value)
                                          }
                                          value={field.state.value}
                                       >
                                          <SelectTrigger>
                                             <SelectValue
                                                placeholder={translate(
                                                   "common.form.bank.placeholder",
                                                )}
                                             />
                                          </SelectTrigger>
                                          <SelectContent>
                                             {bankAccounts.map((account) => (
                                                <SelectItem
                                                   key={account.id}
                                                   value={account.id}
                                                >
                                                   {account.name} -{" "}
                                                   {account.bank}
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
                                             field.handleChange(
                                                date || new Date(),
                                             )
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
                     </TabsContent>

                     <TabsContent
                        className="space-y-4 mt-4"
                        value="categorization"
                     >
                        <Tabs defaultValue="category">
                           <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger className="gap-1.5" value="category">
                                 <FolderOpen className="size-3.5" />
                                 <span className="hidden sm:inline">
                                    Categoria
                                 </span>
                              </TabsTrigger>
                              <TabsTrigger
                                 className="gap-1.5"
                                 value="cost-center"
                              >
                                 <Landmark className="size-3.5" />
                                 <span className="hidden sm:inline">
                                    Centro
                                 </span>
                              </TabsTrigger>
                              <TabsTrigger className="gap-1.5" value="tags">
                                 <Tag className="size-3.5" />
                                 <span className="hidden sm:inline">Tags</span>
                              </TabsTrigger>
                           </TabsList>

                           <TabsContent className="mt-4" value="category">
                              <FieldGroup>
                                 <form.Field name="categoryIds">
                                    {(field) => {
                                       const isInvalid =
                                          field.state.meta.isTouched &&
                                          !field.state.meta.isValid;

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
                                                      field.state.meta.errors
                                                   }
                                                />
                                             )}
                                          </Field>
                                       );
                                    }}
                                 </form.Field>
                              </FieldGroup>
                           </TabsContent>

                           <TabsContent className="mt-4" value="cost-center">
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
                                             value={field.state.value || "none"}
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
                                                         key={costCenter.id}
                                                         value={costCenter.id}
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
                           </TabsContent>

                           <TabsContent className="mt-4" value="tags">
                              <FieldGroup>
                                 <form.Field name="tagIds">
                                    {(field) => (
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
                                    )}
                                 </form.Field>
                              </FieldGroup>
                           </TabsContent>
                        </Tabs>
                     </TabsContent>
                  </Tabs>
               </div>

               <SheetFooter className="px-4">
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createTransactionMutation.isPending ||
                              updateTransactionMutation.isPending
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
