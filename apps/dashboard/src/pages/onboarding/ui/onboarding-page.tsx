import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   ColorPicker,
   ColorPickerAlpha,
   ColorPickerEyeDropper,
   ColorPickerHue,
   ColorPickerSelection,
} from "@packages/ui/components/color-picker";
import { Combobox } from "@packages/ui/components/combobox";
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
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import Color from "color";
import { type FormEvent, Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

const steps = [
   {
      id: "bank-account",
   },
   {
      id: "category",
   },
] as const;

const { Stepper } = defineStepper(...steps);

interface BankComboboxProps {
   value?: string;
   onValueChange?: (value: string) => void;
}

function BankComboboxContent({ value, onValueChange }: BankComboboxProps) {
   const trpc = useTRPC();
   const { data: banks = [] } = useSuspenseQuery(
      trpc.brasilApi.banks.getAll.queryOptions(),
   );

   const formattedBanks = banks.map((bank) => ({
      label: bank.fullName,
      value: bank.fullName,
   }));

   return (
      <Combobox
         emptyMessage={translate("common.form.search.no-results")}
         onValueChange={onValueChange}
         options={formattedBanks}
         placeholder={translate("common.form.bank.placeholder")}
         searchPlaceholder={translate("common.form.search.placeholder")}
         value={value}
      />
   );
}

function ErrorFallback({ error }: { error: Error }) {
   return (
      <div className="text-sm text-red-600 p-2 border rounded-md">
         {error.message}
      </div>
   );
}

function LoadingFallback() {
   return <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />;
}

function BankCombobox(props: BankComboboxProps) {
   return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
         <Suspense fallback={<LoadingFallback />}>
            <BankComboboxContent {...props} />
         </Suspense>
      </ErrorBoundary>
   );
}

const schema = z.object({
   bank: z
      .string()
      .min(
         1,
         translate("dashboard.routes.onboarding.validation.bank-required"),
      ),
   bankAccountName: z
      .string()
      .min(
         1,
         translate(
            "dashboard.routes.onboarding.validation.account-name-required",
         ),
      ),
   bankAccountType: z
      .string()
      .min(
         1,
         translate(
            "dashboard.routes.onboarding.validation.account-type-required",
         ),
      ),
   categoryBudget: z.number().min(0),
   categoryColor: z.string().min(1),
   categoryName: z
      .string()
      .min(
         1,
         translate(
            "dashboard.routes.onboarding.validation.category-name-required",
         ),
      ),
});

export function OnboardingPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const createBankAccount = useMutation(
      trpc.bankAccounts.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: () => {
            toast.success(
               translate(
                  "dashboard.routes.onboarding.bank-account.toast.success",
               ),
            );
         },
      }),
   );

   const createCategory = useMutation(
      trpc.categories.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.onboarding.category.toast.success"),
            );
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         bank: "",
         bankAccountName: "",
         bankAccountType: "checking",
         categoryBudget: 0,
         categoryColor: "#000000",
         categoryName: "",
      },
      onSubmit: async ({ value, formApi }) => {
         // Create bank account first
         await createBankAccount.mutateAsync({
            bank: value.bank,
            name: value.bankAccountName,
            type: value.bankAccountType,
         });

         // Then create category
         await createCategory.mutateAsync({
            budget: value.categoryBudget,
            color: value.categoryColor,
            name: value.categoryName,
         });

         // Complete onboarding
         await queryClient.invalidateQueries({
            queryKey: trpc.onboarding.getOnboardingStatus.queryKey(),
         });
         window.location.href = "/home";

         formApi.reset();
      },
      validators: {
         onBlur: schema,
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

   function BankAccountStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="bankAccountName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.onboarding.bank-account.form.name.label",
                              )}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.onboarding.bank-account.form.name.placeholder",
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
               <form.Field name="bank">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.onboarding.bank-account.form.bank.label",
                              )}
                           </FieldLabel>
                           <BankCombobox
                              onValueChange={field.handleChange}
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
               <form.Field name="bankAccountType">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.onboarding.bank-account.form.type.label",
                           )}
                        </FieldLabel>
                        <Select
                           onValueChange={(value) => field.handleChange(value)}
                           value={field.state.value}
                        >
                           <SelectTrigger>
                              <SelectValue
                                 placeholder={translate(
                                    "dashboard.routes.onboarding.bank-account.form.type.placeholder",
                                 )}
                              />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="checking">
                                 {translate(
                                    "dashboard.routes.onboarding.bank-account.form.type.options.checking",
                                 )}
                              </SelectItem>
                              <SelectItem value="savings">
                                 {translate(
                                    "dashboard.routes.onboarding.bank-account.form.type.options.savings",
                                 )}
                              </SelectItem>
                              <SelectItem value="investment">
                                 {translate(
                                    "dashboard.routes.onboarding.bank-account.form.type.options.investment",
                                 )}
                              </SelectItem>
                           </SelectContent>
                        </Select>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         </>
      );
   }
   function CategoryStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="categoryName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.onboarding.category.form.name.label",
                              )}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.onboarding.category.form.name.placeholder",
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
               <form.Field name="categoryBudget">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.onboarding.category.form.budget.label",
                              )}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(Number(e.target.value))
                              }
                              placeholder="0.00"
                              type="number"
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
               <form.Field name="categoryColor">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.onboarding.category.form.color.label",
                           )}
                        </FieldLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <Button
                                 className="w-full justify-start"
                                 variant="outline"
                              >
                                 <div
                                    className="size-4 rounded-full border"
                                    style={{
                                       backgroundColor: field.state.value,
                                    }}
                                 />
                                 {field.state.value}
                              </Button>
                           </PopoverTrigger>
                           <PopoverContent
                              align="start"
                              className="h-full rounded-md border bg-background "
                           >
                              <ColorPicker
                                 className="size-full flex flex-col gap-4"
                                 onChange={(rgba) => {
                                    if (Array.isArray(rgba)) {
                                       field.handleChange(
                                          Color.rgb(
                                             rgba[0],
                                             rgba[1],
                                             rgba[2],
                                          ).hex(),
                                       );
                                    }
                                 }}
                                 value={field.state.value || "#000000"}
                              >
                                 <div className="h-24">
                                    <ColorPickerSelection />
                                 </div>

                                 <div className="flex items-center gap-4">
                                    <ColorPickerEyeDropper />
                                    <div className="grid w-full gap-1">
                                       <ColorPickerHue />
                                       <ColorPickerAlpha />
                                    </div>
                                 </div>
                              </ColorPicker>
                           </PopoverContent>
                        </Popover>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         </>
      );
   }
   return (
      <Stepper.Provider>
         {({ methods }) => (
            <Card>
               <CardHeader className="text-center">
                  <CardTitle className="text-3xl">
                     {methods.switch({
                        "bank-account": () =>
                           translate(
                              "dashboard.routes.onboarding.bank-account.title",
                           ),
                        category: () =>
                           translate(
                              "dashboard.routes.onboarding.category.title",
                           ),
                     })}
                  </CardTitle>
                  <CardDescription>
                     {methods.switch({
                        "bank-account": () =>
                           translate(
                              "dashboard.routes.onboarding.bank-account.description",
                           ),
                        category: () =>
                           translate(
                              "dashboard.routes.onboarding.category.description",
                           ),
                     })}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id}></Stepper.Step>
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "bank-account": () => <BankAccountStep />,
                        category: () => <CategoryStep />,
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           disabled={methods.isFirst}
                           onClick={methods.prev}
                           type="button"
                           variant="outline"
                        >
                           {translate("common.actions.previous")}
                        </Button>
                        {methods.isLast ? (
                           <form.Subscribe>
                              {(formState) => (
                                 <Button
                                    className="flex gap-2 items-center justify-center"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting ||
                                       createBankAccount.isPending ||
                                       createCategory.isPending
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate(
                                       "dashboard.routes.onboarding.actions.complete",
                                    )}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <form.Subscribe
                              selector={(state) => ({
                                 bankAccountNameValid:
                                    state.fieldMeta.bankAccountName?.isValid,
                                 bankAccountTypeValid:
                                    state.fieldMeta.bankAccountType?.isValid,
                                 bankValid: state.fieldMeta.bank?.isValid,
                              })}
                           >
                              {({
                                 bankValid,
                                 bankAccountNameValid,
                                 bankAccountTypeValid,
                              }) => (
                                 <Button
                                    disabled={
                                       !bankValid ||
                                       !bankAccountNameValid ||
                                       !bankAccountTypeValid
                                    }
                                    onClick={methods.next}
                                    type="button"
                                 >
                                    {translate("common.actions.next")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        )}
                     </Stepper.Controls>
                  </form>
               </CardContent>
            </Card>
         )}
      </Stepper.Provider>
   );
}
