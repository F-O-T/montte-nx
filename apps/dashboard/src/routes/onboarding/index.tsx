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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Color from "color";
import { Loader2 } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

export const Route = createFileRoute("/onboarding/")({
   component: OnboardingPage,
});

const steps = [
   {
      description: "dashboard.routes.onboarding.steps.bank-account.description",
      id: "bank-account",
      title: "dashboard.routes.onboarding.steps.bank-account.title",
   },
   {
      description: "dashboard.routes.onboarding.steps.category.description",
      id: "category",
      title: "dashboard.routes.onboarding.steps.category.title",
   },
] as const;

const { Stepper, useStepper } = defineStepper(...steps);

const createBankAccountSchema = z.object({
   bank: z
      .string()
      .min(1, translate("dashboard.routes.onboarding.validation.bank-required")),
   name: z
      .string()
      .min(
         1,
         translate("dashboard.routes.onboarding.validation.account-name-required"),
      ),
   type: z
      .string()
      .min(
         1,
         translate("dashboard.routes.onboarding.validation.account-type-required"),
      ),
});

const createCategorySchema = z.object({
   budget: z.coerce.number().min(0).optional(),
   color: z
      .string()
      .min(1, translate("dashboard.routes.onboarding.validation.color-required")),
   name: z
      .string()
      .min(
         1,
         translate(
            "dashboard.routes.onboarding.validation.category-name-required",
         ),
      ),
});

function OnboardingPage() {
   return (
      <Stepper.Provider>
         <div className="flex w-full flex-col gap-8">
            <div className="flex justify-center">
               <Stepper.Navigation className="w-full max-w-2xl">
                  {steps.map((step) => (
                     <Stepper.Step key={step.id} of={step.id}>
                        <Stepper.Title>{translate(step.title)}</Stepper.Title>
                        <Stepper.Description>
                           {translate(step.description)}
                        </Stepper.Description>
                     </Stepper.Step>
                  ))}
               </Stepper.Navigation>
            </div>

            <div className="flex justify-center">
               <Stepper.Panel className="w-full max-w-xl">
                  <StepsContent />
               </Stepper.Panel>
            </div>
         </div>
      </Stepper.Provider>
   );
}

function StepsContent() {
   const { current, next } = useStepper();
   const trpcClient = useTRPC();
   const queryClient = useQueryClient();

   switch (current.id) {
      case "bank-account":
         return <BankAccountStep onNext={next} />;
      case "category":
         return (
            <CategoryStep
               onNext={async () => {
                  await queryClient.invalidateQueries({
                     queryKey:
                        trpcClient.onboarding.getOnboardingStatus.queryKey(),
                  });
                  window.location.href = "/home";
               }}
            />
         );
      default:
         return null;
   }
}

function BankAccountStep({ onNext }: { onNext: () => void }) {
   const trpcClient = useTRPC();
   const createBankAccount = useMutation(
      trpcClient.bankAccounts.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.onboarding.bank-account.toast.success"),
            );
            onNext();
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         bank: "",
         name: "",
         type: "checking",
      },
      onSubmit: async ({ value, formApi }) => {
         if (!value.name || !value.bank || !value.type) {
            return;
         }
         await createBankAccount.mutateAsync(value);
         formApi.reset();
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

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.onboarding.bank-account.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.onboarding.bank-account.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
               <FieldGroup>
                  <form.Field name="name">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
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
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 {translate(
                                    "dashboard.routes.onboarding.bank-account.form.bank.label",
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
                                    "dashboard.routes.onboarding.bank-account.form.bank.placeholder",
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
                  <form.Field name="type">
                     {(field) => (
                        <Field>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.onboarding.bank-account.form.type.label",
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

               <div className="flex justify-end">
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           disabled={
                              !formState.canSubmit ||
                              formState.isSubmitting ||
                              createBankAccount.isPending
                           }
                           type="submit"
                        >
                           {createBankAccount.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           )}
                           {translate(
                              "dashboard.routes.onboarding.actions.next",
                           )}
                        </Button>
                     )}
                  </form.Subscribe>
               </div>
            </form>
         </CardContent>
      </Card>
   );
}

function CategoryStep({ onNext }: { onNext: () => void }) {
   const trpcClient = useTRPC();
   const createCategory = useMutation(
      trpcClient.categories.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.onboarding.category.toast.success"),
            );
            onNext();
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         budget: 0,
         color: "#000000",
         name: "",
      },
      onSubmit: async ({ value, formApi }) => {
         if (!value.name || !value.color) {
            return;
         }
         await createCategory.mutateAsync(value);
         formApi.reset();
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

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.onboarding.category.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.onboarding.category.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
               <FieldGroup>
                  <form.Field name="name">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
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
                  <form.Field name="budget">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
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
                  <form.Field name="color">
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

               <div className="flex justify-end">
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           disabled={
                              !formState.canSubmit ||
                              formState.isSubmitting ||
                              createCategory.isPending
                           }
                           type="submit"
                        >
                           {createCategory.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           )}
                           {translate(
                              "dashboard.routes.onboarding.actions.complete",
                           )}
                        </Button>
                     )}
                  </form.Subscribe>
               </div>
            </form>
         </CardContent>
      </Card>
   );
}
