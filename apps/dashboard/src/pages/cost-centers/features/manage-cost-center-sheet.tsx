import type { CostCenter } from "@packages/database/repositories/cost-center-repository";
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
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { createCodeFromName } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTRPC } from "@/integrations/clients";

type ManageCostCenterSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   costCenter?: CostCenter;
   asChild?: boolean;
};

export function ManageCostCenterSheet({
   onOpen,
   onOpenChange,
   costCenter,
   asChild = false,
}: ManageCostCenterSheetProps) {
   const trpc = useTRPC();
   const isEditMode = !!costCenter;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.cost-centers.features.create-cost-center.description",
         ),
         title: translate(
            "dashboard.routes.cost-centers.features.create-cost-center.title",
         ),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.cost-centers.features.edit-cost-center.description",
         ),
         title: translate(
            "dashboard.routes.cost-centers.features.edit-cost-center.title",
         ),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   const [internalOpen, setInternalOpen] = useState(false);
   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

   const createCostCenterMutation = useMutation(
      trpc.costCenters.create.mutationOptions({
         onSuccess: () => {
            setIsOpen?.(false);
         },
      }),
   );

   const updateCostCenterMutation = useMutation(
      trpc.costCenters.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update cost center:", error);
         },
         onSuccess: () => {
            setIsOpen?.(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         name: costCenter?.name || "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name) {
            return;
         }

         const code = createCodeFromName(value.name);

         try {
            if (isEditMode && costCenter) {
               await updateCostCenterMutation.mutateAsync({
                  data: {
                     code: code || undefined,
                     name: value.name,
                  },
                  id: costCenter.id,
               });
            } else {
               await createCostCenterMutation.mutateAsync({
                  code: code || undefined,
                  name: value.name,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} cost center:`,
               error,
            );
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
         {isEditMode ? (
            <>
               <Pencil className="size-4" />
               {translate(
                  "dashboard.routes.cost-centers.list-section.actions.edit-cost-center",
               )}
            </>
         ) : (
            <>
               <Plus className="size-4" />
               {translate(
                  "dashboard.routes.cost-centers.actions.add-cost-center",
               )}
            </>
         )}
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
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createCostCenterMutation.isPending ||
                              updateCostCenterMutation.isPending
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
