import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface DeleteOrganizationDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function DeleteOrganizationDialog({
   open,
   onOpenChange,
}: DeleteOrganizationDialogProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const setActiveOrganizationMutation = useMutation(
      trpc.organization.setActiveOrganization.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });
         },
      }),
   );

   const deleteOrganizationMutation = useMutation(
      trpc.organization.deleteOrganization.mutationOptions({
         onError: (error) => {
            console.error("Failed to delete organization", error);
            toast.error("Failed to delete organization. Please try again.");
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });

            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getOrganizations.queryKey(),
            });

            const wasActiveOrganization = !!activeOrganization;
            if (!wasActiveOrganization) return;

            const updatedOrganizations = await queryClient.fetchQuery(
               trpc.organization.getOrganizations.queryOptions(),
            );

            if (updatedOrganizations && updatedOrganizations.length > 0) {
               await setActiveOrganizationMutation.mutateAsync({
                  organizationId: updatedOrganizations[0]?.id,
               });
            }

            toast.success("Organization deleted successfully");
            onOpenChange(false);
         },
      }),
   );

   const handleDelete = useCallback(() => {
      deleteOrganizationMutation.mutate();
   }, [deleteOrganizationMutation]);

   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Delete Organization</AlertDialogTitle>
               <AlertDialogDescription>
                  This action will permanently delete your organization and all
                  its data. This action cannot be undone.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction asChild>
                  <Button
                     disabled={deleteOrganizationMutation.isPending}
                     onClick={handleDelete}
                     variant="destructive"
                  >
                     {deleteOrganizationMutation.isPending
                        ? "Deleting..."
                        : "Delete Organization"}
                  </Button>
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
