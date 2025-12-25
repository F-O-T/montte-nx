import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";

const steps = [
   { id: "basic-info", title: "basic-info" },
   { id: "password", title: "password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function SignUpPage() {
   const router = useRouter();
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.email(translate("common.validation.email")),
         name: z
            .string()
            .min(
               2,
               translate("common.validation.min-length").replace("{min}", "2"),
            ),
         password: z
            .string()
            .min(
               8,
               translate("common.validation.min-length").replace("{min}", "8"),
            ),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: translate("common.validation.password-mismatch"),
         path: ["confirmPassword"],
      });

   const handleSignUp = useCallback(
      async (email: string, name: string, password: string) => {
         await betterAuthClient.signUp.email(
            {
               email,
               name,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(error.message);
               },
               onRequest: () => {
                  toast.loading(
                     translate("dashboard.routes.sign-up.messages.requesting"),
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate("dashboard.routes.sign-up.messages.success"),
                  );
                  router.navigate({
                     search: { email },
                     to: "/auth/email-verification",
                  });
               },
            },
         );
      },
      [router.navigate],
   );

   const form = useForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         name: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         const { email, name, password } = value;
         await handleSignUp(email, name, password);
         formApi.reset();
      },
      validators: {
         onBlur: schema,
         onChange: schema,
      },
   });

   const handleSubmit = useCallback(
      async (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         
         const validationErrors = await form.validateAllFields("change");
         
         if (validationErrors.length === 0) {
            form.handleSubmit();
         }
      },
      [form],
   );

   function BasicInfoStep() {
      return (
         <>
            <FieldGroup>
               <form.Field 
                  name="name"
                  validators={{
                     onChange: z
                        .string()
                        .min(
                           2,
                           translate("common.validation.min-length").replace("{min}", "2"),
                        ),
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name} required>
                              {translate("common.form.name.label")}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="name"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.name.placeholder",
                              )}
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors.map(e => typeof e === 'string' ? { message: e } : e)} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <FieldGroup>
               <form.Field 
                  name="email"
                  validators={{
                     onChange: z.string().email(translate("common.validation.email")),
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name} required>
                              {translate("common.form.email.label")}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="email"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.email.placeholder",
                              )}
                              type="email"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors.map(e => typeof e === 'string' ? { message: e } : e)} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
         </>
      );
   }

   // Internal component for password step
   function PasswordStep() {
      return (
         <>
            <FieldGroup>
               <form.Field 
                  name="password"
                  validators={{
                     onChange: z
                        .string()
                        .min(
                           8,
                           translate("common.validation.min-length").replace("{min}", "8"),
                        ),
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name} required>
                              {translate("common.form.password.label")}
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.password.placeholder",
                              )}
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors.map(e => typeof e === 'string' ? { message: e } : e)} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <FieldGroup>
               <form.Field 
                  name="confirmPassword"
                  validators={{
                     onChange: ({ value, fieldApi }) => {
                        if (!value) {
                           return translate("common.validation.required");
                        }
                        const password = fieldApi.form.getFieldValue("password");
                        if (value && password && value !== password) {
                           return translate("common.validation.password-mismatch");
                        }
                        return undefined;
                     },
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name} required>
                              {translate("common.form.confirm-password.label")}
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.confirm-password.placeholder",
                              )}
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors.map(e => typeof e === 'string' ? { message: e } : e)} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
         </>
      );
   }
   const TermsAndPrivacyText = () => {
      const text = translate(
         "dashboard.routes.sign-in.texts.terms-and-privacy",
      ).split("{split}");

      return (
         <>
            <span>{text[0]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://montte.co/terms-of-service"
               rel="noopener noreferrer"
               target="_blank"
            >
               {translate("dashboard.routes.sign-in.texts.terms-of-service")}
            </a>
            <span>{text[1]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://montte.co/privacy-policy"
               rel="noopener noreferrer"
               target="_blank"
            >
               {translate("dashboard.routes.sign-in.texts.privacy-policy")}
            </a>
            <span>{text[2]}</span>
         </>
      );
   };

   return (
      <Stepper.Provider>
         {({ methods }) => (
            <section className="space-y-6 w-full">
               {/* Header */}
               <div className="text-center space-y-2">
                  <h1 className="text-3xl font-semibold font-serif">
                     {translate("dashboard.routes.sign-up.title")}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                     {translate("dashboard.routes.sign-up.description")}
                  </p>
               </div>

               {/* Form */}
               <div className="space-y-6">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id}></Stepper.Step>
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "basic-info": () => <BasicInfoStep />,
                        password: () => <PasswordStep />,
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           className="h-11"
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
                                    className="h-11"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate("common.actions.submit")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <Button
                              className="h-11"
                              onClick={async (e) => {
                                 e.preventDefault();
                                 e.stopPropagation();

                                 const validationErrors = await form.validateAllFields("change");

                                 if (validationErrors.length === 0) {
                                    methods.next();
                                 }
                              }}
                              type="button"
                           >
                              {translate("common.actions.next")}
                           </Button>
                        )}
                     </Stepper.Controls>
                  </form>
               </div>

               {/* Footer */}
               <div className="text-sm text-center space-y-4">
                  <div className="flex gap-1 justify-center items-center">
                     <span>
                        {translate(
                           "dashboard.routes.sign-up.texts.have-account",
                        )}
                     </span>
                     <Link
                        className="text-primary font-medium hover:underline"
                        to="/auth/sign-in"
                     >
                        {translate("dashboard.routes.sign-up.actions.sign-in")}
                     </Link>
                  </div>
                  <FieldDescription className="text-center">
                     <TermsAndPrivacyText />
                  </FieldDescription>
               </div>
            </section>
         )}
      </Stepper.Provider>
   );
}
