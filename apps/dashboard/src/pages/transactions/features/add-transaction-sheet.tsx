import { Button } from "@packages/ui/components/button";
import { DatePicker } from "@packages/ui/components/date-picker";
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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/integrations/clients";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { translate } from "@packages/localization";
export function AddTransactionSheet() {
   const [isSheetOpen, setIsSheetOpen] = useState(false);
   const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
   const queryClient = useQueryClient();

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const activeBankAccounts = bankAccounts.filter(
      (account) => account.status === "active",
   );

   const createTransactionMutation = useMutation(
      trpc.transactions.create.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAll.queryKey(),
            });
            setIsSheetOpen(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         amount: "",
         bankAccountId: undefined as string | undefined,
         category: "",
         date: new Date(),
         description: "",
         type: "expense" as "expense" | "income",
      },
      onSubmit: async ({ value }) => {
         if (!value.amount || !value.category || !value.description) {
            return;
         }
         try {
            await createTransactionMutation.mutateAsync({
               amount: parseFloat(value.amount),
               bankAccountId: value.bankAccountId || undefined,
               category: value.category as string,
               date: value.date.toISOString().split("T")[0],
               description: value.description,
               type: value.type,
            });
            form.reset();
         } catch (error) {
            console.error("Failed to create transaction:", error);
         }
      },
   });

   return (
      <Sheet
         onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
               form.reset();
            }
         }}
         open={isSheetOpen}
      >
         <SheetTrigger asChild>
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     aria-label={translate(
                        "dashboard.routes.transactions.actions-toolbar.actions.add-new",
                     )}
                     onClick={() => setIsSheetOpen(true)}
                     size="icon"
                     variant="default"
                  >
                     <Plus className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.transactions.actions-toolbar.actions.add-new",
                  )}
               </TooltipContent>
            </Tooltip>
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
                  <SheetTitle>Add New Transaction</SheetTitle>
                  <SheetDescription>
                     Enter the details for your new transaction.
                  </SheetDescription>
               </SheetHeader>
               <div className="grid gap-4 px-4">
                  <FieldGroup>
                     <form.Field name="description">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Description</FieldLabel>
                                 <Textarea
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder="Enter transaction description..."
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
                     <form.Field name="amount">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Amount</FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder="0.00"
                                    step="0.01"
                                    type="number"
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
                     <form.Field name="bankAccountId">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
                                    Bank Account (Optional)
                                 </FieldLabel>
                                 <Select
                                    onValueChange={(value) =>
                                       field.handleChange(value)
                                    }
                                    value={field.state.value}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select a bank account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {activeBankAccounts.map((account) => (
                                          <SelectItem
                                             key={account.id}
                                             value={account.id}
                                          >
                                             {account.name} - {account.bank}
                                          </SelectItem>
                                       ))}
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

                  <FieldGroup>
                     <form.Field name="category">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;

                           const selectedCategory = categories.find(
                              (category) => category.name === field.state.value,
                           );

                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Category</FieldLabel>
                                 <Popover
                                    open={categoryComboboxOpen}
                                    onOpenChange={setCategoryComboboxOpen}
                                 >
                                    <PopoverTrigger asChild>
                                       <Button
                                          aria-expanded={categoryComboboxOpen}
                                          className="w-full justify-between"
                                          role="combobox"
                                          variant="outline"
                                       >
                                          {selectedCategory ? (
                                             <div className="flex items-center gap-2">
                                                <IconDisplay
                                                   iconName={
                                                      selectedCategory.icon as any
                                                   }
                                                   size={16}
                                                />
                                                <span>
                                                   {selectedCategory.name}
                                                </span>
                                             </div>
                                          ) : (
                                             <span className="text-muted-foreground">
                                                Select a category
                                             </span>
                                          )}
                                          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                       </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                       <Command>
                                          <CommandInput placeholder="Search categories..." />
                                          <CommandList>
                                             <CommandEmpty>
                                                No category found.
                                             </CommandEmpty>
                                             <CommandGroup>
                                                {categories.map((category) => (
                                                   <CommandItem
                                                      key={category.id}
                                                      onSelect={() => {
                                                         field.handleChange(
                                                            category.name ===
                                                               field.state.value
                                                               ? ""
                                                               : category.name,
                                                         );
                                                         setCategoryComboboxOpen(
                                                            false,
                                                         );
                                                      }}
                                                      value={category.name}
                                                   >
                                                      <div className="flex items-center gap-2 flex-1">
                                                         <IconDisplay
                                                            iconName={
                                                               category.icon as any
                                                            }
                                                            size={16}
                                                         />
                                                         <span>
                                                            {category.name}
                                                         </span>
                                                      </div>
                                                      {field.state.value ===
                                                         category.name && (
                                                         <CheckIcon className="ml-2 h-4 w-4" />
                                                      )}
                                                   </CommandItem>
                                                ))}
                                             </CommandGroup>
                                          </CommandList>
                                       </Command>
                                    </PopoverContent>
                                 </Popover>
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
                                 <FieldLabel>Type</FieldLabel>
                                 <Select
                                    onValueChange={(value) =>
                                       field.handleChange(
                                          value as "expense" | "income",
                                       )
                                    }
                                    value={field.state.value}
                                 >
                                    <SelectTrigger>
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="expense">
                                          Expense
                                       </SelectItem>
                                       <SelectItem value="income">
                                          Income
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

                  <FieldGroup>
                     <form.Field name="date">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Date</FieldLabel>
                                 <DatePicker
                                    date={field.state.value}
                                    onSelect={(date) =>
                                       field.handleChange(date || new Date())
                                    }
                                    placeholder="Pick a date"
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
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createTransactionMutation.isPending
                           }
                           type="submit"
                        >
                           {state.isSubmitting ||
                           createTransactionMutation.isPending
                              ? "Adding..."
                              : "Add Transaction"}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
