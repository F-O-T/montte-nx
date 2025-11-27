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
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
   type FormEvent,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BankAccountCombobox } from "@/features/bank-account/ui/bank-account-combobox";
import {
   getIconComponent,
   type IconName,
} from "@/features/icon-selector/lib/available-icons";
import { useTRPC } from "@/integrations/clients";

type OnboardingContext = "personal" | "business" | null;

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

const optionalBankAccountSchema = z.object({
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
   nickname: z.string().optional(),
});

const organizationSchema = z.object({
   name: z
      .string()
      .min(
         1,
         translate(
            "dashboard.routes.onboarding.validation.organization-name-required",
         ),
      ),
});

export function OnboardingPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const router = useRouter();

   const [context, setContext] = useState<OnboardingContext>(null);
   const [selectedDefaultCategories, setSelectedDefaultCategories] = useState<
      DefaultCategoryKey[]
   >([]);
   const [showOptionalBankAccount, setShowOptionalBankAccount] =
      useState(false);

   const [shouldGoNext, setShouldGoNext] = useState(false);
   const stepperMethodsRef = useRef<{
      next: () => void;
   } | null>(null);

   const { data: organizations } = useQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );
   const { data: organizationLimit } = useQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );

   const hasReachedOrgLimit = useMemo(() => {
      if (!organizations || !organizationLimit) return false;
      return organizations.length >= organizationLimit;
   }, [organizations, organizationLimit]);

   const steps = useMemo(() => {
      if (!context) {
         return [{ id: "context-selection" }] as const;
      }

      const baseSteps =
         context === "personal"
            ? [{ id: "context-selection" }, { id: "default-account-created" }]
            : [
                 { id: "context-selection" },
                 { id: "organization-setup" },
                 { id: "default-account-created" },
              ];

      const optionalStep = showOptionalBankAccount
         ? [{ id: "optional-bank-account" }]
         : [];

      return [...baseSteps, ...optionalStep, { id: "category" }] as Array<{
         id: string;
      }>;
   }, [context, showOptionalBankAccount]);

   const { Stepper } = useMemo(() => defineStepper(...steps), [steps]);

   const createDefaultPersonalAccount = useMutation(
      trpc.bankAccounts.createDefaultPersonal.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   const createDefaultBusinessAccount = useMutation(
      trpc.bankAccounts.createDefaultBusiness.mutationOptions(),
   );

   const createOrganization = useMutation(
      trpc.organization.createOrganization.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: async (data) => {
            if (data?.id) {
               let organizationSetAsActive = false;

               try {
                  await setActiveOrganization.mutateAsync({
                     organizationId: data.id,
                  });
                  organizationSetAsActive = true;

                  await createDefaultBusinessAccount.mutateAsync();
               } catch (error) {
                  const errorMessage =
                     error instanceof Error ? error.message : "Unknown error";

                  if (organizationSetAsActive) {
                     // Organization was created and set as active, but default account creation failed
                     console.error(
                        `Failed to create default business account for organization ${data.id}:`,
                        error,
                     );

                     toast.error(
                        `${translate("dashboard.routes.onboarding.organization-setup.title")}: ${translate("dashboard.routes.onboarding.organization-setup.account-creation-failed") || "Failed to create default account"} - ${errorMessage}`,
                     );
                  } else {
                     // Failed to set organization as active
                     console.error(
                        `Failed to set organization ${data.id} as active:`,
                        error,
                     );

                     toast.error(
                        `${translate("dashboard.routes.onboarding.organization-setup.title")}: Failed to activate organization - ${errorMessage}`,
                     );
                  }

                  // Re-throw to prevent wizard progression
                  throw error;
               }
            }
         },
      }),
   );

   const setActiveOrganization = useMutation(
      trpc.organization.setActiveOrganization.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
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
            queryClient.invalidateQueries({
               queryKey: ["bankAccounts"],
            });
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

   const optionalBankAccountForm = useForm({
      defaultValues: {
         bank: "",
         bankAccountName: "",
         bankAccountType: "checking",
         nickname: "",
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
         onBlur: ({ value }) => {
            const result = optionalBankAccountSchema.safeParse(value);
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

   const organizationForm = useForm({
      defaultValues: {
         name: "",
      },
      onSubmit: async ({ value }) => {
         if (hasReachedOrgLimit) {
            toast.error(
               translate(
                  "dashboard.routes.onboarding.organization-setup.limit-reached.title",
               ),
            );
            return;
         }

         const slug = createSlug(value.name);
         await createOrganization.mutateAsync({
            name: value.name,
            slug,
         });
      },
      validators: {
         onBlur: organizationSchema,
      },
   });

   function ContextSelectionStep() {
      return (
         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                  className="p-6 border-2 rounded-lg hover:border-primary transition-colors text-left"
                  onClick={() => setContext("personal")}
                  type="button"
               >
                  <div className="flex items-center gap-3 mb-2">
                     {(() => {
                        const UserIcon = getIconComponent("User");
                        return <UserIcon className="size-6" />;
                     })()}
                     <h3 className="text-lg font-semibold">
                        {translate(
                           "dashboard.routes.onboarding.context-selection.personal.title",
                        )}
                     </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                     {translate(
                        "dashboard.routes.onboarding.context-selection.personal.description",
                     )}
                  </p>
               </button>
               <button
                  className="p-6 border-2 rounded-lg hover:border-primary transition-colors text-left"
                  onClick={() => setContext("business")}
                  type="button"
               >
                  <div className="flex items-center gap-3 mb-2">
                     {(() => {
                        const BriefcaseIcon = getIconComponent("Briefcase");
                        return <BriefcaseIcon className="size-6" />;
                     })()}
                     <h3 className="text-lg font-semibold">
                        {translate(
                           "dashboard.routes.onboarding.context-selection.business.title",
                        )}
                     </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                     {translate(
                        "dashboard.routes.onboarding.context-selection.business.description",
                     )}
                  </p>
               </button>
            </div>
         </div>
      );
   }

   function OrganizationSetupStep() {
      if (hasReachedOrgLimit) {
         return (
            <div className="space-y-4 text-center">
               <p className="text-muted-foreground">
                  {translate(
                     "dashboard.routes.onboarding.organization-setup.limit-reached.description",
                  )}
               </p>
            </div>
         );
      }

      return (
         <form
            className="space-y-4"
            onSubmit={(e) => {
               e.preventDefault();
               organizationForm.handleSubmit();
            }}
         >
            <FieldGroup>
               <organizationForm.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.onboarding.organization-setup.form.name.label",
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
                                 "dashboard.routes.onboarding.organization-setup.form.name.placeholder",
                              )}
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </organizationForm.Field>
            </FieldGroup>
         </form>
      );
   }

   function DefaultAccountCreatedStep() {
      const messageKey =
         context === "personal"
            ? "dashboard.routes.onboarding.default-account-created.personal.message"
            : "dashboard.routes.onboarding.default-account-created.business.message";

      return (
         <div className="space-y-4 text-center">
            <p className="text-muted-foreground">{translate(messageKey)}</p>
            {!showOptionalBankAccount && (
               <Button
                  className="my-2"
                  onClick={() => {
                     setShowOptionalBankAccount(true);
                     setShouldGoNext(true);
                  }}
                  type="button"
                  variant="outline"
               >
                  {translate(
                     "dashboard.routes.onboarding.default-account-created.add-additional-account",
                  )}
               </Button>
            )}
         </div>
      );
   }

   function OptionalBankAccountStep() {
      return (
         <form
            className="space-y-4"
            onSubmit={(e) => {
               e.preventDefault();
               optionalBankAccountForm.handleSubmit();
            }}
         >
            <FieldGroup>
               <optionalBankAccountForm.Field name="bankAccountName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "dashboard.routes.onboarding.optional-bank-account.form.name.label",
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
                                 "dashboard.routes.onboarding.optional-bank-account.form.name.placeholder",
                              )}
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </optionalBankAccountForm.Field>
            </FieldGroup>
            <FieldGroup>
               <optionalBankAccountForm.Field name="bank">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
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
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </optionalBankAccountForm.Field>
            </FieldGroup>
            <FieldGroup>
               <optionalBankAccountForm.Field name="bankAccountType">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.onboarding.optional-bank-account.form.type.label",
                           )}
                        </FieldLabel>
                        <Select
                           onValueChange={(value) => field.handleChange(value)}
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
               </optionalBankAccountForm.Field>
            </FieldGroup>
            <FieldGroup>
               <optionalBankAccountForm.Field name="nickname">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           {translate(
                              "dashboard.routes.onboarding.optional-bank-account.form.nickname.label",
                           )}
                        </FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder={translate(
                              "dashboard.routes.onboarding.optional-bank-account.form.nickname.placeholder",
                           )}
                           value={field.state.value}
                        />
                     </Field>
                  )}
               </optionalBankAccountForm.Field>
            </FieldGroup>
         </form>
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

   useEffect(() => {
      if (shouldGoNext && stepperMethodsRef.current) {
         setShouldGoNext(false);
         stepperMethodsRef.current.next();
      }
   }, [shouldGoNext]);

   return (
      <Stepper.Provider>
         {({ methods }) => {
            const currentStepId = methods.current.id;

            if (!stepperMethodsRef.current) {
               stepperMethodsRef.current = { next: methods.next };
            } else {
               stepperMethodsRef.current.next = methods.next;
            }

            const handleNext = async () => {
               if (currentStepId === "context-selection" && context) {
                  try {
                     if (context === "personal") {
                        await createDefaultPersonalAccount.mutateAsync();
                        methods.next();
                     } else if (context === "business") {
                        methods.next();
                     }
                  } catch {
                     // Error já tratado no onError da mutation
                  }
                  return;
               }

               if (currentStepId === "organization-setup") {
                  try {
                     await organizationForm.handleSubmit();
                     if (organizationForm.state.isValid) {
                        methods.next();
                     }
                  } catch {
                     // Error já tratado no onError da mutation
                  }
                  return;
               }

               if (currentStepId === "default-account-created") {
                  methods.next();
                  return;
               }

               if (currentStepId === "optional-bank-account") {
                  methods.next();
                  return;
               }

               methods.next();
            };

            const handleSkip = () => {
               if (currentStepId === "optional-bank-account") {
                  methods.next();
               }
            };

            const handleSubmit = async (e: FormEvent) => {
               e.preventDefault();
               e.stopPropagation();

               if (currentStepId === "category") {
                  await createSelectedCategories();
                  await completeOnboarding();
               } else if (currentStepId === "optional-bank-account") {
                  await optionalBankAccountForm.handleSubmit();
               }
            };

            const getStepTitle = () => {
               switch (currentStepId) {
                  case "context-selection":
                     return translate(
                        "dashboard.routes.onboarding.context-selection.title",
                     );
                  case "organization-setup":
                     return translate(
                        "dashboard.routes.onboarding.organization-setup.title",
                     );
                  case "default-account-created":
                     return translate(
                        "dashboard.routes.onboarding.default-account-created.title",
                     );
                  case "optional-bank-account":
                     return translate(
                        "dashboard.routes.onboarding.optional-bank-account.title",
                     );
                  case "category":
                     return translate(
                        "dashboard.routes.onboarding.category.title",
                     );
                  default:
                     return "";
               }
            };

            const getStepDescription = () => {
               switch (currentStepId) {
                  case "context-selection":
                     return translate(
                        "dashboard.routes.onboarding.context-selection.description",
                     );
                  case "organization-setup":
                     return translate(
                        "dashboard.routes.onboarding.organization-setup.description",
                     );
                  case "default-account-created":
                     return translate(
                        "dashboard.routes.onboarding.default-account-created.description",
                     );
                  case "optional-bank-account":
                     return translate(
                        "dashboard.routes.onboarding.optional-bank-account.description",
                     );
                  case "category":
                     return translate(
                        "dashboard.routes.onboarding.category.description",
                     );
                  default:
                     return "";
               }
            };

            return (
               <Card>
                  <CardHeader className="text-center">
                     <CardTitle className="text-3xl">
                        {getStepTitle()}
                     </CardTitle>
                     <CardDescription>{getStepDescription()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <Stepper.Navigation>
                        {steps.map((step) => (
                           <Stepper.Step
                              key={step.id}
                              of={step.id}
                           ></Stepper.Step>
                        ))}
                     </Stepper.Navigation>
                     <form className="space-y-4" onSubmit={handleSubmit}>
                        {methods.switch({
                           category: () => <CategoryStep />,
                           "context-selection": () => <ContextSelectionStep />,
                           "default-account-created": () => (
                              <DefaultAccountCreatedStep />
                           ),
                           "optional-bank-account": () => (
                              <OptionalBankAccountStep />
                           ),
                           "organization-setup": () => (
                              <OrganizationSetupStep />
                           ),
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
                           <div className="flex gap-2">
                              {currentStepId === "optional-bank-account" && (
                                 <Button
                                    onClick={(e) => {
                                       e.preventDefault();
                                       handleSkip();
                                    }}
                                    type="button"
                                    variant="outline"
                                 >
                                    {translate(
                                       "dashboard.routes.onboarding.optional-bank-account.skip",
                                    )}
                                 </Button>
                              )}
                              {methods.isLast ? (
                                 <Button
                                    className="flex gap-2 items-center justify-center"
                                    disabled={
                                       createBankAccount.isPending ||
                                       createCategory.isPending ||
                                       selectedDefaultCategories.length === 0
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate("common.actions.submit")}
                                 </Button>
                              ) : (
                                 <organizationForm.Subscribe>
                                    {(orgFormState) => (
                                       <optionalBankAccountForm.Subscribe>
                                          {(optionalFormState) => (
                                             <Button
                                                disabled={
                                                   (currentStepId ===
                                                      "context-selection" &&
                                                      !context) ||
                                                   (currentStepId ===
                                                      "organization-setup" &&
                                                      (!orgFormState.canSubmit ||
                                                         hasReachedOrgLimit ||
                                                         createOrganization.isPending)) ||
                                                   (currentStepId ===
                                                      "optional-bank-account" &&
                                                      !optionalFormState.canSubmit) ||
                                                   createDefaultPersonalAccount.isPending ||
                                                   createDefaultBusinessAccount.isPending
                                                }
                                                onClick={(e) => {
                                                   e.preventDefault();
                                                   handleNext();
                                                }}
                                                type="button"
                                             >
                                                {translate(
                                                   "common.actions.next",
                                                )}
                                             </Button>
                                          )}
                                       </optionalBankAccountForm.Subscribe>
                                    )}
                                 </organizationForm.Subscribe>
                              )}
                           </div>
                        </Stepper.Controls>
                     </form>
                  </CardContent>
               </Card>
            );
         }}
      </Stepper.Provider>
   );
}
