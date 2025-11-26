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
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { defineStepper } from "@packages/ui/components/stepper";
import { Toggle } from "@packages/ui/components/toggle";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BankAccountCombobox } from "@/features/bank-account/ui/bank-account-combobox";
import {
   getIconComponent,
   type IconName,
} from "@/features/icon-selector/lib/available-icons";
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
   bankAccountType: z.enum(["checking", "savings", "investment"]),
});

const defaultCategoryKeys = [
   "food",
   "health",
   "housing",
   "leisure",
   "shopping",
   "transport",
] as const;

type DefaultCategoryKey = (typeof defaultCategoryKeys)[number];

const defaultCategoriesConfig: Record<
   DefaultCategoryKey,
   { color: string; icon: IconName }
> = {
   food: {
      color: "#f97316",
      icon: "UtensilsCrossed",
   },
   health: {
      color: "#ef4444",
      icon: "Heart",
   },
   housing: {
      color: "#3b82f6",
      icon: "Home",
   },
   leisure: {
      color: "#8b5cf6",
      icon: "Gamepad",
   },
   shopping: {
      color: "#22c55e",
      icon: "ShoppingBag",
   },
   transport: {
      color: "#0ea5e9",
      icon: "Car",
   },
};

export function OnboardingPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const router = useRouter();

   const [selectedDefaultCategories, setSelectedDefaultCategories] = useState<
      DefaultCategoryKey[]
   >([]);

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

   const createSelectedCategories = useCallback(async () => {
      await Promise.all(
         selectedDefaultCategories.map((key) => {
            const label = translate(
               `dashboard.routes.onboarding.category.defaults.${key}`,
            );
            const config = defaultCategoriesConfig[key];

            return createCategory.mutateAsync({
               color: config.color,
               icon: config.icon,
               name: label,
            });
         }),
      );
   }, [selectedDefaultCategories, createCategory]);

   const completeOnboarding = useCallback(async () => {
      await queryClient.invalidateQueries({
         queryKey: trpc.onboarding.getOnboardingStatus.queryKey(),
      });
      router.navigate({ params: { slug: "" }, to: "/$slug/home" });
   }, [queryClient, trpc, router]);

   const form = useForm({
      defaultValues: {
         bank: "",
         bankAccountName: "",
         bankAccountType: "checking",
      },
      onSubmit: async ({ value, formApi }) => {
         await createBankAccount.mutateAsync({
            bank: value.bank,
            name: value.bankAccountName,
            type: value.bankAccountType as z.infer<
               typeof schema
            >["bankAccountType"],
         });

         await createSelectedCategories();
         await completeOnboarding();

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
                           <BankAccountCombobox
                              onBlur={field.handleBlur}
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
         <FieldGroup>
            <Field>
               <FieldLabel>
                  {translate(
                     "dashboard.routes.onboarding.category.form.defaults.label",
                  )}
               </FieldLabel>
               <div className="flex flex-wrap gap-2">
                  {defaultCategoryKeys.map((key) => {
                     const isSelected = selectedDefaultCategories.includes(key);
                     const label = translate(
                        `dashboard.routes.onboarding.category.defaults.${key}`,
                     );
                     const config = defaultCategoriesConfig[key];
                     const Icon = getIconComponent(config.icon);

                     return (
                        <Toggle
                           aria-pressed={isSelected}
                           className="gap-2 px-3"
                           key={key}
                           onPressedChange={(pressed) => {
                              setSelectedDefaultCategories((prev) => {
                                 if (pressed) {
                                    return prev.includes(key)
                                       ? prev
                                       : [...prev, key];
                                 }

                                 return prev.filter((item) => item !== key);
                              });
                           }}
                           pressed={isSelected}
                           size="sm"
                           style={{
                              backgroundColor: isSelected
                                 ? `${config.color}15`
                                 : undefined,
                              borderColor: isSelected
                                 ? config.color
                                 : undefined,
                           }}
                           type="button"
                           variant="outline"
                        >
                           <Icon
                              className="size-4"
                              style={{ color: config.color }}
                           />
                           {label}
                        </Toggle>
                     );
                  })}
               </div>
            </Field>
         </FieldGroup>
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
                           onClick={(e) => {
                              e.preventDefault();
                              methods.prev();
                           }}
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
                                       createCategory.isPending ||
                                       selectedDefaultCategories.length === 0
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate("common.actions.submit")}
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
                                    onClick={(e) => {
                                       e.preventDefault();
                                       methods.next();
                                    }}
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
