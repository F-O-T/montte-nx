import type { Category } from "@packages/database/repositories/category-repository";
import { translate } from "@packages/localization";
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
   FieldDescription,
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
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Color from "color";
import { useMemo } from "react";
import { z } from "zod";
import { TransactionTypesSelector } from "@/features/category/ui/transaction-types-selector";
import { IconSelector } from "@/features/icon-selector/icon-selector";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type TransactionType = "income" | "expense" | "transfer";

type ManageCategoryFormProps = {
   category?: Category;
};

export function ManageCategoryForm({ category }: ManageCategoryFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const isEditMode = !!category;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.categories.features.create-category.description",
         ),
         title: translate(
            "dashboard.routes.categories.features.create-category.title",
         ),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.categories.features.edit-category.description",
            { name: category?.name || "" },
         ),
         title: translate(
            "dashboard.routes.categories.features.edit-category.title",
         ),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode, category?.name]);

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions({
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const updateCategoryMutation = useMutation(
      trpc.categories.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update category:", error);
         },
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         color: category?.color || "#000000",
         icon: category?.icon as IconName | undefined,
         name: category?.name || "",
         transactionTypes:
            (category?.transactionTypes as TransactionType[]) || [
               "income",
               "expense",
               "transfer",
            ],
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
                     transactionTypes: value.transactionTypes,
                  },
                  id: category.id,
               });
            } else {
               await createCategoryMutation.mutateAsync({
                  color: value.color,
                  icon: value.icon,
                  name: value.name,
                  transactionTypes: value.transactionTypes,
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

   return (
      <form
         className="h-full flex flex-col"
         onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            await form.validateAllFields("change");
            
            if (form.state.canSubmit) {
               form.handleSubmit();
            }
         }}
      >
         <SheetHeader>
            <SheetTitle>{modeTexts.title}</SheetTitle>
            <SheetDescription>{modeTexts.description}</SheetDescription>
         </SheetHeader>
         <div className="grid gap-4 px-4">
            <FieldGroup>
                  <form.Field 
                     name="name"
                     validators={{
                        onChange: z.string().min(1, translate("common.validation.required")),
                     }}
                  >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel required>
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
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
                  <form.Field 
                     name="color"
                     validators={{
                        onChange: z.string().min(1, translate("common.validation.required")),
                     }}
                  >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel required>
                              {translate("common.form.color.label")}
                           </FieldLabel>

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
                                          backgroundColor: field.state.value,
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
                                    value={field.state.value || "#000000"}
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
                              <FieldError errors={field.state.meta.errors} />
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
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate("common.form.icon.label")}
                           </FieldLabel>
                           <IconSelector
                              onValueChange={field.handleChange}
                              value={field.state.value}
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
               <form.Field name="transactionTypes">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate("common.form.transaction-types.label")}
                           </FieldLabel>
                           <TransactionTypesSelector
                              onChange={field.handleChange}
                              value={field.state.value || []}
                           />
                           <FieldDescription>
                              {translate(
                                 "common.form.transaction-types.description",
                              )}
                           </FieldDescription>
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
            <Button
               className="w-full"
               disabled={
                  createCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
               }
               onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  await form.validateAllFields("change");

                  if (form.state.canSubmit) {
                     form.handleSubmit();
                  }
               }}
               type="button"
            >
               {modeTexts.title}
            </Button>
         </SheetFooter>
      </form>
   );
}
