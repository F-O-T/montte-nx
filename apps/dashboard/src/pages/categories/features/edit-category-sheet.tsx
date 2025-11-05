import { Button } from "@packages/ui/components/button";
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
import { DropdownMenuItem } from "@packages/ui/components/dropdown-menu";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Pencil } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/integrations/clients";
import {
   ColorPicker,
   ColorPickerSelection,
   ColorPickerHue,
   ColorPickerFormat,
   ColorPickerEyeDropper
} from "@packages/ui/components/color-picker";
import type { Category } from "@packages/database/repositories/category-repository";

// Validate and ensure proper hex color format
const validateHexColor = (color: string): string => {
   // Remove # if present and validate
   const hex = color.replace('#', '');

   // If it's a 3-digit hex, convert to 6-digit
   if (hex.length === 3) {
      return '#' + hex.split('').map(c => c + c).join('');
   }

   // If it's 6-digit hex, return with #
   if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
      return '#' + hex;
   }

   // If it's 8-digit hex (with alpha), strip alpha
   if (hex.length === 8 && /^[0-9A-Fa-f]{8}$/.test(hex)) {
      return '#' + hex.substring(0, 6);
   }

   // Default to black if invalid
   return '#000000';
};

// Common color options for quick selection
const PRESET_COLORS = [
   "#ef4444", // red
   "#f97316", // orange
   "#eab308", // yellow
   "#22c55e", // green
   "#06b6d4", // cyan
   "#3b82f6", // blue
   "#8b5cf6", // violet
   "#ec4899", // pink
   "#6b7280", // gray
   "#000000", // black
];

interface EditCategorySheetProps {
   category: Category;
   asChild?: boolean;
}

export function EditCategorySheet({ category, asChild = false }: EditCategorySheetProps) {
   const [isSheetOpen, setIsSheetOpen] = useState(false);
   const queryClient = useQueryClient();

   const updateCategoryMutation = useMutation(
      trpc.categories.update.mutationOptions({
         onSuccess: () => {
            // Invalidate and refetch categories
            queryClient.invalidateQueries({
               queryKey: trpc.categories.getAll.queryKey(),
            });
            setIsSheetOpen(false);
         },
         onError: (error) => {
            console.error("Failed to update category:", error);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         color: category.color,
         name: category.name,
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.color) {
            return;
         }
         try {
            await updateCategoryMutation.mutateAsync({
               id: category.id,
               color: value.color,
               name: value.name,
            });
         } catch (error) {
            console.error("Failed to update category:", error);
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
                  Edit
               </DropdownMenuItem>
            ) : (
               <Button variant="ghost" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
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
                  <SheetTitle>Edit Category</SheetTitle>
                  <SheetDescription>
                     Update the category details for "{category.name}".
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

                           // Memoize validated color to prevent re-renders
                           const validatedColor = useMemo(() =>
                              validateHexColor(field.state.value),
                              [field.state.value]
                           );

                           // Memoize color change handler
                           const handleColorChange = useCallback((color: number[]) => {
                              try {
                                 // Convert RGB array to hex string
                                 if (Array.isArray(color) && color.length >= 3) {
                                    const [r, g, b] = color;
                                    const hex = "#" +
                                       Math.round(r * 255).toString(16).padStart(2, '0') +
                                       Math.round(g * 255).toString(16).padStart(2, '0') +
                                       Math.round(b * 255).toString(16).padStart(2, '0');

                                    // Only update if the color actually changed
                                    if (hex !== validatedColor) {
                                       field.handleChange(hex);
                                    }
                                 }
                              } catch (error) {
                                 console.error("Error converting color:", error);
                              }
                           }, [validatedColor, field]);

                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>Color</FieldLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <Button
                                          variant="outline"
                                          className="w-full justify-between"
                                       >
                                          <div className="flex items-center gap-2">
                                             <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{
                                                   backgroundColor: validatedColor,
                                                }}
                                             />
                                             <span>{validatedColor}</span>
                                          </div>
                                          <Palette className="h-4 w-4" />
                                       </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4" align="start">
                                       <div className="space-y-4">
                                          {/* Preset colors */}
                                          <div>
                                             <p className="text-sm font-medium mb-2">Quick Select</p>
                                             <div className="grid grid-cols-5 gap-2">
                                                {PRESET_COLORS.map((color) => (
                                                   <button
                                                      key={color}
                                                      className="w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
                                                      style={{
                                                         backgroundColor: color,
                                                         borderColor: validatedColor === color ? "hsl(var(--primary))" : "transparent",
                                                      }}
                                                      onClick={() => field.handleChange(color)}
                                                   />
                                                ))}
                                             </div>
                                          </div>

                                          {/* Color picker */}
                                          <div>
                                             <p className="text-sm font-medium mb-2">Custom Color</p>
                                             <ColorPicker
                                                value={validatedColor}
                                                onChange={handleColorChange}
                                             >
                                                <div className="space-y-3">
                                                   <div className="h-32 w-full rounded-md">
                                                      <ColorPickerSelection />
                                                   </div>
                                                   <ColorPickerHue />
                                                   <div className="flex items-center gap-2">
                                                      <ColorPickerFormat className="flex-1" />
                                                      <ColorPickerEyeDropper />
                                                   </div>
                                                </div>
                                             </ColorPicker>
                                          </div>
                                       </div>
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
                           {state.isSubmitting ||
                           updateCategoryMutation.isPending
                              ? "Updating..."
                              : "Update Category"}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}