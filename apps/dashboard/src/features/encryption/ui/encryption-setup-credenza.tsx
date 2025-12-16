/**
 * Encryption Setup Credenza
 *
 * Multi-step wizard for setting up E2E encryption.
 */

import { translate } from "@packages/localization";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle, CheckCircle2, Loader2, Lock, Shield } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useCredenza } from "@/hooks/use-credenza";

type Step = "intro" | "passphrase" | "confirm" | "success";

interface EncryptionSetupCredenzaProps {
   enableE2E: (passphrase: string) => Promise<boolean>;
}

export function EncryptionSetupCredenza({ enableE2E }: EncryptionSetupCredenzaProps) {
   const { closeCredenza } = useCredenza();
   const [step, setStep] = useState<Step>("intro");
   const [isSubmitting, setIsSubmitting] = useState(false);

   const form = useForm({
      defaultValues: {
         passphrase: "",
         confirmPassphrase: "",
      },
      onSubmit: async ({ value }) => {
         if (value.passphrase !== value.confirmPassphrase) {
            toast.error(translate("dashboard.routes.settings.encryption.errors.passphrase-mismatch"));
            return;
         }

         if (value.passphrase.length < 8) {
            toast.error(translate("dashboard.routes.settings.encryption.errors.passphrase-too-short"));
            return;
         }

         setIsSubmitting(true);
         try {
            const success = await enableE2E(value.passphrase);
            if (success) {
               setStep("success");
            } else {
               toast.error(translate("dashboard.routes.settings.encryption.errors.setup-failed"));
            }
         } catch (error) {
            toast.error(translate("dashboard.routes.settings.encryption.errors.setup-failed"));
         } finally {
            setIsSubmitting(false);
         }
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   if (step === "intro") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  {translate("dashboard.routes.settings.encryption.setup.title")}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate("dashboard.routes.settings.encryption.setup.description")}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody className="space-y-4">
               <Alert>
                  <Lock className="size-4" />
                  <AlertTitle>
                     {translate("dashboard.routes.settings.encryption.setup.how-it-works")}
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                     <p>{translate("dashboard.routes.settings.encryption.setup.how-it-works-description")}</p>
                  </AlertDescription>
               </Alert>

               <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>
                     {translate("dashboard.routes.settings.encryption.setup.warning-title")}
                  </AlertTitle>
                  <AlertDescription>
                     <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li>{translate("dashboard.routes.settings.encryption.setup.warning-1")}</li>
                        <li>{translate("dashboard.routes.settings.encryption.setup.warning-2")}</li>
                        <li>{translate("dashboard.routes.settings.encryption.setup.warning-3")}</li>
                     </ul>
                  </AlertDescription>
               </Alert>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => closeCredenza()} variant="outline">
                  {translate("common.actions.cancel")}
               </Button>
               <Button onClick={() => setStep("passphrase")}>
                  {translate("common.actions.continue")}
               </Button>
            </CredenzaFooter>
         </>
      );
   }

   if (step === "passphrase") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("dashboard.routes.settings.encryption.setup.create-passphrase")}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate("dashboard.routes.settings.encryption.setup.create-passphrase-description")}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <form className="space-y-4" onSubmit={handleSubmit}>
                  <form.Field name="passphrase">
                     {(field) => (
                        <FieldGroup>
                           <Field>
                              <FieldLabel>
                                 {translate("dashboard.routes.settings.encryption.passphrase")}
                              </FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 type="password"
                                 autoComplete="new-password"
                                 onBlur={field.handleBlur}
                                 onChange={(e) => field.handleChange(e.target.value)}
                                 value={field.state.value}
                                 placeholder={translate("dashboard.routes.settings.encryption.passphrase-placeholder")}
                              />
                              <FieldDescription>
                                 {translate("dashboard.routes.settings.encryption.passphrase-hint")}
                              </FieldDescription>
                           </Field>
                        </FieldGroup>
                     )}
                  </form.Field>

                  <form.Field name="confirmPassphrase">
                     {(field) => (
                        <FieldGroup>
                           <Field>
                              <FieldLabel>
                                 {translate("dashboard.routes.settings.encryption.confirm-passphrase")}
                              </FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 type="password"
                                 autoComplete="new-password"
                                 onBlur={field.handleBlur}
                                 onChange={(e) => field.handleChange(e.target.value)}
                                 value={field.state.value}
                                 placeholder={translate("dashboard.routes.settings.encryption.confirm-passphrase-placeholder")}
                              />
                           </Field>
                        </FieldGroup>
                     )}
                  </form.Field>
               </form>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => setStep("intro")} variant="outline">
                  {translate("common.actions.back")}
               </Button>
               <form.Subscribe>
                  {(formState) => (
                     <Button
                        disabled={
                           isSubmitting ||
                           !formState.values.passphrase ||
                           !formState.values.confirmPassphrase
                        }
                        onClick={() => setStep("confirm")}
                     >
                        {translate("common.actions.continue")}
                     </Button>
                  )}
               </form.Subscribe>
            </CredenzaFooter>
         </>
      );
   }

   if (step === "confirm") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("dashboard.routes.settings.encryption.setup.confirm-title")}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate("dashboard.routes.settings.encryption.setup.confirm-description")}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>
                     {translate("dashboard.routes.settings.encryption.setup.final-warning-title")}
                  </AlertTitle>
                  <AlertDescription>
                     {translate("dashboard.routes.settings.encryption.setup.final-warning-description")}
                  </AlertDescription>
               </Alert>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => setStep("passphrase")} variant="outline">
                  {translate("common.actions.back")}
               </Button>
               <Button
                  disabled={isSubmitting}
                  onClick={() => form.handleSubmit()}
               >
                  {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {translate("dashboard.routes.settings.encryption.setup.enable-button")}
               </Button>
            </CredenzaFooter>
         </>
      );
   }

   if (step === "success") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  {translate("dashboard.routes.settings.encryption.setup.success-title")}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate("dashboard.routes.settings.encryption.setup.success-description")}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <Alert>
                  <Shield className="size-4" />
                  <AlertTitle>
                     {translate("dashboard.routes.settings.encryption.setup.next-steps-title")}
                  </AlertTitle>
                  <AlertDescription>
                     <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li>{translate("dashboard.routes.settings.encryption.setup.next-step-1")}</li>
                        <li>{translate("dashboard.routes.settings.encryption.setup.next-step-2")}</li>
                     </ul>
                  </AlertDescription>
               </Alert>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => closeCredenza()}>
                  {translate("common.actions.done")}
               </Button>
            </CredenzaFooter>
         </>
      );
   }

   return null;
}
