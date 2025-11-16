import type { Category } from "@packages/database/repositories/category-repository";
import { Button } from "@packages/ui/components/button";
import {
   ColorPicker,
   ColorPickerAlpha,
   ColorPickerEyeDropper,
   ColorPickerFormat,
   ColorPickerHue,
   ColorPickerOutput,
   ColorPickerSelection,
} from "@packages/ui/components/color-picker";
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
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
import Color from "color";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { IconSelector } from "@/features/icon-selector/icon-selector";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { trpc } from "@/integrations/clients";

type ManageCategorySheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   category?: Category; // If provided, edit mode. If not, create mode
   asChild?: boolean;
};

export function ManageCategorySheet({
   onOpen,
   onOpenChange,
   category,
   asChild = false,
}: ManageCategorySheetProps) {
   const queryClient = useQueryClient();
   const isEditMode = !!category;

   // For asChild usage, manage internal state
   const [internalOpen, setInternalOpen] = useState(false);
   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.categories.getAllPaginated.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const updateCategoryMutation = useMutation(
      trpc.categories.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update category:", error);
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.categories.getAllPaginated.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         color: category?.color || "#000000",
         icon: category?.icon as IconName | undefined,
         name: category?.name || "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.color) {
            return;
         }

         try {
            if (isEditMode && category) {
               await updateCategoryMutation.mutateAsync({
                  data: {
                     color: value.color,
                     icon: value.icon,
                     name: value.name,
                  },
                  id: category.id,
               });
            } else {
               await createCategoryMutation.mutateAsync({
                  color: value.color,
                  icon: value.icon,
                  name: value.name,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} category:`,
               error,
            );
         }
      },
   });

   const TriggerComponent = asChild ? (
      <DropdownMenuItem
         onSelect={(e) => {
            e.preventDefault();
            setIsOpen?.(true);
         }}
      >
         {isEditMode ? (
            <>
               <Pencil className="mr-2 h-4 w-4" />
               Edit
            </>
         ) : (
            <>
               <Plus className="mr-2 h-4 w-4" />
               Add Category
            </>
         )}
      </DropdownMenuItem>
   ) : (
      <Button size="sm" variant="ghost">
         {isEditMode ? (
            <>
               <Pencil className="mr-2 h-4 w-4" />
               Edit
            </>
         ) : (
            <>
               <Plus className="mr-2 h-4 w-4" />
               Add Category
            </>
         )}
      </Button>
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
                     {isEditMode ? "Edit Category" : "Create New Category"}
                  </SheetTitle>
                  <SheetDescription>
                     {isEditMode
                        ? `Update the category details for "${category.name}".`
                        : "Add a new category to organize your transactions."}
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
                                 <FieldLabel>Name</FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder="Enter category name..."
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
                     <form.Field name="color">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Color</FieldLabel>

                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <Button
                                          aria-invalid={isInvalid || undefined}
                                          className="w-full flex gap-2 justify-start"
                                          variant="outline"
                                       >
                                          <div
                                             className="w-4 h-4 rounded border border-gray-300"
                                             style={{
                                                backgroundColor:
                                                   field.state.value,
                                             }}
                                          />
                                          {field.state.value}
                                       </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                       align="start"
                                       className="h-full rounded-md border bg-background "
                                    >
                                       <ColorPicker
                                          className="size-full flex flex-col gap-4"
                                          onChange={(rgba) => {
                                             if (Array.isArray(rgba)) {
                                                field.handleChange(
                                                   Color.rgb(
                                                      rgba[0],
                                                      rgba[1],
                                                      rgba[2],
                                                   ).hex(),
                                                );
                                             }
                                          }}
                                          value={field.state.value || "#000000"} // never undefined
                                       >
                                          <div className="h-24">
                                             <ColorPickerSelection />
                                          </div>

                                          <div className="flex items-center gap-4">
                                             <ColorPickerEyeDropper />
                                             <div className="grid w-full gap-1">
                                                <ColorPickerHue />
                                                <ColorPickerAlpha />
                                             </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                             <ColorPickerOutput />
                                             <ColorPickerFormat />
                                          </div>
                                       </ColorPicker>
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
                     <form.Field name="icon">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Icon (Optional)</FieldLabel>
                                 <IconSelector
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
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createCategoryMutation.isPending ||
                              updateCategoryMutation.isPending
                           }
                           type="submit"
                        >
                           {state.isSubmitting ||
                           createCategoryMutation.isPending ||
                           updateCategoryMutation.isPending
                              ? isEditMode
                                 ? "Updating..."
                                 : "Creating..."
                              : isEditMode
                                ? "Update Category"
                                : "Create Category"}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
