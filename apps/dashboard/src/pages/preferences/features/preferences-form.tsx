import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/integrations/clients";

interface PreferencesFormProps {
   initialPreferences?: {
      id: string;
      userId: string;
      currency: string;
      createdAt: Date;
      updatedAt: Date;
   };
}

const CURRENCY_OPTIONS = [
   { code: "USD", name: "US Dollar", symbol: "$" },
   { code: "EUR", name: "Euro", symbol: "€" },
   { code: "GBP", name: "British Pound", symbol: "£" },
   { code: "BRL", name: "Brazilian Real", symbol: "R$" },
   { code: "JPY", name: "Japanese Yen", symbol: "¥" },
   { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
   { code: "AUD", name: "Australian Dollar", symbol: "A$" },
   { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
   { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
   { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
   const queryClient = useQueryClient();

   const updatePreferencesMutation = useMutation(
      trpc.preferences.update.mutationOptions({
         onSuccess: () => {
            // Invalidate and refetch preferences
            queryClient.invalidateQueries({
               queryKey: trpc.preferences.get.queryKey(),
            });
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         currency: initialPreferences?.currency || "USD",
      },
      onSubmit: async ({ value }) => {
         try {
            await updatePreferencesMutation.mutateAsync({
               currency: value.currency,
            });
         } catch (error) {
            console.error("Failed to update preferences:", error);
         }
      },
   });

   return (
      <div className="max-w-md space-y-6">
         <div>
            <h2 className="text-lg font-semibold">Currency Settings</h2>
            <p className="text-sm text-muted-foreground">
               Choose your preferred currency for transactions and displays.
            </p>
         </div>

         <form
            className="space-y-4"
            onSubmit={(e) => {
               e.preventDefault();
               e.stopPropagation();
               form.handleSubmit();
            }}
         >
            <FieldGroup>
               <form.Field name="currency">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>Currency</FieldLabel>
                           <Select
                              onValueChange={(value) =>
                                 field.handleChange(value)
                              }
                              value={field.state.value}
                           >
                              <SelectTrigger>
                                 <SelectValue placeholder="Select a currency" />
                              </SelectTrigger>
                              <SelectContent>
                                 {CURRENCY_OPTIONS.map((currency) => (
                                    <SelectItem
                                       key={currency.code}
                                       value={currency.code}
                                    >
                                       <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm">
                                             {currency.symbol}
                                          </span>
                                          <span>{currency.name}</span>
                                          <span className="text-muted-foreground text-xs">
                                             ({currency.code})
                                          </span>
                                       </div>
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <form.Subscribe>
               {(state) => (
                  <Button
                     className="w-full"
                     disabled={
                        !state.canSubmit ||
                        state.isSubmitting ||
                        updatePreferencesMutation.isPending
                     }
                     type="submit"
                  >
                     {state.isSubmitting || updatePreferencesMutation.isPending
                        ? "Saving..."
                        : "Save Preferences"}
                  </Button>
               )}
            </form.Subscribe>
         </form>
      </div>
   );
}
