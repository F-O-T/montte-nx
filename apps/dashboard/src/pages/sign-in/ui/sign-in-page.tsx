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
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

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
   const router = useRouter();
   const [isGoogleLoading, setIsGoogleLoading] = useState(false);

   const handleGoogleSignIn = useCallback(async () => {
      await betterAuthClient.signIn.social(
         {
            callbackURL: `${window.location.origin}/auth/sign-in`,
            provider: "google",
         },
         {
            onError: ({ error }) => {
               setIsGoogleLoading(false);
               toast.error(error.message);
            },
            onRequest: () => {
               setIsGoogleLoading(true);
               toast.loading(
                  translate(
                     "dashboard.routes.sign-in.messages.google-requesting",
                  ),
               );
            },
         },
      );
   }, []);
   const handleSignIn = useCallback(
      async (email: string, password: string) => {
         await betterAuthClient.signIn.email(
            {
               email,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(error.message);
               },
               onRequest: () => {
                  toast.loading(
                     translate("dashboard.routes.sign-in.messages.requesting"),
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate("dashboard.routes.sign-in.messages.success"),
                  );
                  router.navigate({ params: { slug: "" }, to: "/$slug/home" });
               },
            },
         );
      },
      [router.navigate],
   );
   const form = useForm({
      defaultValues: {
         email: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         const { email, password } = value;
         await handleSignIn(email, password);
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
      <section className="space-y-6 w-full ">
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               {translate("dashboard.routes.sign-in.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
               {translate("dashboard.routes.sign-in.description")}
            </p>
         </div>

         <div className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                                 <FieldError errors={field.state.meta.errors} />
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
                           <Field aria-required data-invalid={isInvalid}>
                              <div className="flex justify-between items-center">
                                 <FieldLabel htmlFor={field.name}>
                                    {translate("common.form.password.label")}
                                 </FieldLabel>
                                 <Link
                                    className="underline text-sm text-muted-foreground"
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
                        className="w-full"
                        disabled={
                           !formState.canSubmit || formState.isSubmitting
                        }
                        type="submit"
                     >
                        {translate("dashboard.routes.sign-in.actions.sign-in")}
                     </Button>
                  )}
               </form.Subscribe>
            </form>

            <div className="relative">
               <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                     {translate(
                        "dashboard.routes.sign-in.texts.or-continue-with",
                     )}
                  </span>
               </div>
            </div>

            <Button
               className="w-full"
               disabled={isGoogleLoading}
               onClick={handleGoogleSignIn}
               variant="outline"
            >
               {isGoogleLoading ? (
                  <Spinner />
               ) : (
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <title>Google</title>
                     <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                     />
                  </svg>
               )}
               <span>Google</span>
            </Button>
         </div>

         <div className="text-sm text-center space-y-6">
            <div className="flex gap-1 justify-center items-center">
               <span>
                  {translate("dashboard.routes.sign-in.texts.no-account")}
               </span>
               <Link
                  className="text-primary hover:underline"
                  to="/auth/sign-up"
               >
                  {translate("dashboard.routes.sign-in.actions.sign-up")}
               </Link>
            </div>
            <FieldDescription className="text-center">
               <TermsAndPrivacyText />
            </FieldDescription>
         </div>
      </section>
   );
}
