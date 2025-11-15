import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { createSlug } from "@packages/utils/text";
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
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { AlertTriangle, Building } from "lucide-react";
import type { FC, FormEvent } from "react";
import { createContext, Suspense, useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { useTRPC } from "@/integrations/clients";

interface EditOrganizationSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

// Context to share onOpenChange function
const EditOrganizationContext = createContext<{
   onOpenChange: (open: boolean) => void;
} | null>(null);

// Hook to use the context
const useEditOrganizationContext = () => {
   const context = useContext(EditOrganizationContext);
   if (!context) {
      throw new Error(
         "useEditOrganizationContext must be used within EditOrganizationProvider",
      );
   }
   return context;
};

// Error Fallback Component
function EditOrganizationErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertTriangle className="h-4 w-4" />
         <AlertDescription>
            Failed to load organization data. Please try again.
         </AlertDescription>
      </Alert>
   );
}

// Loading Skeleton Component
function EditOrganizationSkeleton() {
   return (
      <div className="grid gap-4 px-4">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-20 w-full" />
         <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
   );
}

const EditOrganizationSheetContent = () => {
   const { onOpenChange } = useEditOrganizationContext();
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );
   const { data: logoData } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   // Determine if we're in create or edit mode
   const isCreateMode = !organization;

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const editOrganizationMutation = useMutation(
      trpc.organization.editOrganization.mutationOptions({
         onError: () => {
            // Handle error (optional)
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });
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
            fileUpload.clearFile();
            onOpenChange(false);
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
         if (isCreateMode) {
            // Create organization first
            await createOrganizationMutation.mutateAsync({
               description: value.description,
               slug:createSlug(value.name),

               name: value.name,

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

            formApi.reset();
         } else {
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
                  return; // Stop form submission if logo upload fails
               }
            }

            // Then update organization details
            await editOrganizationMutation.mutateAsync({
               description: value.description,
               name: value.name,
            });

            // Reset and close
            fileUpload.clearFile();
            onOpenChange(false);
            formApi.reset();
         }
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   return (
      <>
         <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            {/* Logo Upload Section */}
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
                              {!isCreateMode && logoData?.data && (
                                 <img
                                    alt="Current logo"
                                    className="max-h-20 max-w-20 object-contain"
                                    src={logoData.data}
                                 />
                              )}
                              {isCreateMode && (
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
                              Logo will be uploaded when you {isCreateMode ? "create" : "save"} the organization
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
         </form>

         <SheetFooter>
            <Button
               onClick={() => onOpenChange(false)}
               type="button"
               variant="outline"
            >
               Cancel
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={
                        !formState.canSubmit ||
                        formState.isSubmitting ||
                        (isCreateMode && createOrganizationMutation.isPending) ||
                        (!isCreateMode && editOrganizationMutation.isPending)
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {formState.isSubmitting
                        ? isCreateMode
                           ? "Creating..."
                           : "Saving..."
                        : isCreateMode
                           ? "Create Organization"
                           : "Save Changes"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

export const EditOrganizationSheet: FC<EditOrganizationSheetProps> = ({
   open,
   onOpenChange,
}) => {
   return (
      <Sheet onOpenChange={onOpenChange} open={open}>
         <SheetContent>
            <EditOrganizationContext.Provider value={{ onOpenChange }}>
               <ErrorBoundary FallbackComponent={EditOrganizationErrorFallback}>
                  <Suspense fallback={<EditOrganizationSkeleton />}>
                     <EditOrganizationSheetTitleAndContent />
                  </Suspense>
               </ErrorBoundary>
            </EditOrganizationContext.Provider>
         </SheetContent>
      </Sheet>
   );
};

// Create organization content without suspense queries
const CreateOrganizationSheetContent = () => {
   const { onOpenChange } = useEditOrganizationContext();
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

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
            fileUpload.clearFile();
            onOpenChange(false);
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
         description: "",
         logo: null as File | null,
         name: "",
      },
      onSubmit: async ({ value, formApi }) => {
         // Create organization first
         await createOrganizationMutation.mutateAsync({
            slug:createSlug(value.name),
            description: value.description,
            name: value.name,
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

         formApi.reset();
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   return (
      <>
         <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            {/* Logo Upload Section */}
            <form.Field name="logo">
               {(field) => {
                  const currentLogoFile = field.state.value;
                  const displayImage = fileUpload.filePreview;

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
                              <Building className="size-8 text-muted-foreground" />
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
                              Logo will be uploaded when you create the organization
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
         </form>

         <SheetFooter>
            <Button
               onClick={() => onOpenChange(false)}
               type="button"
               variant="outline"
            >
               Cancel
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={
                        !formState.canSubmit ||
                        formState.isSubmitting ||
                        createOrganizationMutation.isPending
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {formState.isSubmitting
                        ? "Creating..."
                        : "Create Organization"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

// Combined title and content component that checks organization existence
const EditOrganizationSheetTitleAndContent = () => {
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const isCreateMode = !organization;

   return (
      <>
         <SheetHeader>
            <SheetTitle>
               {isCreateMode ? "Create Organization" : "Edit Organization"}
            </SheetTitle>
            <SheetDescription>
               {isCreateMode
                  ? "Create your first organization to start collaborating"
                  : "Update your organization information and logo"}
            </SheetDescription>
         </SheetHeader>
         {isCreateMode ? (
            <CreateOrganizationSheetContent />
         ) : (
            <Suspense fallback={<EditOrganizationSkeleton />}>
               <EditOrganizationSheetContent />
            </Suspense>
         )}
      </>
   );
};
