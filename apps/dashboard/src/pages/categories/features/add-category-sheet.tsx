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
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Color from "color";
import { IconSelector } from "@/features/icon-selector/icon-selector";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { trpc } from "@/integrations/clients";

type AddCategorySheetProps = {
   onOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function AddCategorySheet({
   onOpen,
   onOpenChange,
}: AddCategorySheetProps) {
   const queryClient = useQueryClient();

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions({
         onSuccess: () => {
            // Invalidate and refetch categories
            queryClient.invalidateQueries({
               queryKey: trpc.categories.getAll.queryKey(),
            });
            onOpenChange(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         color: "#000000",
         icon: undefined as IconName | undefined,
         name: "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.color) {
            return;
         }
         try {
            await createCategoryMutation.mutateAsync({
               color: value.color,
               icon: value.icon,
               name: value.name,
            });
         } catch (error) {
            console.error("Failed to create category:", error);
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
                  <SheetTitle>Create New Category</SheetTitle>
                  <SheetDescription>
                     Add a new category to organize your transactions.
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
                                       className="h-full max-w-sm rounded-md border bg-background shadow-sm"
                                    >
                                       <ColorPicker
                                          value={field.state.value || "#000000"}
                                          onChange={(rgba) =>
                                             field.handleChange(
                                                Color.rgb(rgba[0], rgba[1], rgba[2]).hex(),
                                             )
                                          }
                                          className="size-full flex flex-col gap-4" // never undefined
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
                              createCategoryMutation.isPending
                           }
                           type="submit"
                        >
                           {state.isSubmitting ||
                           createCategoryMutation.isPending
                              ? "Creating..."
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
