import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import z from "zod";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

function SendInvitationErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertTriangle className="h-4 w-4" />
         <AlertDescription>
            Failed to load organization data. Please try again.
         </AlertDescription>
      </Alert>
   );
}

function SendInvitationSkeleton() {
   return (
      <div className="grid gap-4 px-4">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-10 w-full" />
         <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
   );
}

const SendInvitationFormContent = () => {
   const { closeSheet } = useSheet();
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );
   const { data: teams = [] } = useSuspenseQuery(
      trpc.organization.listTeams.queryOptions(),
   );

   const sendInvitationMutation = useMutation(
      trpc.organizationInvites.createInvitation.mutationOptions({
         onError: (error) => {
            console.error("Invitation error:", error);
            toast.error("Failed to send invitation");
         },
         onSuccess: (_, variables) => {
            toast.success(`Invitation sent to ${variables.email}`);
            closeSheet();
         },
      }),
   );
   const schema = z.object({
      email: z.email("Please enter a valid email address"),
      organizationId: z.string().optional(),
      resend: z.boolean().optional(),
      teamId: z.string().optional(),
   });
   const form = useForm({
      defaultValues: {
         email: "",
         organizationId: organization?.id,
         resend: false,
         teamId: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await sendInvitationMutation.mutateAsync({
            email: value.email,
            organizationId: value.organizationId || undefined,
            resend: value.resend,
            role: "member",
            teamId: value.teamId || undefined,
         });
         formApi.reset();
      },
      validators: {
         onBlur: (value) => schema.parse(value),
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
            <form.Field name="email">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Email Address
                        </FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter email address"
                           type="email"
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="teamId">
               {(field) => {
                  const teamOptions = teams.map((team) => ({
                     label: team.name,
                     value: team.id,
                  }));

                  return (
                     <Field data-invalid={false}>
                        <FieldLabel>Team (Optional)</FieldLabel>
                        <Combobox
                           className="w-full"
                           emptyMessage={
                              teams.length === 0
                                 ? "No teams available"
                                 : "No team found."
                           }
                           onValueChange={(value) => field.handleChange(value)}
                           options={teamOptions}
                           placeholder="Select a team (optional)"
                           searchPlaceholder="Search teams..."
                           value={field.state.value}
                        />
                     </Field>
                  );
               }}
            </form.Field>
            <form.Field name="resend">
               {(field) => (
                  <Item className="bg-muted ">
                     <ItemActions>
                        <Checkbox
                           checked={field.state.value}
                           onCheckedChange={(checked) =>
                              field.handleChange(checked === true)
                           }
                        />
                     </ItemActions>
                     <ItemContent>
                        <ItemTitle>
                           Resend invitation if one already exists
                        </ItemTitle>
                        <ItemDescription>
                           If an invitation has already been sent to this email,
                           sending another will invalidate the previous
                           invitation.
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               )}
            </form.Field>
         </form>

         <SheetFooter>
            <Button
               onClick={() => closeSheet()}
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
                        sendInvitationMutation.isPending
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {sendInvitationMutation.isPending
                        ? "Sending..."
                        : "Send Invitation"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

export const SendInvitationForm: FC = () => {
   return (
      <>
         <SheetHeader>
            <SheetTitle>Send Invitation</SheetTitle>
            <SheetDescription>
               Invite a new member to join your organization
            </SheetDescription>
         </SheetHeader>
         <ErrorBoundary FallbackComponent={SendInvitationErrorFallback}>
            <Suspense fallback={<SendInvitationSkeleton />}>
               <SendInvitationFormContent />
            </Suspense>
         </ErrorBoundary>
      </>
   );
};
