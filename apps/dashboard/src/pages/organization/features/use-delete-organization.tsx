import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

interface Organization {
   id: string;
   name: string;
}

interface UseDeleteOrganizationParams {
   organization: Organization | null | undefined;
   onSuccess?: () => void;
}

export function useDeleteOrganization({
   organization,
   onSuccess,
}: UseDeleteOrganizationParams) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const setActiveOrganizationMutation = useMutation(
      trpc.organization.setActiveOrganization.mutationOptions(),
   );

   const deleteOrganizationMutation = useMutation(
      trpc.organization.deleteOrganization.mutationOptions({
         onError: (error) => {
            console.error("Failed to delete organization", error);
            toast.error("Failed to delete organization. Please try again.");
         },
         onSuccess: async () => {
            const wasActiveOrganization = !!organization;
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
            onSuccess?.();
         },
      }),
   );

   const deleteOrganization = () => {
      openAlertDialog({
         actionLabel: "Delete Organization",
         description:
            "This action will permanently delete your organization and all its data. This action cannot be undone.",
         onAction: async () => {
            await deleteOrganizationMutation.mutateAsync();
         },
         title: "Delete Organization",
         variant: "destructive",
      });
   };

   return {
      deleteOrganization,
      isDeleting: deleteOrganizationMutation.isPending,
   };
}
