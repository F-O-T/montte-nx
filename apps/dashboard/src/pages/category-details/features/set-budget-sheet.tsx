import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import {
   Field,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { MoneyInput } from "@packages/ui/components/money-input";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { centsToReais } from "@packages/utils/money";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/integrations/clients";

type SetBudgetSheetProps = {
   categoryId: string;
   currentBudget?: number | string;
   asChild?: boolean;
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
};

export function SetBudgetSheet({
   categoryId,
   currentBudget = 0,
   asChild = false,
   onOpen,
   onOpenChange,
}: SetBudgetSheetProps) {
   const queryClient = useQueryClient();
   const [internalOpen, setInternalOpen] = useState(false);
   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

   const updateCategoryMutation = useMutation(
      trpc.categories.update.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.categories.getById.queryKey({ id: categoryId }),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         budget: Number(currentBudget) * 100, // Store as cents
      },
      onSubmit: async ({ value }) => {
         try {
            const budgetInDecimal = centsToReais(value.budget);
            await updateCategoryMutation.mutateAsync({
               id: categoryId,
               data: {
                  budget: budgetInDecimal,
               },
            });
         } catch (error) {
            console.error("Failed to set budget:", error);
         }
      },
   });

   const TriggerComponent = (
      <DropdownMenuItem
         className="flex items-center gap-2"
         onSelect={(e) => {
            e.preventDefault();
            setIsOpen?.(true);
         }}
      >
         <Target className="size-4" />
         {translate("dashboard.routes.categories.features.set-budget.title")}
      </DropdownMenuItem>
   );

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
                  <SheetTitle>
                     {translate(
                        "dashboard.routes.categories.features.set-budget.title",
                     )}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "dashboard.routes.categories.features.set-budget.description",
                     )}
                  </SheetDescription>
               </SheetHeader>
               <div className="grid gap-4 px-4">
                  <FieldGroup>
                     <form.Field name="budget">
                        {(field) => {
                           return (
                              <Field>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.categories.details-section.budget.title",
                                    )}
                                 </FieldLabel>
                                 <MoneyInput
                                    onBlur={field.handleBlur}
                                    onChange={(value) => {
                                       field.handleChange(value || 0);
                                    }}
                                    placeholder="0,00"
                                    value={field.state.value}
                                    valueInCents={true}
                                 />
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
                              updateCategoryMutation.isPending
                           }
                           type="submit"
                        >
                           {translate("common.actions.save")}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
