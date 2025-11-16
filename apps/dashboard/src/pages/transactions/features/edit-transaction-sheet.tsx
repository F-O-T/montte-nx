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
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "../ui/transactions-list-section";
import { trpc } from "@/integrations/clients";

interface EditTransactionSheetProps {
   transaction: Transaction;
   asChild?: boolean;
}

export function EditTransactionSheet({ transaction, asChild }: EditTransactionSheetProps) {
   const [open, setOpen] = useState(false);
   const queryClient = useQueryClient();

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const form = useForm({
      defaultValues: {
         description: transaction.description,
         amount: Math.abs(transaction.amount).toString(),
         type: transaction.type as "income" | "expense",
         categoryId: transaction.category,
         date: new Date(transaction.date),
         notes: "",
      },
      onSubmit: async ({ value }) => {
         updateTransactionMutation.mutate({
            id: transaction.id,
            amount: parseFloat(value.amount),
            categoryId: value.categoryId,
            date: value.date,
            description: value.description,
            notes: value.notes,
            type: value.type,
         });
      },
   });

   const updateTransactionMutation = useMutation({
      ...trpc.transactions.update.mutationOptions(),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: trpc.transactions.getAll.queryKey() });
         setOpen(false);
         form.reset();
      },
   });

   return (
      <Sheet onOpenChange={setOpen} open={open}>
         <SheetTrigger asChild={asChild}>
            <Button size="sm" variant="ghost">
               <Edit className="h-4 w-4" />
               Edit
            </Button>
         </SheetTrigger>
         <SheetContent>
            <SheetHeader>
               <SheetTitle>Edit Transaction</SheetTitle>
               <SheetDescription>
                  Update the details of this transaction.
               </SheetDescription>
            </SheetHeader>
            <form
               onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
               }}
            >
               <div className="grid gap-4 py-4">
                  <form.Field
                     name="description"
                     validators={{
                        onChange: ({ value }) =>
                           !value ? "Description is required" : undefined,
                     }}
                  >
                     {(field) => (
                        <FieldGroup>
                           <FieldLabel htmlFor={field.name}>
                              Description
                           </FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              type="text"
                              value={field.state.value}
                           />
                           <FieldError>{field.state.meta.errors}</FieldError>
                        </FieldGroup>
                     )}
                  </form.Field>

                  <form.Field
                     name="amount"
                     validators={{
                        onChange: ({ value }) =>
                           !value || isNaN(parseFloat(value))
                              ? "Valid amount is required"
                              : undefined,
                     }}
                  >
                     {(field) => (
                        <FieldGroup>
                           <FieldLabel htmlFor={field.name}>
                              Amount
                           </FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              type="number"
                              step="0.01"
                              value={field.state.value}
                           />
                           <FieldError>{field.state.meta.errors}</FieldError>
                        </FieldGroup>
                     )}
                  </form.Field>

                  <form.Field name="type">
                     {(field) => (
                        <FieldGroup>
                           <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                           <Select
                              name={field.name}
                              value={field.state.value}
                              onValueChange={(value) =>
                                 field.handleChange(value as "income" | "expense")
                              }
                           >
                              <SelectTrigger>
                                 <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="income">Income</SelectItem>
                                 <SelectItem value="expense">Expense</SelectItem>
                              </SelectContent>
                           </Select>
                           <FieldError>{field.state.meta.errors}</FieldError>
                        </FieldGroup>
                     )}
                  </form.Field>

                  <form.Field name="categoryId">
                     {(field) => (
                        <FieldGroup>
                           <FieldLabel htmlFor={field.name}>
                              Category
                           </FieldLabel>
                           <Select
                              name={field.name}
                              value={field.state.value}
                              onValueChange={(value) => field.handleChange(value)}
                           >
                              <SelectTrigger>
                                 <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                 {categories.map((category) => (
                                    <SelectItem
                                       key={category.id}
                                       value={category.id}
                                    >
                                       {category.name}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           <FieldError>{field.state.meta.errors}</FieldError>
                        </FieldGroup>
                     )}
                  </form.Field>

                  <form.Field name="date">
                     {(field) => (
                        <FieldGroup>
                           <FieldLabel>Date</FieldLabel>
                           <DatePicker
                              value={field.state.value}
                              onChange={(date) => field.handleChange(date)}
                           />
                           <FieldError>{field.state.meta.errors}</FieldError>
                        </FieldGroup>
                     )}
                  </form.Field>

                  <form.Field name="notes">
                     {(field) => (
                        <FieldGroup>
                           <FieldLabel htmlFor={field.name}>
                              Notes (optional)
                           </FieldLabel>
                           <Textarea
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              value={field.state.value}
                           />
                           <FieldError>{field.state.meta.errors}</FieldError>
                        </FieldGroup>
                     )}
                  </form.Field>
               </div>
               <SheetFooter>
                  <Button
                     disabled={updateTransactionMutation.isPending}
                     type="submit"
                  >
                     {updateTransactionMutation.isPending
                        ? "Updating..."
                        : "Update Transaction"}
                  </Button>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}