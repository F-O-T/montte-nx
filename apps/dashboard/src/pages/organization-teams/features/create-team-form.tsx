import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

function CreateTeamErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertTriangle className="h-4 w-4" />
         <AlertDescription>
            Failed to load organization data. Please try again.
         </AlertDescription>
      </Alert>
   );
}

function CreateTeamSkeleton() {
   return (
      <div className="grid gap-4 px-4">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-32" />
         <Skeleton className="h-20 w-full" />
         <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
   );
}

const CreateTeamFormContent = () => {
   const { closeSheet } = useSheet();
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const createTeamMutation = useMutation(
      trpc.organizationTeams.createTeam.mutationOptions({
         onError: (error) => {
            console.error("Team creation error:", error);
            toast.error("Failed to create team");
         },
         onSuccess: (_, variables) => {
            toast.success(`Team "${variables.name}" created successfully`);
            closeSheet();
         },
      }),
   );

   const schema = z.object({
      description: z
         .string()
         .max(200, "Description must be less than 200 characters")
         .default(""),
      name: z
         .string()
         .min(1, "Team name is required")
         .max(50, "Team name must be less than 50 characters"),
      organizationId: z.string().default(""),
   });

   const form = useForm({
      defaultValues: {
         description: "",
         name: "",
         organizationId: organization?.id ?? "",
      },
      onSubmit: async ({ value, formApi }) => {
         await createTeamMutation.mutateAsync(value);
         formApi.reset();
      },

      validators: {
         onBlur: schema as unknown as undefined,
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
            <form.Field name="name">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Team Name</FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter team name"
                           type="text"
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
                           Description (Optional)
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter team description"
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
            <Button onClick={closeSheet} type="button" variant="outline">
               Cancel
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={
                        !formState.canSubmit ||
                        formState.isSubmitting ||
                        createTeamMutation.isPending
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {createTeamMutation.isPending
                        ? "Creating..."
                        : "Create Team"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

export const CreateTeamForm: FC = () => {
   return (
      <>
         <SheetHeader>
            <SheetTitle className="">Create New Team</SheetTitle>
            <SheetDescription>
               Create a new team to organize your organization members
            </SheetDescription>
         </SheetHeader>
         <ErrorBoundary FallbackComponent={CreateTeamErrorFallback}>
            <Suspense fallback={<CreateTeamSkeleton />}>
               <CreateTeamFormContent />
            </Suspense>
         </ErrorBoundary>
      </>
   );
};
