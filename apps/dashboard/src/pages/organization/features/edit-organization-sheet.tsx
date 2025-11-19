import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { useTRPC } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

type Organization = {
   description?: string | null;
   id: string;
   name: string;
};

type ManageOrganizationSheetProps = {
   onOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
   organization?: Organization;
};

export function ManageOrganizationSheet({
   onOpen,
   onOpenChange,
   organization,
}: ManageOrganizationSheetProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const isEditMode = !!organization;

   const { data: logoData } = useQuery({
      ...trpc.organization.getLogo.queryOptions(),
      enabled: isEditMode,
   });

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: "Create your first organization to start collaborating",
         title: "Create Organization",
      };

      const editTexts = {
         description: "Update your organization information and logo",
         title: "Edit Organization",
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   const isOpen = onOpen ?? false;
   const setIsOpen = onOpenChange;

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const editOrganizationMutation = useMutation(
      trpc.organization.editOrganization.mutationOptions({
         onError: (error) => {
            console.error("Failed to update organization:", error);
            toast.error("Failed to update organization");
         },
         onSuccess: async () => {
            toast.success("Organization updated successfully");
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });
            fileUpload.clearFile();
            setIsOpen?.(false);
         },
      }),
   );

   const createOrganizationMutation = useMutation(
      trpc.organization.createOrganization.mutationOptions({
         onError: (error) => {
            console.error("Create organization error:", error);
            toast.error("Failed to create organization");
         },
         onSuccess: async () => {
            toast.success("Organization created successfully");
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getOrganizations.queryKey(),
            });
            fileUpload.clearFile();
            setIsOpen?.(false);
         },
      }),
   );

   const uploadLogoMutation = useMutation(
      trpc.organization.uploadLogo.mutationOptions({
         onError: (error) => {
            console.error("Logo upload error:", error);
            toast.error("Failed to upload logo");
            fileUpload.setError("Failed to upload logo");
         },
         onSuccess: async () => {
            toast.success("Logo uploaded successfully");
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getLogo.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });
            fileUpload.clearFile();
         },
      }),
   );

   const handleFileSelect = (acceptedFiles: File[]) => {
      fileUpload.handleFileSelect(acceptedFiles, (file) => {
         form.setFieldValue("logo", file);
      });
   };

   const form = useForm({
      defaultValues: {
         description: organization?.description || "",
         logo: null as File | null,
         name: organization?.name || "",
      },
      onSubmit: async ({ value, formApi }) => {
         try {
            if (isEditMode && organization) {
               // Edit mode: Upload logo first if a file is selected
               if (value.logo) {
                  try {
                     fileUpload.setUploading(true);
                     const base64 = await fileUpload.convertToBase64(value.logo);

                     await uploadLogoMutation.mutateAsync({
                        contentType: value.logo.type,
                        fileBuffer: base64,
                        fileName: value.logo.name,
                     });
                  } catch (error) {
                     console.error("Logo upload failed:", error);
                     toast.error("Failed to upload logo");
                     fileUpload.setUploading(false);
                     return;
                  }
               }

               // Then update organization details
               await editOrganizationMutation.mutateAsync({
                  description: value.description,
                  name: value.name,
               });
            } else {
               // Create organization first
               await createOrganizationMutation.mutateAsync({
                  description: value.description,
                  name: value.name,
                  slug: createSlug(value.name),
               });

               // Upload logo if a file is selected (after organization is created)
               if (value.logo) {
                  try {
                     fileUpload.setUploading(true);
                     const base64 = await fileUpload.convertToBase64(value.logo);

                     await uploadLogoMutation.mutateAsync({
                        contentType: value.logo.type,
                        fileBuffer: base64,
                        fileName: value.logo.name,
                     });
                  } catch (error) {
                     console.error("Logo upload failed:", error);
                     toast.error("Failed to upload logo");
                     fileUpload.setUploading(false);
                  }
               }
            }

            formApi.reset();
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} organization:`,
               error,
            );
         }
      },
   });

   return (
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
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
                  <form.Field name="logo">
                     {(field) => {
                        const currentLogoFile = field.state.value;
                        const displayImage = fileUpload.filePreview || logoData?.data;

                        return (
                           <Field
                              data-invalid={
                                 field.state.meta.isTouched &&
                                 !field.state.meta.isValid
                              }
                           >
                              <FieldLabel>Organization Logo</FieldLabel>
                              <Dropzone
                                 accept={{
                                    "image/*": [
                                       ".png",
                                       ".jpg",
                                       ".jpeg",
                                       ".gif",
                                       ".webp",
                                    ],
                                 }}
                                 className="h-44"
                                 disabled={
                                    fileUpload.isUploading ||
                                    uploadLogoMutation.isPending
                                 }
                                 maxFiles={1}
                                 maxSize={5 * 1024 * 1024}
                                 onDrop={handleFileSelect}
                                 src={currentLogoFile ? [currentLogoFile] : undefined}
                              >
                                 <DropzoneEmptyState>
                                    {isEditMode && logoData?.data && (
                                       <img
                                          alt="Current logo"
                                          className="max-h-20 max-w-20 object-contain"
                                          src={logoData.data}
                                       />
                                    )}
                                    {!isEditMode && (
                                       <Building className="size-8 text-muted-foreground" />
                                    )}
                                 </DropzoneEmptyState>
                                 <DropzoneContent>
                                    {displayImage && (
                                       <img
                                          alt="Logo preview"
                                          className="h-full w-full object-contain rounded-md"
                                          src={displayImage}
                                       />
                                    )}
                                 </DropzoneContent>
                              </Dropzone>
                              {currentLogoFile && (
                                 <p className="text-sm text-muted-foreground">
                                    Logo will be uploaded when you {isEditMode ? "save" : "create"} the organization
                                 </p>
                              )}
                              {fileUpload.error && (
                                 <p className="text-sm text-destructive">
                                    {fileUpload.error}
                                 </p>
                              )}
                              {field.state.meta.isTouched &&
                                 !field.state.meta.isValid && (
                                    <FieldError errors={field.state.meta.errors} />
                                 )}
                           </Field>
                        );
                     }}
                  </form.Field>

                  <form.Field name="name">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched && !field.state.meta.isValid;

                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Organization Name
                              </FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => field.handleChange(e.target.value)}
                                 value={field.state.value}
                              />

                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>

                  <form.Field name="description">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched && !field.state.meta.isValid;

                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Description
                              </FieldLabel>
                              <Textarea
                                 aria-invalid={isInvalid}
                                 className="w-full"
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => field.handleChange(e.target.value)}
                                 rows={3}
                                 value={field.state.value}
                              />

                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>
               </div>

               <SheetFooter>
                  <form.Subscribe>
                     {(state) => (
                        <Button
                           className="w-full"
                           disabled={
                              !state.canSubmit ||
                              state.isSubmitting ||
                              createOrganizationMutation.isPending ||
                              editOrganizationMutation.isPending
                           }
                           type="submit"
                        >
                           {state.isSubmitting
                              ? isEditMode
                                 ? "Saving..."
                                 : "Creating..."
                              : modeTexts.title}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}

export const EditOrganizationSheet = ManageOrganizationSheet;
