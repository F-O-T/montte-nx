import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDeleteOrganization as useDeleteOrganizationMutation } from "@/features/organization/hooks/use-delete-organization";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
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
   const [isDeleting, setIsDeleting] = useState(false);

   const { setActiveOrganization } = useSetActiveOrganization({
      showToast: false,
   });

   const { deleteOrganization: deleteOrg } = useDeleteOrganizationMutation({
      onSuccess: async () => {
         const wasActiveOrganization = !!organization;
         if (!wasActiveOrganization) {
            onSuccess?.();
            setIsDeleting(false);
            return;
         }

         const updatedOrganizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         if (updatedOrganizations && updatedOrganizations.length > 0) {
            await setActiveOrganization({
               organizationId: updatedOrganizations[0]?.id,
            });
         }

         onSuccess?.();
         setIsDeleting(false);
      },
      onError: () => {
         setIsDeleting(false);
      },
   });

   const deleteOrganization = () => {
      openAlertDialog({
         actionLabel: "Delete Organization",
         description:
            "This action will permanently delete your organization and all its data. This action cannot be undone.",
         onAction: async () => {
            if (!organization?.id) return;
            setIsDeleting(true);
            await deleteOrg(organization.id);
         },
         title: "Delete Organization",
         variant: "destructive",
      });
   };

   return {
      deleteOrganization,
      isDeleting,
   };
}
