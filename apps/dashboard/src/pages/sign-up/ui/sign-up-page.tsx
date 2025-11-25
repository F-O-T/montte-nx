import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
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
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { useTRPC } from "@/integrations/clients";

const steps = [
   { id: "basic-info", title: "basic-info" },
   { id: "password", title: "password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function SignUpPage() {
   const trpc = useTRPC();
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

   const signUpMutation = useMutation(
      trpc.auth.signUp.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: async (_, variables) => {
            router.navigate({
               search: { email: variables.email },
               to: "/auth/email-verification",
            });
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         name: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await signUpMutation.mutateAsync(value);
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

   function BasicInfoStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
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
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <FieldGroup>
               <form.Field name="email">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
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
                              <FieldError errors={field.state.meta.errors} />
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
               <form.Field name="password">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
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
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <FieldGroup>
               <form.Field name="confirmPassword">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
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
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
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
                  <CardTitle className="text-3xl  ">
                     {translate("dashboard.routes.sign-up.title")}
                  </CardTitle>
                  <CardDescription>
                     {translate("dashboard.routes.sign-up.description")}
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
                        "basic-info": () => <BasicInfoStep />,
                        password: () => <PasswordStep />,
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
                                    className=" flex gap-2 items-center justify-center"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting ||
                                       signUpMutation.isPending
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
                                 emailValid: state.fieldMeta.email?.isValid,
                                 nameValid: state.fieldMeta.name?.isValid,
                              })}
                           >
                              {({ nameValid, emailValid }) => (
                                 <Button
                                    disabled={!nameValid || !emailValid}
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
               <CardFooter className=" text-sm flex gap-1 items-center justify-center">
                  <span>
                     {translate("dashboard.routes.sign-up.texts.have-account")}
                  </span>
                  <Link
                     className="underline text-muted-foreground"
                     to="/auth/sign-in"
                  >
                     {translate("dashboard.routes.sign-up.actions.sign-in")}
                  </Link>
               </CardFooter>
            </Card>
         )}
      </Stepper.Provider>
   );
}
