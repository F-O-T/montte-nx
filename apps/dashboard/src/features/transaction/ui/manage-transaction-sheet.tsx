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
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
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
import { centsToReais } from "@packages/utils/money";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, Pencil, Plus, Tag, XCircle } from "lucide-react";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";

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

const CATEGORY_COLORS = [
   "#ef4444",
   "#f97316",
   "#f59e0b",
   "#eab308",
   "#84cc16",
   "#22c55e",
   "#10b981",
   "#14b8a6",
   "#06b6d4",
   "#0ea5e9",
   "#3b82f6",
   "#6366f1",
   "#8b5cf6",
   "#a855f7",
   "#d946ef",
   "#ec4899",
   "#f43f5e",
];

function getRandomColor(): string {
   const index = Math.floor(Math.random() * CATEGORY_COLORS.length);
   return CATEGORY_COLORS[index] ?? "#3b82f6";
}

const steps = [
   { id: "details", title: "details" },
   { id: "categorization", title: "categorization" },
] as const;

const { Stepper } = defineStepper(...steps);

type ManageTransactionSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   transaction?: Transaction;
   asChild?: boolean;
   defaultCategoryIds?: string[];
   defaultCostCenterId?: string;
   defaultTagIds?: string[];
};

export function ManageTransactionSheet({
   onOpen,
   onOpenChange,
   transaction,
   asChild = false,
   defaultCategoryIds = [],
   defaultCostCenterId = "",
   defaultTagIds = [],
}: ManageTransactionSheetProps) {
   const isEditMode = !!transaction;

   const [internalOpen, setInternalOpen] = useState(false);
   const [budgetImpactParams, setBudgetImpactParams] = useState<{
      amount: number;
      categoryIds: string[];
      tagIds: string[];
      costCenterId: string;
   } | null>(null);

   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

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

   const handleCreateTransaction = useCallback(
      async (values: TransactionFormValues, resetForm: () => void) => {
         const amountInDecimal = centsToReais(values.amount);

         await createTransactionMutation.mutateAsync({
            amount: amountInDecimal,
            bankAccountId: values.bankAccountId || undefined,
            categoryIds: values.categoryIds || [],
            costCenterId: values.costCenterId || undefined,
            date: values.date.toISOString().split("T")[0] ?? "",
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
         setIsOpen?.(false);
      },
      [createTransactionMutation, setIsOpen],
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
               date: values.date.toISOString().split("T")[0] ?? "",
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
         setIsOpen?.(false);
      },
      [transaction, updateTransactionMutation, setIsOpen],
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
      validators: {
         onBlur: transactionSchema,
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
            const data = await createCategoryMutation.mutateAsync({
               color: getRandomColor(),
               name,
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

   function DetailsStep() {
      return (
         <div className="space-y-4">
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
                              onValueChange={(value) =>
                                 field.handleChange(
                                    value as "expense" | "income",
                                 )
                              }
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
               <form.Field name="date">
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
                  const shouldUpdate =
                     values.type === "expense" &&
                     values.amount > 0 &&
                     (values.categoryIds.length > 0 ||
                        values.tagIds.length > 0 ||
                        !!values.costCenterId);

                  const newParams = shouldUpdate
                     ? {
                          amount: centsToReais(values.amount),
                          categoryIds: values.categoryIds || [],
                          costCenterId: values.costCenterId || "",
                          tagIds: values.tagIds || [],
                       }
                     : null;

                  if (
                     JSON.stringify(newParams) !==
                     JSON.stringify(budgetImpactParams)
                  ) {
                     setTimeout(() => setBudgetImpactParams(newParams), 0);
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
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
         {asChild && <SheetTrigger asChild>{TriggerComponent}</SheetTrigger>}
         <SheetContent>
            <Stepper.Provider className="h-full">
               {({ methods }) => (
                  <form
                     className="h-full flex flex-col"
                     onSubmit={handleSubmit}
                  >
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
                           categorization: () => <CategorizationStep />,
                           details: () => <DetailsStep />,
                        })}
                     </div>

                     <SheetFooter className="px-4">
                        <Stepper.Controls className="flex flex-col w-full gap-2">
                           {methods.isFirst ? (
                              <form.Subscribe
                                 selector={(state) => ({
                                    amountValid:
                                       state.fieldMeta.amount?.isValid,
                                    bankAccountIdValid:
                                       state.fieldMeta.bankAccountId?.isValid,
                                    dateValid: state.fieldMeta.date?.isValid,
                                    descriptionValid:
                                       state.fieldMeta.description?.isValid,
                                 })}
                              >
                                 {({
                                    amountValid,
                                    bankAccountIdValid,
                                    dateValid,
                                    descriptionValid,
                                 }) => (
                                    <Button
                                       className="w-full"
                                       disabled={
                                          !amountValid ||
                                          !bankAccountIdValid ||
                                          !dateValid ||
                                          !descriptionValid
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
                                                {translate(
                                                   "common.actions.submit",
                                                )}
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
                                                {translate(
                                                   "common.actions.skip",
                                                )}
                                             </Button>
                                          )}
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
                                             {translate(
                                                "common.actions.previous",
                                             )}
                                          </Button>
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
         </SheetContent>
      </Sheet>
   );
}
