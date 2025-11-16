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
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";
import type { BankAccount } from "@packages/database/repositories/bank-account-repository";

interface EditBankAccountSheetProps {
   bankAccount: BankAccount;
   asChild?: boolean;
}

export function EditBankAccountSheet({
   bankAccount,
   asChild = false,
}: EditBankAccountSheetProps) {
   const [isSheetOpen, setIsSheetOpen] = useState(false);
   const queryClient = useQueryClient();

   const updateBankAccountMutation = useMutation(
      trpc.bankAccounts.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getAll.queryKey(),
            });
            toast.success(
               translate(
                  "dashboard.routes.profile.bank-accounts.edit.success",
               ),
            );
            setIsSheetOpen(false);
         },
         onError: (error) => {
            toast.error(
               error.message ||
                  translate(
                     "dashboard.routes.profile.bank-accounts.edit.error",
                  ),
            );
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         bank: bankAccount.bank,
         name: bankAccount.name,
         status: bankAccount.status as "active" | "inactive",
         type: bankAccount.type,
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.type || !value.bank) {
            return;
         }
         try {
            await updateBankAccountMutation.mutateAsync({
               data: {
                  bank: value.bank,
                  name: value.name,
                  status: value.status,
                  type: value.type,
               },
               id: bankAccount.id,
            });
         } catch (error) {
            console.error("Failed to update bank account:", error);
         }
      },
   });

   return (
      <Sheet onOpenChange={setIsSheetOpen} open={isSheetOpen}>
         <SheetTrigger asChild>
            {asChild ? (
               <DropdownMenuItem
                  onSelect={(e) => {
                     e.preventDefault();
                     setIsSheetOpen(true);
                  }}
               >
                  <Pencil className="mr-2 h-4 w-4" />
                  {translate("dashboard.routes.profile.bank-accounts.actions.edit")}
               </DropdownMenuItem>
            ) : (
               <Button variant="ghost" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  {translate("dashboard.routes.profile.bank-accounts.actions.edit")}
               </Button>
            )}
         </SheetTrigger>
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
                        "dashboard.routes.profile.bank-accounts.edit.title",
                     )}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "dashboard.routes.profile.bank-accounts.edit.description",
                        { name: bankAccount.name },
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
                              updateBankAccountMutation.isPending
                           }
                        >
                           {state.isSubmitting ||
                           updateBankAccountMutation.isPending
                              ? translate(
                                   "dashboard.routes.profile.bank-accounts.edit.updating",
                                )
                              : translate(
                                   "dashboard.routes.profile.bank-accounts.edit.submit",
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
