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
import {
   createFileRoute,
   useNavigate,
   useRouter,
} from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BankAccountCombobox } from "@/features/bank-account/ui/bank-account-combobox";
import {
   getIconComponent,
   type IconName,
} from "@/features/icon-selector/lib/available-icons";
import { useTRPC } from "@/integrations/clients";

type OnboardingContext = "personal" | "business" | null;

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

type StepId =
   | "context"
   | "organization"
   | "account-created"
   | "additional-account"
   | "categories";

const searchSchema = z.object({
   context: z.enum(["personal", "business"]).optional(),
   step: z
      .enum([
         "context",
         "organization",
         "account-created",
         "additional-account",
         "categories",
      ])
      .optional()
      .default("context"),
});

export const Route = createFileRoute("/auth/onboarding")({
   component: RouteComponent,
   validateSearch: searchSchema,
});

function RouteComponent() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const router = useRouter();
   const navigate = useNavigate({ from: "/auth/onboarding" });
   const { step, context: urlContext } = Route.useSearch();

   const [context, setContext] = useState<OnboardingContext>(
      urlContext || null,
   );
   const [selectedDefaultCategories, setSelectedDefaultCategories] = useState<
      DefaultCategoryKey[]
   >([]);

   // Define steps based on context
   const steps = useMemo(() => {
      if (!context) {
         return [{ id: "context" }] as const;
      }

      if (context === "personal") {
         return [
            { id: "context" },
            { id: "account-created" },
            { id: "categories" },
         ] as const;
      }

      return [
         { id: "context" },
         { id: "organization" },
         { id: "account-created" },
         { id: "categories" },
      ] as const;
   }, [context]);

   const { Stepper } = useMemo(() => defineStepper(...steps), [steps]);

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
                     console.error(
                        `Failed to create default business account for organization ${data.id}:`,
                        error,
                     );

                     toast.error(
                        `${translate("dashboard.routes.onboarding.organization-setup.title")}: ${translate("dashboard.routes.onboarding.organization-setup.account-creation-failed") || "Failed to create default account"} - ${errorMessage}`,
                     );
                  } else {
                     console.error(
                        `Failed to set organization ${data.id} as active:`,
                        error,
                     );

                     toast.error(
                        `${translate("dashboard.routes.onboarding.organization-setup.title")}: Failed to activate organization - ${errorMessage}`,
                     );
                  }

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
            type: value.bankAccountType as
               | "checking"
               | "savings"
               | "investment",
         });

         navigate({
            search: { context: context || undefined, step: "categories" },
         });
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

         let slug = createSlug(value.name);
         if (!slug || slug.trim().length === 0) {
            slug = `organization-${Date.now()}`;
         }
         await createOrganization.mutateAsync({
            name: value.name,
            slug,
         });
         navigate({ search: { context: "business", step: "account-created" } });
      },
      validators: {
         onBlur: organizationSchema,
      },
   });

   const handleContextSelection = async (
      selectedContext: "personal" | "business",
   ) => {
      setContext(selectedContext);

      if (selectedContext === "personal") {
         try {
            await createDefaultPersonalAccount.mutateAsync();
            navigate({
               search: { context: "personal", step: "account-created" },
            });
         } catch (_error) {
            // Error already handled in onError
         }
      } else {
         navigate({ search: { context: "business", step: "organization" } });
      }
   };

   const getStepTitle = () => {
      switch (step) {
         case "context":
            return translate(
               "dashboard.routes.onboarding.context-selection.title",
            );
         case "organization":
            return translate(
               "dashboard.routes.onboarding.organization-setup.title",
            );
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
         case "context":
            return translate(
               "dashboard.routes.onboarding.context-selection.description",
            );
         case "organization":
            return translate(
               "dashboard.routes.onboarding.organization-setup.description",
            );
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
         case "context":
            return (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                     className="p-6 border-2 rounded-lg hover:border-primary transition-colors text-left"
                     disabled={createDefaultPersonalAccount.isPending}
                     onClick={() => handleContextSelection("personal")}
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
                     onClick={() => handleContextSelection("business")}
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
            );

         case "organization":
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           );
                        }}
                     </organizationForm.Field>
                  </FieldGroup>

                  <div className="flex justify-between">
                     <Button
                        onClick={() =>
                           navigate({ search: { step: "context" } })
                        }
                        type="button"
                        variant="outline"
                     >
                        {translate("common.actions.previous")}
                     </Button>
                     <organizationForm.Subscribe>
                        {(formState) => (
                           <Button
                              disabled={
                                 !formState.canSubmit ||
                                 hasReachedOrgLimit ||
                                 createOrganization.isPending
                              }
                              type="submit"
                           >
                              {translate("common.actions.next")}
                           </Button>
                        )}
                     </organizationForm.Subscribe>
                  </div>
               </form>
            );

         case "account-created": {
            const messageKey =
               context === "personal"
                  ? "dashboard.routes.onboarding.default-account-created.personal.message"
                  : "dashboard.routes.onboarding.default-account-created.business.message";

            return (
               <>
                  <div className="text-center space-y-4">
                     <p className="text-muted-foreground">
                        {translate(messageKey)}
                     </p>
                     <Button
                        className="my-2"
                        onClick={() => {
                           navigate({
                              search: {
                                 context: context || undefined,
                                 step: "additional-account",
                              },
                           });
                        }}
                        type="button"
                        variant="outline"
                     >
                        {translate(
                           "dashboard.routes.onboarding.default-account-created.add-additional-account",
                        )}
                     </Button>
                  </div>

                  <div className="flex justify-between pt-4">
                     <Button
                        onClick={() => {
                           if (context === "business") {
                              navigate({
                                 search: { context, step: "organization" },
                              });
                           } else {
                              navigate({ search: { step: "context" } });
                           }
                        }}
                        type="button"
                        variant="outline"
                     >
                        {translate("common.actions.previous")}
                     </Button>
                     <Button
                        onClick={() =>
                           navigate({
                              search: {
                                 context: context || undefined,
                                 step: "categories",
                              },
                           })
                        }
                        type="button"
                     >
                        {translate("common.actions.next")}
                     </Button>
                  </div>
               </>
            );
         }

         case "additional-account":
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
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
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder={translate(
                                    "dashboard.routes.onboarding.optional-bank-account.form.nickname.placeholder",
                                 )}
                                 value={field.state.value}
                              />
                           </Field>
                        )}
                     </optionalBankAccountForm.Field>
                  </FieldGroup>

                  <div className="flex justify-between gap-2">
                     <Button
                        onClick={() =>
                           navigate({
                              search: {
                                 context: context || undefined,
                                 step: "account-created",
                              },
                           })
                        }
                        type="button"
                        variant="outline"
                     >
                        {translate("common.actions.previous")}
                     </Button>
                     <div className="flex gap-2">
                        <Button
                           onClick={() =>
                              navigate({
                                 search: {
                                    context: context || undefined,
                                    step: "categories",
                                 },
                              })
                           }
                           type="button"
                           variant="outline"
                        >
                           {translate(
                              "dashboard.routes.onboarding.optional-bank-account.skip",
                           )}
                        </Button>
                        <optionalBankAccountForm.Subscribe>
                           {(formState) => (
                              <Button
                                 disabled={
                                    !formState.canSubmit ||
                                    createBankAccount.isPending
                                 }
                                 type="submit"
                              >
                                 {translate("common.actions.next")}
                              </Button>
                           )}
                        </optionalBankAccountForm.Subscribe>
                     </div>
                  </div>
               </form>
            );

         case "categories":
            return (
               <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                     e.preventDefault();
                     await createSelectedCategories();
                     await completeOnboarding();
                  }}
               >
                  <FieldGroup>
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.onboarding.category.form.defaults.label",
                           )}
                        </FieldLabel>
                        <div className="flex flex-wrap gap-2">
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

                  <div className="flex justify-between">
                     <Button
                        onClick={() =>
                           navigate({
                              search: {
                                 context: context || undefined,
                                 step: "account-created",
                              },
                           })
                        }
                        type="button"
                        variant="outline"
                     >
                        {translate("common.actions.previous")}
                     </Button>
                     <Button disabled={createCategory.isPending} type="submit">
                        {translate("common.actions.submit")}
                     </Button>
                  </div>
               </form>
            );

         default:
            return null;
      }
   };

   const currentStepIndex = steps.findIndex((s) => s.id === step);
   const stepperMethodsRef = useRef<
      | {
           current: { id: string };
           goTo: (id: string) => void;
        }
      | undefined
   >(undefined);

   useEffect(() => {
      if (currentStepIndex !== -1 && stepperMethodsRef.current) {
         const currentStep = steps[currentStepIndex];
         if (
            currentStep &&
            stepperMethodsRef.current.current.id !== currentStep.id
         ) {
            try {
               stepperMethodsRef.current.goTo(currentStep.id);
            } catch (e) {
               // Silently fail if step doesn't exist
               console.warn("Failed to navigate to step:", currentStep.id, e);
            }
         }
      }
   }, [currentStepIndex, steps]);

   return (
      <div className="min-h-screen flex items-center justify-center p-4">
         <div className="w-full max-w-2xl">
            <Card>
               <CardHeader className="text-center">
                  <CardTitle className="text-3xl">{getStepTitle()}</CardTitle>
                  <CardDescription>{getStepDescription()}</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Provider>
                     {({ methods }) => {
                        stepperMethodsRef.current = methods as {
                           current: { id: string };
                           goTo: (id: string) => void;
                        };

                        const handleStepClick = (stepId: string) => {
                           const clickedIndex = steps.findIndex(
                              (s) => s.id === stepId,
                           );

                           // Only allow navigation to visited steps or current step
                           if (
                              clickedIndex !== -1 &&
                              clickedIndex <= currentStepIndex &&
                              (stepId === "context" ||
                                 stepId === "organization" ||
                                 stepId === "account-created" ||
                                 stepId === "additional-account" ||
                                 stepId === "categories")
                           ) {
                              navigate({
                                 search: {
                                    context: context || undefined,
                                    step: stepId as StepId,
                                 },
                              });
                           }
                        };

                        return (
                           <>
                              <Stepper.Navigation>
                                 {steps.map((s, index) => (
                                    <Stepper.Step
                                       className={
                                          index <= currentStepIndex
                                             ? "cursor-pointer hover:opacity-80 transition-opacity"
                                             : "cursor-not-allowed opacity-50"
                                       }
                                       key={s.id}
                                       of={s.id}
                                       onClick={() => handleStepClick(s.id)}
                                    />
                                 ))}
                              </Stepper.Navigation>
                              {renderStep()}
                           </>
                        );
                     }}
                  </Stepper.Provider>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
