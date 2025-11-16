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
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

type AddBankAccountSheetProps = {
   onOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function AddBankAccountSheet({
   onOpen,
   onOpenChange,
}: AddBankAccountSheetProps) {
   const queryClient = useQueryClient();

   const createBankAccountMutation = useMutation(
      trpc.bankAccounts.create.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getAll.queryKey(),
            });
            toast.success(
               translate(
                  "dashboard.routes.profile.bank-accounts.create.success",
               ),
            );
            onOpenChange(false);
         },
         onError: (error) => {
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.profile.bank-accounts.create.error",
                  ),
            );
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         bank: "",
         name: "",
         status: "active" as "active" | "inactive",
         type: "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.type || !value.bank) {
            return;
         }
         try {
            await createBankAccountMutation.mutateAsync({
               bank: value.bank,
               name: value.name,
               status: value.status,
               type: value.type,
            });
         } catch (error) {
            console.error("Failed to create bank account:", error);
         }
      },
   });

   return (
      <Sheet onOpenChange={onOpenChange} open={onOpen}>
         <SheetContent>
            <form
               className="h-full flex flex-col"
               onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
               }}
            >
               <SheetHeader>
                  <SheetTitle>
                     {translate(
                        "dashboard.routes.profile.bank-accounts.create.title",
                     )}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "dashboard.routes.profile.bank-accounts.create.description",
                     )}
                  </SheetDescription>
               </SheetHeader>

               <div className="grid gap-4 px-4">
                  <FieldGroup>
                     <form.Field name="name">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.profile.bank-accounts.create.fields.name",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    placeholder={translate(
                                       "dashboard.routes.profile.bank-accounts.create.placeholders.name",
                                    )}
                                    value={field.state.value}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    onBlur={field.handleBlur}
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
                     <form.Field name="bank">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.profile.bank-accounts.create.fields.bank",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    placeholder={translate(
                                       "dashboard.routes.profile.bank-accounts.create.placeholders.bank",
                                    )}
                                    value={field.state.value}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    onBlur={field.handleBlur}
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.profile.bank-accounts.create.fields.type",
                                    )}
                                 </FieldLabel>
                                 <Select
                                    value={field.state.value}
                                    onValueChange={field.handleChange}
                                 >
                                    <SelectTrigger>
                                       <SelectValue
                                          placeholder={translate(
                                             "dashboard.routes.profile.bank-accounts.create.placeholders.type",
                                          )}
                                       />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="checking">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.create.types.checking",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="savings">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.create.types.savings",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="investment">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.create.types.investment",
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
                     <form.Field name="status">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.profile.bank-accounts.create.fields.status",
                                    )}
                                 </FieldLabel>
                                 <Select
                                    value={field.state.value}
                                    onValueChange={field.handleChange}
                                 >
                                    <SelectTrigger>
                                       <SelectValue
                                          placeholder={translate(
                                             "dashboard.routes.profile.bank-accounts.create.placeholders.status",
                                          )}
                                       />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="active">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.status.active",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="inactive">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.status.inactive",
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
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           type="submit"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createBankAccountMutation.isPending
                           }
                        >
                           {state.isSubmitting ||
                           createBankAccountMutation.isPending
                              ? translate(
                                   "dashboard.routes.profile.bank-accounts.create.creating",
                                )
                              : translate(
                                   "dashboard.routes.profile.bank-accounts.create.submit",
                                )}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
