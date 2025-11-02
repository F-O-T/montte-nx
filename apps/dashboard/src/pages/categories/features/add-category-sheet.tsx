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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/integrations/clients";
import { IconSelector } from "./icon-selector";

// Common color options
const COLOR_OPTIONS = [
   "#ef4444", // red
   "#f97316", // orange
   "#eab308", // yellow
   "#22c55e", // green
   "#06b6d4", // cyan
   "#3b82f6", // blue
   "#8b5cf6", // violet
   "#ec4899", // pink
   "#6b7280", // gray
];

type AddCategorySheetProps = {};

export function AddCategorySheet({}: AddCategorySheetProps) {
   const [isSheetOpen, setIsSheetOpen] = useState(false);
   const queryClient = useQueryClient();

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions({
         onSuccess: () => {
            // Invalidate and refetch categories
            queryClient.invalidateQueries({
               queryKey: trpc.categories.getAll.queryKey(),
            });
            setIsSheetOpen(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         color: COLOR_OPTIONS[0],
         icon: "ShoppingBag",
         name: "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.color || !value.icon) {
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
      <Sheet onOpenChange={setIsSheetOpen} open={isSheetOpen}>
         <SheetTrigger asChild>
            <Button className="flex gap-2 ">
               <Plus className="size-4" />
               Add Category
            </Button>
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
                                 <Select
                                    onValueChange={(value) =>
                                       field.handleChange(value)
                                    }
                                    value={field.state.value}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select a color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {COLOR_OPTIONS.map((color) => (
                                          <SelectItem key={color} value={color}>
                                             <div className="flex items-center gap-2">
                                                <div
                                                   className="w-4 h-4 rounded-full border"
                                                   style={{
                                                      backgroundColor: color,
                                                   }}
                                                />
                                                {color}
                                             </div>
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
                     <form.Field name="icon">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <IconSelector
                                 value={field.state.value}
                                 onChange={field.handleChange}
                                 isInvalid={isInvalid}
                                 errors={field.state.meta.errors}
                              />
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
