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
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSeparator,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useTRPC } from "@/integrations/clients";

const steps = [
   { id: "enter-email", title: "enter-email" },
   { id: "enter-otp", title: "enter-otp" },
   { id: "enter-password", title: "enter-password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function ForgotPasswordPage() {
   const router = useRouter();
   const trpc = useTRPC();
   const [sendingOtp, setSendingOtp] = useState(false);
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.email(translate("common.validation.email")),
         otp: z
            .string()
            .min(
               6,
               translate("common.validation.min-length").replace("{min}", "6"),
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

   const sendOtpMutation = useMutation(
      trpc.auth.sendVerificationOTP.mutationOptions({
         onError: (error) => {
            setSendingOtp(false);
            toast.error(error.message, {
               id: "send-otp-toast",
            });
         },
         onSuccess: (_data) => {
            setSendingOtp(false);
            toast.success("OTP sent successfully", {
               id: "send-otp-toast",
            });
         },
      }),
   );

   const resetPasswordMutation = useMutation(
      trpc.auth.resetPassword.mutationOptions({
         onError: (error) => {
            toast.error(error.message, {
               id: "forgot-password-toast",
            });
         },
         onSuccess: (data) => {
            toast.success(data.message, {
               id: "forgot-password-toast",
            });
            router.navigate({
               to: "/auth/sign-in",
            });
         },
      }),
   );

   const handleResetPassword = useCallback(
      async ({
         email,
         otp,
         password,
      }: {
         email: string;
         otp: string;
         password: string;
      }) => {
         await resetPasswordMutation.mutateAsync({
            email,
            otp,
            password,
         });
      },
      [resetPasswordMutation],
   );
   const form = useForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         otp: "",
         password: "",
      },
      onSubmit: async ({ value }) => {
         await handleResetPassword(value);
      },
      validators: {
         onBlur: schema,
      },
   });

   const sendOtp = useCallback(
      async (email: string) => {
         await sendOtpMutation.mutateAsync({
            email,
            type: "forget-password",
         });
      },
      [sendOtpMutation],
   );
   const handleSubmit = useCallback(
      (e: React.FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   function EmailStep() {
      return (
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
                           onChange={(e) => field.handleChange(e.target.value)}
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
      );
   }

   function OtpStep() {
      return (
         <FieldGroup>
            <form.Field name="otp">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           {translate("common.form.otp.label")}
                        </FieldLabel>
                        <InputOTP
                           aria-invalid={isInvalid}
                           autoComplete="one-time-code"
                           id={field.name}
                           maxLength={6}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={field.handleChange}
                           value={field.state.value}
                        >
                           <div className="w-full flex justify-center items-center gap-2">
                              <InputOTPGroup>
                                 <InputOTPSlot index={0} />
                                 <InputOTPSlot index={1} />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                 <InputOTPSlot index={2} />
                                 <InputOTPSlot index={3} />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                 <InputOTPSlot index={4} />
                                 <InputOTPSlot index={5} />
                              </InputOTPGroup>
                           </div>
                        </InputOTP>
                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>
         </FieldGroup>
      );
   }

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
                  <CardTitle className="text-3xl ">
                     {translate("dashboard.routes.forgot-password.title")}
                  </CardTitle>
                  <CardDescription className="">
                     {methods.current.id === "enter-email"
                        ? translate(
                             "dashboard.routes.forgot-password.descriptions.enter-email",
                          )
                        : methods.current.id === "enter-otp"
                          ? translate(
                               "dashboard.routes.forgot-password.descriptions.enter-otp",
                            )
                          : translate(
                               "dashboard.routes.forgot-password.descriptions.enter-password",
                            )}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id} />
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "enter-email": () => <EmailStep />,
                        "enter-otp": () => <OtpStep />,
                        "enter-password": () => <PasswordStep />,
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
                                    className="shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting ||
                                       resetPasswordMutation.isPending
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate(
                                       "dashboard.routes.forgot-password.actions.reset-password",
                                    )}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : methods.current.id === "enter-email" ? (
                           <form.Subscribe
                              selector={(state) => ({
                                 emailValid: state.fieldMeta.email?.isValid,
                                 emailValue: state.values.email,
                              })}
                           >
                              {({ emailValid, emailValue }) => (
                                 <Button
                                    disabled={!emailValid || sendingOtp}
                                    onClick={async () => {
                                       await sendOtp(emailValue);
                                       methods.next();
                                    }}
                                    type="button"
                                 >
                                    {translate("common.actions.next")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <Button onClick={methods.next} type="button">
                              {translate("common.actions.next")}
                           </Button>
                        )}
                     </Stepper.Controls>
                  </form>
               </CardContent>
               <CardFooter className="text-sm flex gap-1 items-center justify-center">
                  <span>
                     {translate(
                        "dashboard.routes.forgot-password.texts.remembered-password",
                     )}
                  </span>
                  <Link
                     className=" underline text-muted-foreground"
                     to="/auth/sign-in"
                  >
                     {translate(
                        "dashboard.routes.forgot-password.actions.sign-in",
                     )}
                  </Link>
               </CardFooter>
            </Card>
         )}
      </Stepper.Provider>
   );
}
