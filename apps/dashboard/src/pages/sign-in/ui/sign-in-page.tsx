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
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { PasswordInput } from "@packages/ui/components/password-input";
import { Separator } from "@packages/ui/components/separator";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

export function SignInPage() {
   const schema = z.object({
      email: z.email(translate("common.validation.email")),
      password: z
         .string()
         .min(
            8,
            translate("common.validation.min-length").replace("{min}", "8"),
         ),
   });
   const trpc = useTRPC();
   const router = useRouter();

   const handleGoogleSignIn = useCallback(async () => {
      try {
         await betterAuthClient.signIn.social({
            callbackURL: `${window.location.origin}/auth/sign-in`,
            provider: "google",
         });
      } catch (error) {
         console.error("Google sign-in failed:", error);
      }
   }, []);
   const signInMutation = useMutation(
      trpc.auth.signIn.mutationOptions({
         onError: (error) => {
            toast.error(error.message);
         },
         onSuccess: async () => {
            await router.navigate({ params: { slug: "" }, to: "/$slug/home" });
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         email: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await signInMutation.mutateAsync(value);
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

   const TermsAndPrivacyText = () => {
      const text = translate(
         "dashboard.routes.sign-in.texts.terms-and-privacy",
      ).split("{split}");

      return (
         <>
            <span>{text[0]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://contentagen.com/terms-of-service"
               rel="noopener noreferrer"
               target="_blank"
            >
               {translate("dashboard.routes.sign-in.texts.terms-of-service")}
            </a>
            <span>{text[1]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://contentagen.com/privacy-policy"
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
      <section className="space-y-4">
         <Card>
            <CardHeader className="text-center">
               <CardTitle className="text-3xl">
                  {translate("dashboard.routes.sign-in.title")}
               </CardTitle>
               <CardDescription>
                  {translate("dashboard.routes.sign-in.description")}
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Button
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  variant="outline"
               >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <title>Google</title>
                     <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                     />
                  </svg>
                  <span>
                     {translate(
                        "dashboard.routes.sign-in.actions.google-sign-in",
                     )}
                  </span>
               </Button>
               <Separator />
               <form className="space-y-4 " onSubmit={handleSubmit}>
                  <FieldGroup>
                     <form.Field name="email">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate("common.form.email.label")}
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
                                       "common.form.email.placeholder",
                                    )}
                                    type="email"
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
                     </form.Field>
                  </FieldGroup>
                  <FieldGroup>
                     <form.Field name="password">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <div className="flex justify-between items-center">
                                    <FieldLabel htmlFor={field.name}>
                                       {translate("common.form.password.label")}
                                    </FieldLabel>
                                    <Link
                                       className="underline text-sm  text-muted-foreground"
                                       to="/auth/forgot-password"
                                    >
                                       {translate(
                                          "dashboard.routes.sign-in.actions.forgot-password",
                                       )}
                                    </Link>
                                 </div>

                                 <PasswordInput
                                    autoComplete="current-password"
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
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           );
                        }}
                     </form.Field>
                  </FieldGroup>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           className=" w-full flex gap-2 items-center justify-center"
                           disabled={
                              !formState.canSubmit || formState.isSubmitting
                           }
                           type="submit"
                        >
                           {translate("common.actions.submit")}
                           <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                     )}
                  </form.Subscribe>
               </form>
            </CardContent>
            <CardFooter className="text-sm space-y-2 flex flex-col justify-center items-center">
               <div className="w-full  flex gap-1 justify-center items-center">
                  <span>
                     {translate("dashboard.routes.sign-in.texts.no-account")}
                  </span>
                  <Link
                     className="underline text-muted-foreground"
                     to="/auth/sign-up"
                  >
                     {translate("dashboard.routes.sign-in.actions.sign-up")}
                  </Link>
               </div>
            </CardFooter>
         </Card>
         <FieldDescription className="text-center">
            <TermsAndPrivacyText />
         </FieldDescription>
      </section>
   );
}
