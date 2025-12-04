import { translate } from "@packages/localization";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
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
import { Toggle } from "@packages/ui/components/toggle";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
   BarChart3Icon,
   CheckCircle2Icon,
   ChevronLeftIcon,
   ChevronRightIcon,
   PiggyBankIcon,
   ShieldCheckIcon,
   WalletIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BankAccountCombobox } from "@/features/bank-account/ui/bank-account-combobox";
import {
   getIconComponent,
   type IconName,
} from "@/features/icon-selector/lib/available-icons";
import { useTRPC } from "@/integrations/clients";

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

const bankAccountSchema = z.object({
   bank: z
      .string()
      .min(
         1,
         translate("dashboard.routes.onboarding.validation.bank-required"),
      ),
   bankAccountName: z.string().optional(),
   bankAccountType: z
      .string()
      .min(
         1,
         translate(
            "dashboard.routes.onboarding.validation.account-type-required",
         ),
      ),
});

type StepId =
   | "welcome"
   | "account-created"
   | "additional-account"
   | "categories";

const allSteps: StepId[] = [
   "welcome",
   "account-created",
   "additional-account",
   "categories",
];

const searchSchema = z.object({
   step: z
      .enum(["welcome", "account-created", "additional-account", "categories"])
      .optional()
      .default("welcome"),
});

export const Route = createFileRoute("/$slug/onboarding")({
   component: RouteComponent,
   validateSearch: searchSchema,
});

function RouteComponent() {
   const trpc = useTRPC();
   const navigate = useNavigate({ from: "/$slug/onboarding" });
   const { slug } = Route.useParams();
   const { step } = Route.useSearch();

   const [selectedDefaultCategories, setSelectedDefaultCategories] = useState<
      DefaultCategoryKey[]
   >([]);

   const currentStepIndex = allSteps.indexOf(step);
   const totalSteps = allSteps.length;

   const { data: onboardingStatus } = useQuery(
      trpc.onboarding.getOnboardingStatus.queryOptions(),
   );

   const createDefaultPersonalAccount = useMutation(
      trpc.bankAccounts.createDefaultPersonal.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: () => {
            navigate({
               params: { slug },
               search: { step: "account-created" },
            });
         },
      }),
   );

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
            navigate({
               params: { slug },
               search: { step: "categories" },
            });
         },
      }),
   );

   const createCategory = useMutation(
      trpc.categories.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   const completeOnboarding = useMutation(
      trpc.onboarding.completeOnboarding.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: () => {
            navigate({ params: { slug }, to: "/$slug/home" });
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

   const handleFinishOnboarding = async () => {
      await createSelectedCategories();
      await completeOnboarding.mutateAsync();
   };

   const handleWelcomeNext = () => {
      const defaultName =
         onboardingStatus?.organizationContext === "business"
            ? translate("dashboard.routes.onboarding.default-account.business")
            : translate("dashboard.routes.onboarding.default-account.personal");
      createDefaultPersonalAccount.mutate({ name: defaultName });
   };

   const bankAccountForm = useForm({
      defaultValues: {
         bank: "",
         bankAccountName: "",
         bankAccountType: "checking",
      },
      onSubmit: async ({ value, formApi }) => {
         await createBankAccount.mutateAsync({
            bank: value.bank,
            name: value.bankAccountName,
            type: value.bankAccountType as
               | "checking"
               | "savings"
               | "investment",
         });
         formApi.reset();
      },
      validators: {
         onBlur: ({ value }) => {
            const result = bankAccountSchema.safeParse(value);
            if (!result.success) {
               const errors: Record<string, string[]> = {};
               result.error.issues.forEach((err) => {
                  const path = err.path[0] as string;
                  if (path) {
                     if (!errors[path]) {
                        errors[path] = [];
                     }
                     errors[path].push(err.message);
                  }
               });
               return errors;
            }
         },
      },
   });

   const goToPreviousStep = () => {
      if (currentStepIndex > 0) {
         const prevStep = allSteps[currentStepIndex - 1];
         navigate({
            params: { slug },
            search: { step: prevStep },
         });
      }
   };

   const goToNextStep = () => {
      if (currentStepIndex < totalSteps - 1) {
         const nextStep = allSteps[currentStepIndex + 1];
         navigate({
            params: { slug },
            search: { step: nextStep },
         });
      }
   };

   const getStepTitle = () => {
      switch (step) {
         case "welcome":
            return translate("dashboard.routes.onboarding.welcome.title");
         case "account-created":
            return translate(
               "dashboard.routes.onboarding.default-account-created.title",
            );
         case "additional-account":
            return translate(
               "dashboard.routes.onboarding.optional-bank-account.title",
            );
         case "categories":
            return translate("dashboard.routes.onboarding.category.title");
         default:
            return "";
      }
   };

   const getStepDescription = () => {
      switch (step) {
         case "welcome":
            return translate("dashboard.routes.onboarding.welcome.description");
         case "account-created":
            return translate(
               "dashboard.routes.onboarding.default-account-created.description",
            );
         case "additional-account":
            return translate(
               "dashboard.routes.onboarding.optional-bank-account.description",
            );
         case "categories":
            return translate(
               "dashboard.routes.onboarding.category.description",
            );
         default:
            return "";
      }
   };

   const renderStep = () => {
      switch (step) {
         case "welcome":
            return (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
                     <div className="p-3 rounded-full bg-primary/10">
                        <WalletIcon className="size-6 text-primary" />
                     </div>
                     <div className="text-center space-y-1">
                        <p className="font-medium font-serif">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.wallet.title",
                           )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.wallet.description",
                           )}
                        </p>
                     </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
                     <div className="p-3 rounded-full bg-primary/10">
                        <PiggyBankIcon className="size-6 text-primary" />
                     </div>
                     <div className="text-center space-y-1">
                        <p className="font-medium font-serif">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.budgets.title",
                           )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.budgets.description",
                           )}
                        </p>
                     </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
                     <div className="p-3 rounded-full bg-primary/10">
                        <BarChart3Icon className="size-6 text-primary" />
                     </div>
                     <div className="text-center space-y-1">
                        <p className="font-medium font-serif">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.insights.title",
                           )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.insights.description",
                           )}
                        </p>
                     </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
                     <div className="p-3 rounded-full bg-primary/10">
                        <ShieldCheckIcon className="size-6 text-primary" />
                     </div>
                     <div className="text-center space-y-1">
                        <p className="font-medium font-serif">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.security.title",
                           )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                           {translate(
                              "dashboard.routes.onboarding.welcome.features.security.description",
                           )}
                        </p>
                     </div>
                  </div>
               </div>
            );

         case "account-created": {
            const titleKey =
               onboardingStatus?.organizationContext === "business"
                  ? "dashboard.routes.onboarding.default-account-created.business.title"
                  : "dashboard.routes.onboarding.default-account-created.personal.title";
            const descriptionKey =
               onboardingStatus?.organizationContext === "business"
                  ? "dashboard.routes.onboarding.default-account-created.business.description"
                  : "dashboard.routes.onboarding.default-account-created.personal.description";

            return (
               <div className="max-w-md mx-auto">
                  <Alert>
                     <CheckCircle2Icon className="size-4" />
                     <AlertTitle>{translate(titleKey)}</AlertTitle>
                     <AlertDescription>
                        {translate(descriptionKey)}
                     </AlertDescription>
                  </Alert>
               </div>
            );
         }

         case "additional-account":
            return (
               <form
                  className="space-y-4"
                  onSubmit={(e) => {
                     e.preventDefault();
                     bankAccountForm.handleSubmit();
                  }}
               >
                  <FieldGroup>
                     <bankAccountForm.Field name="bankAccountName">
                        {(field) => (
                           <Field>
                              <FieldLabel htmlFor={field.name}>
                                 {translate(
                                    "dashboard.routes.onboarding.optional-bank-account.form.name.label",
                                 )}
                              </FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder={translate(
                                    "dashboard.routes.onboarding.optional-bank-account.form.name.placeholder",
                                 )}
                                 value={field.state.value}
                              />
                              <FieldDescription>
                                 {translate(
                                    "dashboard.routes.onboarding.optional-bank-account.form.name.description",
                                 )}
                              </FieldDescription>
                           </Field>
                        )}
                     </bankAccountForm.Field>
                  </FieldGroup>

                  <FieldGroup>
                     <bankAccountForm.Field name="bank">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "dashboard.routes.onboarding.optional-bank-account.form.bank.label",
                                    )}
                                 </FieldLabel>
                                 <BankAccountCombobox
                                    onBlur={field.handleBlur}
                                    onValueChange={field.handleChange}
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
                     </bankAccountForm.Field>
                  </FieldGroup>

                  <FieldGroup>
                     <bankAccountForm.Field name="bankAccountType">
                        {(field) => (
                           <Field>
                              <FieldLabel>
                                 {translate(
                                    "dashboard.routes.onboarding.optional-bank-account.form.type.label",
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
                                          "dashboard.routes.onboarding.optional-bank-account.form.type.placeholder",
                                       )}
                                    />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="checking">
                                       {translate(
                                          "dashboard.routes.onboarding.optional-bank-account.form.type.options.checking",
                                       )}
                                    </SelectItem>
                                    <SelectItem value="savings">
                                       {translate(
                                          "dashboard.routes.onboarding.optional-bank-account.form.type.options.savings",
                                       )}
                                    </SelectItem>
                                    <SelectItem value="investment">
                                       {translate(
                                          "dashboard.routes.onboarding.optional-bank-account.form.type.options.investment",
                                       )}
                                    </SelectItem>
                                 </SelectContent>
                              </Select>
                           </Field>
                        )}
                     </bankAccountForm.Field>
                  </FieldGroup>
               </form>
            );

         case "categories":
            return (
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           "dashboard.routes.onboarding.category.form.defaults.label",
                        )}
                     </FieldLabel>
                     <div className="flex flex-wrap gap-2 justify-center">
                        {defaultCategoryKeys.map((key) => {
                           const isSelected =
                              selectedDefaultCategories.includes(key);
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

                                       return prev.filter(
                                          (item) => item !== key,
                                       );
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

         default:
            return null;
      }
   };

   const StepIndicator = () => (
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-1.5">
            {allSteps.map((stepId, index) => (
               <div
                  className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                     index <= currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                  key={stepId}
               />
            ))}
         </div>
         <span className="text-sm text-muted-foreground whitespace-nowrap">
            {translate("dashboard.routes.onboarding.step-indicator", {
               current: currentStepIndex + 1,
               total: totalSteps,
            })}
         </span>
      </div>
   );

   return (
      <div className="min-h-screen flex flex-col p-4">
         <header className="p-4">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
               <div className="w-10" />
               <StepIndicator />
               <div className="w-10" />
            </div>
         </header>

         <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
               <div className="text-center space-y-2">
                  <h1 className="text-3xl font-semibold font-serif">
                     {getStepTitle()}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                     {getStepDescription()}
                  </p>
               </div>

               <div className="space-y-6">{renderStep()}</div>
            </div>
         </div>

         <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
               <Button
                  className="gap-2"
                  disabled={currentStepIndex === 0}
                  onClick={goToPreviousStep}
                  variant="ghost"
               >
                  <ChevronLeftIcon className="size-4" />
                  {translate("common.actions.previous")}
               </Button>

               <div className="flex items-center gap-2">
                  {step === "welcome" && (
                     <Button
                        className="gap-2"
                        disabled={createDefaultPersonalAccount.isPending}
                        onClick={handleWelcomeNext}
                     >
                        {createDefaultPersonalAccount.isPending
                           ? translate("common.actions.loading")
                           : translate("common.actions.next")}
                        <ChevronRightIcon className="size-4" />
                     </Button>
                  )}
                  {step === "account-created" && (
                     <Button className="gap-2" onClick={goToNextStep}>
                        {translate("common.actions.next")}
                        <ChevronRightIcon className="size-4" />
                     </Button>
                  )}
                  {step === "additional-account" && (
                     <>
                        <Button
                           onClick={() =>
                              navigate({
                                 params: { slug },
                                 search: { step: "categories" },
                              })
                           }
                           variant="outline"
                        >
                           {translate("common.actions.skip")}
                        </Button>
                        <Button
                           className="gap-2"
                           disabled={
                              !bankAccountForm.state.values.bank ||
                              bankAccountForm.state.isSubmitting ||
                              createBankAccount.isPending
                           }
                           onClick={() => bankAccountForm.handleSubmit()}
                        >
                           {translate("common.actions.next")}
                           <ChevronRightIcon className="size-4" />
                        </Button>
                     </>
                  )}
                  {step === "categories" && (
                     <Button
                        className="gap-2"
                        disabled={
                           selectedDefaultCategories.length === 0 ||
                           createCategory.isPending ||
                           completeOnboarding.isPending
                        }
                        onClick={handleFinishOnboarding}
                     >
                        {translate("common.actions.submit")}
                        <ChevronRightIcon className="size-4" />
                     </Button>
                  )}
               </div>
            </div>
         </footer>
      </div>
   );
}
