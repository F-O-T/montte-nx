import type { Counterparty } from "@packages/database/repositories/counterparty-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type ManageCounterpartyFormProps = {
   counterparty?: Counterparty;
};

export function ManageCounterpartyForm({
   counterparty,
}: ManageCounterpartyFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const isEditMode = !!counterparty;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.counterparties.features.create-counterparty.description",
         ),
         title: translate(
            "dashboard.routes.counterparties.features.create-counterparty.title",
         ),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.counterparties.features.edit-counterparty.description",
            { name: counterparty?.name || "" },
         ),
         title: translate(
            "dashboard.routes.counterparties.features.edit-counterparty.title",
         ),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode, counterparty?.name]);

   const createCounterpartyMutation = useMutation(
      trpc.counterparties.create.mutationOptions({
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const updateCounterpartyMutation = useMutation(
      trpc.counterparties.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update counterparty:", error);
         },
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         document: counterparty?.document || "",
         email: counterparty?.email || "",
         name: counterparty?.name || "",
         notes: counterparty?.notes || "",
         phone: counterparty?.phone || "",
         type: (counterparty?.type || "client") as
            | "client"
            | "supplier"
            | "both",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.type) {
            return;
         }

         try {
            if (isEditMode && counterparty) {
               await updateCounterpartyMutation.mutateAsync({
                  data: {
                     document: value.document || undefined,
                     email: value.email || undefined,
                     name: value.name,
                     notes: value.notes || undefined,
                     phone: value.phone || undefined,
                     type: value.type,
                  },
                  id: counterparty.id,
               });
            } else {
               await createCounterpartyMutation.mutateAsync({
                  document: value.document || undefined,
                  email: value.email || undefined,
                  name: value.name,
                  notes: value.notes || undefined,
                  phone: value.phone || undefined,
                  type: value.type,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} counterparty:`,
               error,
            );
         }
      },
   });

   return (
      <form
         className="h-full flex flex-col"
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
         }}
      >
         <SheetHeader>
            <SheetTitle>{modeTexts.title}</SheetTitle>
            <SheetDescription>{modeTexts.description}</SheetDescription>
         </SheetHeader>
         <div className="grid gap-4 px-4 overflow-y-auto flex-1">
            <FieldGroup>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.counterparties.form.name.label",
                              )}
                           </FieldLabel>
                           <Input
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.counterparties.form.name.placeholder",
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
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.counterparties.form.type.label",
                              )}
                           </FieldLabel>
                           <Select
                              onValueChange={(value) =>
                                 field.handleChange(
                                    value as "client" | "supplier" | "both",
                                 )
                              }
                              value={field.state.value}
                           >
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="client">
                                    {translate(
                                       "dashboard.routes.counterparties.form.type.client",
                                    )}
                                 </SelectItem>
                                 <SelectItem value="supplier">
                                    {translate(
                                       "dashboard.routes.counterparties.form.type.supplier",
                                    )}
                                 </SelectItem>
                                 <SelectItem value="both">
                                    {translate(
                                       "dashboard.routes.counterparties.form.type.both",
                                    )}
                                 </SelectItem>
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

            <FieldGroup>
               <form.Field name="document">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.counterparties.form.document.label",
                              )}
                           </FieldLabel>
                           <Input
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.counterparties.form.document.placeholder",
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
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.counterparties.form.email.label",
                              )}
                           </FieldLabel>
                           <Input
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.counterparties.form.email.placeholder",
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
               <form.Field name="phone">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.counterparties.form.phone.label",
                              )}
                           </FieldLabel>
                           <Input
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.counterparties.form.phone.placeholder",
                              )}
                              type="tel"
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
               <form.Field name="notes">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.counterparties.form.notes.label",
                              )}
                           </FieldLabel>
                           <Textarea
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.counterparties.form.notes.placeholder",
                              )}
                              rows={3}
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
         </div>

         <SheetFooter>
            <form.Subscribe>
               {(state) => (
                  <Button
                     className="w-full"
                     disabled={
                        !state.canSubmit ||
                        state.isSubmitting ||
                        createCounterpartyMutation.isPending ||
                        updateCounterpartyMutation.isPending
                     }
                     type="submit"
                  >
                     {modeTexts.title}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </form>
   );
}
