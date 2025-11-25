import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BankAccountCombobox } from "@/features/bank-account/ui/bank-account-combobox";
import { useTRPC } from "@/integrations/clients";

type ManageBankAccountSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   bankAccount?: BankAccount; // If provided, edit mode. If not, create mode
   asChild?: boolean;
};

export function ManageBankAccountSheet({
   onOpen,
   onOpenChange,
   bankAccount,
   asChild = false,
}: ManageBankAccountSheetProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const isEditMode = !!bankAccount;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.profile.features.create-bank-account.description",
         ),
         title: translate(
            "dashboard.routes.profile.features.create-bank-account.title",
         ),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.profile.features.edit-bank-account.description",
         ),
         title: translate(
            "dashboard.routes.profile.features.edit-bank-account.title",
         ),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   // For asChild usage, manage internal state
   const [internalOpen, setInternalOpen] = useState(false);
   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

   const createBankAccountMutation = useMutation(
      trpc.bankAccounts.create.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getAll.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const updateBankAccountMutation = useMutation(
      trpc.bankAccounts.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getAll.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         bank: bankAccount?.bank || "",
         name: bankAccount?.name || "",
         type: bankAccount?.type || "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.type || !value.bank) {
            return;
         }
         try {
            if (isEditMode && bankAccount) {
               await updateBankAccountMutation.mutateAsync({
                  data: {
                     bank: value.bank,
                     name: value.name,
                     type: value.type,
                  },
                  id: bankAccount.id,
               });
            } else {
               await createBankAccountMutation.mutateAsync({
                  bank: value.bank,
                  name: value.name,
                  type: value.type,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} bank account:`,
               error,
            );
         }
      },
   });

   const TriggerComponent = asChild ? (
      <DropdownMenuItem
         className="flex items-center gap-2"
         onSelect={(e) => {
            e.preventDefault();
            setIsOpen?.(true);
         }}
      >
         {isEditMode ? (
            <>
               <Pencil className="size-4" />
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.edit",
               )}
            </>
         ) : (
            <>
               <Plus className="mr-2 h-4 w-4" />
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.add-account.title",
               )}
            </>
         )}
      </DropdownMenuItem>
   ) : null;

   return (
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
         {asChild && <SheetTrigger asChild>{TriggerComponent}</SheetTrigger>}
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
                  <SheetTitle>{modeTexts.title}</SheetTitle>
                  <SheetDescription>{modeTexts.description}</SheetDescription>
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
                                    {translate("common.form.name.label")}
                                 </FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "common.form.name.placeholder",
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

                  <FieldGroup>
                     <form.Field name="bank">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate("common.form.bank.label")}
                                 </FieldLabel>
                                 <BankAccountCombobox
                                    onBlur={field.handleBlur}
                                    onValueChange={field.handleChange}
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
                     <form.Field name="type">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    {translate(
                                       "common.form.account-type.label",
                                    )}
                                 </FieldLabel>
                                 <Select
                                    onValueChange={field.handleChange}
                                    value={field.state.value}
                                 >
                                    <SelectTrigger>
                                       <SelectValue
                                          placeholder={translate(
                                             "common.form.account-type.placeholder",
                                          )}
                                       />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="checking">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.types.checking",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="savings">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.types.savings",
                                          )}
                                       </SelectItem>
                                       <SelectItem value="investment">
                                          {translate(
                                             "dashboard.routes.profile.bank-accounts.types.investment",
                                          )}
                                       </SelectItem>
                                    </SelectContent>
                                 </Select>
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
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createBankAccountMutation.isPending ||
                              updateBankAccountMutation.isPending
                           }
                           type="submit"
                        >
                           {modeTexts.title}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
