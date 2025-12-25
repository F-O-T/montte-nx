import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
   Field,
   FieldDescription,
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
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { defineStepper } from "@packages/ui/components/stepper";
import { Textarea } from "@packages/ui/components/textarea";

const steps = [
   { id: "details", title: "details" },
   { id: "categorization", title: "categorization" },
] as const;

const { Stepper } = defineStepper(...steps);

import { getRandomColor } from "@packages/utils/colors";
import { formatDate } from "@packages/utils/date";
import { centsToReais } from "@packages/utils/money";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, Tag, XCircle } from "lucide-react";
import {
   type FormEvent,
   useCallback,
   useEffect,
   useMemo,
   useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type Transaction =
   RouterOutput["transactions"]["getAllPaginated"]["transactions"][number];

type TransactionFormValues = {
   amount: number;
   bankAccountId: string;
   categoryIds: string[];
   costCenterId: string;
   date: Date;
   description: string;
   tagIds: string[];
   type: "expense" | "income";
};

type ManageTransactionFormProps = {
   transaction?: Transaction;
   defaultCategoryIds?: string[];
   defaultCostCenterId?: string;
   defaultTagIds?: string[];
};

export function ManageTransactionForm({
   transaction,
   defaultCategoryIds = [],
   defaultCostCenterId = "",
   defaultTagIds = [],
}: ManageTransactionFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const isEditMode = !!transaction;

   const [budgetImpactParams, setBudgetImpactParams] = useState<{
      amount: number;
      categoryIds: string[];
      tagIds: string[];
      costCenterId: string;
   } | null>(null);

   const [watchedValues, setWatchedValues] = useState<{
      amount: number;
      categoryIds: string[];
      tagIds: string[];
      costCenterId: string;
      type: string;
   } | null>(null);

   useEffect(() => {
      if (!watchedValues) return;

      const shouldUpdate =
         watchedValues.type === "expense" &&
         watchedValues.amount > 0 &&
         (watchedValues.categoryIds.length > 0 ||
            watchedValues.tagIds.length > 0 ||
            !!watchedValues.costCenterId);

      const newParams = shouldUpdate
         ? {
              amount: centsToReais(watchedValues.amount),
              categoryIds: watchedValues.categoryIds || [],
              costCenterId: watchedValues.costCenterId || "",
              tagIds: watchedValues.tagIds || [],
           }
         : null;

      setBudgetImpactParams(newParams);
   }, [watchedValues]);

   const modeTexts = useMemo(() => {
      if (isEditMode) {
         return {
            description: translate(
               "dashboard.routes.transactions.features.edit.description",
            ),
            title: translate(
               "dashboard.routes.transactions.features.edit.title",
            ),
         };
      }

      return {
         description: translate(
            "dashboard.routes.transactions.features.add-new.description",
         ),
         title: translate(
            "dashboard.routes.transactions.features.add-new.title",
         ),
      };
   }, [isEditMode]);

   // Determine the initial transaction type for category filtering
   const initialTransactionType = useMemo(() => {
      if (transaction?.type === "transfer") return "expense";
      if (transaction?.type) return transaction.type as "expense" | "income";
      return "expense";
   }, [transaction?.type]);

   const [currentTransactionType, setCurrentTransactionType] = useState<
      "expense" | "income"
   >(initialTransactionType);

   const { data: categories = [] } = useQuery(
      trpc.categories.getByTransactionType.queryOptions({
         type: currentTransactionType,
      }),
   );

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const { data: tags = [] } = useQuery(trpc.tags.getAll.queryOptions());

   const { data: costCenters = [] } = useQuery(
      trpc.costCenters.getAll.queryOptions(),
   );

   const createTransactionMutation = useMutation(
      trpc.transactions.create.mutationOptions(),
   );

   const updateTransactionMutation = useMutation(
      trpc.transactions.update.mutationOptions(),
   );

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions(),
   );

   const createCostCenterMutation = useMutation(
      trpc.costCenters.create.mutationOptions(),
   );

   const createTagMutation = useMutation(trpc.tags.create.mutationOptions());

   const isCreating =
      createCategoryMutation.isPending ||
      createCostCenterMutation.isPending ||
      createTagMutation.isPending;

   const isMutating =
      createTransactionMutation.isPending ||
      updateTransactionMutation.isPending;

   const descriptionSchema = z.string().min(1, translate("common.validation.required"));
   const amountSchema = z.number().min(1, translate("common.validation.required"));
   const bankAccountIdSchema = z.string().min(1, translate("common.validation.required"));
   const dateSchema = z.date({ message: translate("common.validation.required") });

   const handleCreateTransaction = useCallback(
      async (values: TransactionFormValues, resetForm: () => void) => {
         const amountInDecimal = centsToReais(values.amount);

         await createTransactionMutation.mutateAsync({
            amount: amountInDecimal,
            bankAccountId: values.bankAccountId || undefined,
            categoryIds: values.categoryIds || [],
            costCenterId: values.costCenterId || undefined,
            date: formatDate(values.date, "YYYY-MM-DD"),
            description: values.description,
            tagIds: values.tagIds || [],
            type: values.type,
         });

         toast.success(
            translate(
               "dashboard.routes.transactions.notifications.create-success",
            ),
         );
         resetForm();
         setBudgetImpactParams(null);
         closeSheet();
      },
      [createTransactionMutation, closeSheet],
   );

   const handleUpdateTransaction = useCallback(
      async (values: TransactionFormValues) => {
         if (!transaction) return;

         const amountInDecimal = centsToReais(values.amount);

         await updateTransactionMutation.mutateAsync({
            data: {
               amount: amountInDecimal,
               bankAccountId: values.bankAccountId || undefined,
               categoryIds: values.categoryIds || [],
               categorySplits: null,
               costCenterId: values.costCenterId || null,
               date: formatDate(values.date, "YYYY-MM-DD"),
               description: values.description,
               tagIds: values.tagIds || [],
               type: values.type,
            },
            id: transaction.id,
         });

         toast.success(
            translate(
               "dashboard.routes.transactions.notifications.update-success",
            ),
         );
         closeSheet();
      },
      [transaction, updateTransactionMutation, closeSheet],
   );

   const form = useForm({
      defaultValues: {
         amount: transaction?.amount
            ? Math.round(Number(transaction.amount) * 100)
            : 0,
         bankAccountId: transaction?.bankAccountId || "",
         categoryIds:
            transaction?.transactionCategories?.map((tc) => tc.category.id) ||
            defaultCategoryIds,
         costCenterId: transaction?.costCenterId || defaultCostCenterId,
         date: transaction?.date ? new Date(transaction.date) : new Date(),
         description: transaction?.description || "",
         tagIds:
            transaction?.transactionTags?.map((tt) => tt.tag.id) ||
            defaultTagIds,
         type: (transaction?.type === "transfer"
            ? "expense"
            : transaction?.type || "expense") as "expense" | "income",
      },
      onSubmit: async ({ value, formApi }) => {
         if (!value.amount || !value.description) {
            return;
         }

         try {
            if (isEditMode) {
               await handleUpdateTransaction(value);
            } else {
               await handleCreateTransaction(value, () => formApi.reset());
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} transaction:`,
               error,
            );
            toast.error(
               translate(
                  isEditMode
                     ? "dashboard.routes.transactions.notifications.update-error"
                     : "dashboard.routes.transactions.notifications.create-error",
               ),
            );
         }
      },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   const handleCreateCategory = useCallback(
      async (name: string) => {
         try {
            const transactionType = form.getFieldValue("type");
            const data = await createCategoryMutation.mutateAsync({
               color: getRandomColor(),
               name,
               transactionTypes: [transactionType],
            });

            if (!data) return;

            form.setFieldValue("categoryIds", [
               ...form.getFieldValue("categoryIds"),
               data.id,
            ]);

            toast.success(`Categoria "${data.name}" criada`);
         } catch (error) {
            toast.error((error as Error).message || "Falha ao criar categoria");
         }
      },
      [createCategoryMutation, form],
   );

   const handleCreateCostCenter = useCallback(
      async (name: string) => {
         try {
            const data = await createCostCenterMutation.mutateAsync({ name });

            if (!data) return;

            form.setFieldValue("costCenterId", data.id);
            toast.success(`Centro de custo "${data.name}" criado`);
         } catch (error) {
            toast.error(
               (error as Error).message || "Falha ao criar centro de custo",
            );
         }
      },
      [createCostCenterMutation, form],
   );

   const handleCreateTag = useCallback(
      async (name: string) => {
         try {
            const data = await createTagMutation.mutateAsync({
               color: getRandomColor(),
               name,
            });

            if (!data) return;

            form.setFieldValue("tagIds", [
               ...form.getFieldValue("tagIds"),
               data.id,
            ]);

            toast.success(`Tag "${data.name}" criada`);
         } catch (error) {
            toast.error((error as Error).message || "Falha ao criar tag");
         }
      },
      [createTagMutation, form],
   );

   const shouldCheckBudgetImpact =
      budgetImpactParams !== null &&
      budgetImpactParams.amount > 0 &&
      (budgetImpactParams.categoryIds.length > 0 ||
         budgetImpactParams.tagIds.length > 0 ||
         !!budgetImpactParams.costCenterId);

   const { data: budgetImpactWarnings = [] } = useQuery({
      ...trpc.budgets.checkBudgetImpact.queryOptions({
         amount: budgetImpactParams?.amount ?? 0,
         categoryIds:
            budgetImpactParams?.categoryIds &&
            budgetImpactParams.categoryIds.length > 0
               ? budgetImpactParams.categoryIds
               : undefined,
         costCenterId: budgetImpactParams?.costCenterId || undefined,
         excludeTransactionId: transaction?.id,
         tagIds:
            budgetImpactParams?.tagIds && budgetImpactParams.tagIds.length > 0
               ? budgetImpactParams.tagIds
               : undefined,
      }),
      enabled: shouldCheckBudgetImpact,
   });

   const categoryOptions = useMemo(
      () =>
         categories.map((category) => {
            const iconName = (category.icon || "Wallet") as IconName;
            return {
               icon: <IconDisplay iconName={iconName} size={16} />,
               label: category.name,
               value: category.id,
            };
         }),
      [categories],
   );

   const tagOptions = useMemo(
      () =>
         tags.map((tag) => ({
            icon: <Tag className="size-4" style={{ color: tag.color }} />,
            label: tag.name,
            value: tag.id,
         })),
      [tags],
   );

   const costCenterOptions = useMemo(
      () => [
         { label: translate("common.form.cost-center.none"), value: "" },
         ...costCenters.map((cc) => ({
            label: cc.code ? `${cc.name} (${cc.code})` : cc.name,
            value: cc.id,
         })),
      ],
      [costCenters],
   );

   function DetailsStep() {
      return (
         <div className="space-y-4">
            <FieldGroup>
               <form.Field 
                  name="description"
                  validators={{
                     onBlur: descriptionSchema,
                  }}
               >
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

            <FieldGroup>
               <form.Field 
                  name="amount"
                  validators={{
                     onBlur: amountSchema,
                  }}
               >
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
                              valueInCents={true}
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
               <form.Field 
                  name="bankAccountId"
                  validators={{
                     onBlur: bankAccountIdSchema,
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
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
                              <SelectTrigger id={field.name}>
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
                              onValueChange={(value) => {
                                 const typedValue = value as
                                    | "expense"
                                    | "income";
                                 field.handleChange(typedValue);
                                 setCurrentTransactionType(typedValue);
                              }}
                              value={field.state.value}
                           >
                              <SelectTrigger id={field.name}>
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
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field 
                  name="date"
                  validators={{
                     onBlur: dateSchema,
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
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

   function CategorizationStep() {
      return (
         <div className="space-y-4">
            <FieldGroup>
               <form.Field name="categoryIds">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.category.label")}
                           </FieldLabel>
                           <MultiSelect
                              className="flex-1"
                              createLabel={translate(
                                 "common.form.category.create",
                              )}
                              emptyMessage={translate(
                                 "common.form.search.no-results",
                              )}
                              onChange={(val) => field.handleChange(val)}
                              onCreate={handleCreateCategory}
                              options={categoryOptions}
                              placeholder={translate(
                                 "common.form.category.placeholder",
                              )}
                              selected={field.state.value || []}
                           />
                           <FieldDescription>
                              {translate("common.form.category.description")}
                           </FieldDescription>
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="costCenterId">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           {translate("common.form.cost-center.label")}
                        </FieldLabel>
                        <Combobox
                           className="w-full justify-between"
                           createLabel={translate(
                              "common.form.cost-center.create",
                           )}
                           disabled={isCreating}
                           emptyMessage={translate(
                              "common.form.search.no-results",
                           )}
                           onCreate={handleCreateCostCenter}
                           onValueChange={(value) => field.handleChange(value)}
                           options={costCenterOptions}
                           placeholder={translate(
                              "common.form.cost-center.placeholder",
                           )}
                           searchPlaceholder={translate(
                              "common.form.search.label",
                           )}
                           value={field.state.value}
                        />
                        <FieldDescription>
                           {translate("common.form.cost-center.description")}
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="tagIds">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           {translate("common.form.tags.label")}
                        </FieldLabel>
                        <MultiSelect
                           className="flex-1"
                           createLabel={translate("common.form.tags.create")}
                           emptyMessage={translate(
                              "common.form.search.no-results",
                           )}
                           onChange={(val) => field.handleChange(val)}
                           onCreate={handleCreateTag}
                           options={tagOptions}
                           placeholder={translate(
                              "common.form.tags.placeholder",
                           )}
                           selected={field.state.value || []}
                        />
                        <FieldDescription>
                           {translate("common.form.tags.description")}
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>

            <form.Subscribe
               selector={(state) => ({
                  amount: state.values.amount,
                  categoryIds: state.values.categoryIds,
                  costCenterId: state.values.costCenterId,
                  tagIds: state.values.tagIds,
                  type: state.values.type,
               })}
            >
               {(values) => {
                  if (
                     JSON.stringify(values) !== JSON.stringify(watchedValues)
                  ) {
                     setWatchedValues(values);
                  }
                  return null;
               }}
            </form.Subscribe>

            {budgetImpactWarnings.length > 0 && (
               <div className="space-y-2">
                  {budgetImpactWarnings.map((warning) => {
                     const Icon =
                        warning.severity === "danger"
                           ? XCircle
                           : warning.severity === "warning"
                             ? AlertTriangle
                             : Info;
                     const variant =
                        warning.severity === "danger"
                           ? "destructive"
                           : warning.severity === "warning"
                             ? "default"
                             : "default";

                     return (
                        <Alert key={warning.budgetId} variant={variant}>
                           <Icon className="size-4" />
                           <AlertTitle>{warning.budgetName}</AlertTitle>
                           <AlertDescription>
                              {warning.message}
                           </AlertDescription>
                        </Alert>
                     );
                  })}
               </div>
            )}
         </div>
      );
   }

   return (
      <Stepper.Provider className="h-full">
         {({ methods }) => (
            <form className="h-full flex flex-col" onSubmit={handleSubmit}>
               <SheetHeader>
                  <SheetTitle>{modeTexts.title}</SheetTitle>
                  <SheetDescription>{modeTexts.description}</SheetDescription>
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
                     categorization: () => <CategorizationStep />,
                     details: () => <DetailsStep />,
                  })}
               </div>

               <SheetFooter className="px-4">
                  <Stepper.Controls className="flex flex-col w-full gap-2">
                     {methods.isFirst ? (
                        <Button
                           className="w-full"
                           onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              await form.validateAllFields("blur");

                              if (form.state.canSubmit) {
                                 methods.next();
                              }
                           }}
                           type="button"
                        >
                           {translate("common.actions.next")}
                        </Button>
                     ) : (
                        <form.Subscribe
                           selector={(state) => ({
                              canSubmit: state.canSubmit,
                              categoryIds: state.values.categoryIds,
                              costCenterId: state.values.costCenterId,
                              isSubmitting: state.isSubmitting,
                              tagIds: state.values.tagIds,
                           })}
                        >
                           {({
                              canSubmit,
                              categoryIds,
                              costCenterId,
                              isSubmitting,
                              tagIds,
                           }) => {
                              const hasAnyCategorization =
                                 categoryIds.length > 0 ||
                                 tagIds.length > 0 ||
                                 !!costCenterId;

                              return (
                                 <>
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
                                    {hasAnyCategorization ? (
                                       <Button
                                          className="w-full"
                                          disabled={
                                             !canSubmit ||
                                             isSubmitting ||
                                             isCreating ||
                                             isMutating
                                          }
                                          type="submit"
                                       >
                                          {translate("common.actions.submit")}
                                       </Button>
                                    ) : (
                                       <Button
                                          className="w-full"
                                          disabled={
                                             !canSubmit ||
                                             isSubmitting ||
                                             isMutating
                                          }
                                          type="submit"
                                          variant="outline"
                                       >
                                          {translate("common.actions.skip")}
                                       </Button>
                                    )}
                                 </>
                              );
                           }}
                        </form.Subscribe>
                     )}
                  </Stepper.Controls>
               </SheetFooter>
            </form>
         )}
      </Stepper.Provider>
   );
}
