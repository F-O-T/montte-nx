import type { Tag } from "@packages/database/repositories/tag-repository";
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
import { useMemo, useState } from "react";
import { trpc } from "@/integrations/clients";

type ManageTagSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   tag?: Tag;
   asChild?: boolean;
};

export function ManageTagSheet({
   onOpen,
   onOpenChange,
   tag,
   asChild = false,
}: ManageTagSheetProps) {
   const queryClient = useQueryClient();
   const isEditMode = !!tag;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.tags.features.create-tag.description",
         ),
         title: translate("dashboard.routes.tags.features.create-tag.title"),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.tags.features.edit-tag.description",
         ),
         title: translate("dashboard.routes.tags.features.edit-tag.title"),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   const [internalOpen, setInternalOpen] = useState(false);
   const isOpen = asChild ? internalOpen : onOpen;
   const setIsOpen = asChild ? setInternalOpen : onOpenChange;

   const createTagMutation = useMutation(
      trpc.tags.create.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.tags.getAllPaginated.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const updateTagMutation = useMutation(
      trpc.tags.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update tag:", error);
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.tags.getAllPaginated.queryKey(),
            });
            setIsOpen?.(false);
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         color: tag?.color || "#000000",
         name: tag?.name || "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name || !value.color) {
            return;
         }

         try {
            if (isEditMode && tag) {
               await updateTagMutation.mutateAsync({
                  data: {
                     color: value.color,
                     name: value.name,
                  },
                  id: tag.id,
               });
            } else {
               await createTagMutation.mutateAsync({
                  color: value.color,
                  name: value.name,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} tag:`,
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
                  "dashboard.routes.tags.list-section.actions.edit-tag",
               )}
            </>
         ) : (
            <>
               <Plus className="size-4" />
               {translate("dashboard.routes.tags.actions.add-tag")}
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

                  <FieldGroup>
                     <form.Field name="color">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel>
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
                              createTagMutation.isPending ||
                              updateTagMutation.isPending
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
