/**
 * Encryption Unlock Dialog
 *
 * Shown when E2E encryption is enabled but the key is not available.
 * Prompts the user to enter their passphrase to unlock encrypted data.
 */

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import {
   Field,
   FieldDescription,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { Loader2, Lock } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useEncryptionContext } from "../hooks/use-encryption-context";

interface EncryptionUnlockDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function EncryptionUnlockDialog({
   open,
   onOpenChange,
}: EncryptionUnlockDialogProps) {
   const { unlock } = useEncryptionContext();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const schema = z.object({
      passphrase: z
         .string()
         .min(
            1,
            translate(
               "dashboard.routes.settings.encryption.errors.passphrase-required",
            ),
         ),
      rememberDevice: z.boolean(),
   });

   const form = useForm({
      defaultValues: {
         passphrase: "",
         rememberDevice: false,
      },
      validators: {
         onBlur: schema,
         onChange: schema,
      },
      onSubmit: async ({ value }) => {
         setIsSubmitting(true);
         setError(null);

         try {
            const success = await unlock(
               value.passphrase,
               value.rememberDevice,
            );
            if (success) {
               onOpenChange(false);
               toast.success(
                  translate(
                     "dashboard.routes.settings.encryption.unlock.success",
                  ),
               );
            } else {
               setError(
                  translate(
                     "dashboard.routes.settings.encryption.unlock.invalid-passphrase",
                  ),
               );
            }
         } catch (_err) {
            setError(
               translate("dashboard.routes.settings.encryption.unlock.error"),
            );
         } finally {
            setIsSubmitting(false);
         }
      },
   });

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      await form.validateAllFields("change");
      
      if (form.state.canSubmit) {
         form.handleSubmit();
      }
   };

   return (
      <Dialog onOpenChange={onOpenChange} open={open}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <Lock className="size-5" />
                  {translate(
                     "dashboard.routes.settings.encryption.unlock.title",
                  )}
               </DialogTitle>
               <DialogDescription>
                  {translate(
                     "dashboard.routes.settings.encryption.unlock.description",
                  )}
               </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
               <form.Field name="passphrase">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched &&
                        !field.state.meta.isValid;
                     return (
                        <FieldGroup>
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 {translate(
                                    "dashboard.routes.settings.encryption.passphrase",
                                 )}
                              </FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 autoComplete="current-password"
                                 autoFocus
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    setError(null);
                                 }}
                                 placeholder={translate(
                                    "dashboard.routes.settings.encryption.passphrase-placeholder",
                                 )}
                                 type="password"
                                 value={field.state.value}
                              />
                              {isInvalid && field.state.meta.errors.length > 0 && (
                                 <FieldDescription className="text-destructive">
                                    {String(field.state.meta.errors[0])}
                                 </FieldDescription>
                              )}
                              {error && (
                                 <FieldDescription className="text-destructive">
                                    {error}
                                 </FieldDescription>
                              )}
                           </Field>
                        </FieldGroup>
                     );
                  }}
               </form.Field>

               <form.Field name="rememberDevice">
                  {(field) => (
                     <div className="flex items-center space-x-2">
                        <Checkbox
                           checked={field.state.value}
                           id={field.name}
                           onCheckedChange={(checked) =>
                              field.handleChange(checked === true)
                           }
                        />
                        <label
                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                           htmlFor={field.name}
                        >
                           {translate(
                              "dashboard.routes.settings.encryption.unlock.remember-device",
                           )}
                        </label>
                     </div>
                  )}
               </form.Field>

               <DialogFooter>
                  <Button onClick={() => onOpenChange(false)} variant="outline" type="button">
                     {translate("common.actions.cancel")}
                  </Button>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           disabled={isSubmitting || !formState.values.passphrase}
                           type="submit"
                        >
                           {isSubmitting && (
                              <Loader2 className="size-4 mr-2 animate-spin" />
                           )}
                           {translate(
                              "dashboard.routes.settings.encryption.unlock.button",
                           )}
                        </Button>
                     )}
                  </form.Subscribe>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

/**
 * Auto-show unlock dialog component
 * Shows automatically when E2E is enabled but not unlocked
 */
export function EncryptionUnlockPrompt() {
   const { needsUnlock, e2eEnabled } = useEncryptionContext();
   const [dismissed, setDismissed] = useState(false);

   if (!e2eEnabled || !needsUnlock || dismissed) {
      return null;
   }

   return (
      <EncryptionUnlockDialog
         onOpenChange={(open) => {
            if (!open) {
               setDismissed(true);
            }
         }}
         open={true}
      />
   );
}
