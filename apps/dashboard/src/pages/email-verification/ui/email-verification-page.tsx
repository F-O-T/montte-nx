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
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSeparator,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { useTRPC } from "@/integrations/clients";

export function EmailVerificationPage() {
   const email = useSearch({
      from: "/auth/email-verification",
      select: (s) => s.email,
   });
   const schema = z.object({
      otp: z
         .string()
         .min(
            6,
            translate("common.validation.min-length").replace("{min}", "6"),
         )
         .max(6),
   });

   const router = useRouter();
   const trpc = useTRPC();

   const sendVerificationOTPMutation = useMutation(
      trpc.auth.sendVerificationOTP.mutationOptions({
         onError: (error) => {
            toast.error(error.message, {
               id: "verification-code-toast",
            });
         },
      }),
   );

   const handleResendEmail = useCallback(async () => {
      await sendVerificationOTPMutation.mutateAsync({
         email,
         type: "email-verification",
      });
   }, [email, sendVerificationOTPMutation]);
   const verifyEmailMutation = useMutation(
      trpc.auth.verifyEmail.mutationOptions({
         onError: (error) => {
            toast.error(error.message, {
               id: "email-verification-toast",
            });
         },
      }),
   );

   const handleVerifyEmail = useCallback(
      async (value: z.infer<typeof schema>) => {
         await verifyEmailMutation.mutateAsync({
            email,
            otp: value.otp,
         });
      },
      [email, verifyEmailMutation],
   );
   const form = useForm({
      defaultValues: {
         otp: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleVerifyEmail(value);
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

   return (
      <Card>
         <CardHeader className="text-center">
            <CardTitle className="text-3xl ">
               {translate("dashboard.routes.email-verification.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.email-verification.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <form
               className="space-y-4"
               onSubmit={(e) => {
                  handleSubmit(e);
               }}
            >
               <FieldGroup>
                  <form.Field name="otp">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field
                              className="flex flex-col items-center"
                              data-invalid={isInvalid}
                           >
                              <FieldLabel>
                                 {translate("common.form.otp.label")}
                              </FieldLabel>
                              <InputOTP
                                 aria-invalid={isInvalid}
                                 autoComplete="one-time-code"
                                 className="gap-2"
                                 maxLength={6}
                                 onBlur={field.handleBlur}
                                 onChange={field.handleChange}
                                 value={field.state.value}
                              >
                                 <div className="w-full flex gap-2 items-center justify-center">
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
               <form.Subscribe>
                  {(formState) => (
                     <Button
                        className="w-full flex gap-2 items-center justify-center"
                        disabled={
                           !formState.canSubmit ||
                           formState.isSubmitting ||
                           verifyEmailMutation.isPending
                        }
                        type="submit"
                     >
                        {translate("common.actions.submit")}
                        <ArrowRight className="w-4 h-4 " />
                     </Button>
                  )}
               </form.Subscribe>
            </form>
         </CardContent>
         <CardFooter>
            <Button
               className="w-full text-muted-foreground flex gap-2 items-center justify-center"
               disabled={sendVerificationOTPMutation.isPending}
               onClick={handleResendEmail}
               variant="link"
            >
               {translate("dashboard.routes.email-verification.actions.resend")}
            </Button>
         </CardFooter>
      </Card>
   );
}
