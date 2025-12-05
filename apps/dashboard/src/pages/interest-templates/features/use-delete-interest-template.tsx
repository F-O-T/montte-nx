import type { InterestTemplate } from "@packages/database/repositories/interest-template-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useDeleteInterestTemplate({
   template,
   onSuccess,
}: {
   template: InterestTemplate;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteTemplateMutation = useMutation(
      trpc.interestTemplates.delete.mutationOptions({
         onError: () => {
            toast.error(
               translate("dashboard.routes.interest-templates.delete.error"),
            );
         },
         onSuccess: () => {
            toast.success(
               translate("dashboard.routes.interest-templates.delete.success"),
            );
            onSuccess?.();
         },
      }),
   );

   const deleteInterestTemplate = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.interest-templates.bulk-actions.delete",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "dashboard.routes.interest-templates.delete.confirm-description",
         ),
         onAction: async () => {
            await deleteTemplateMutation.mutateAsync({ id: template.id });
         },
         title: translate(
            "dashboard.routes.interest-templates.delete.confirm-title",
         ),
         variant: "destructive",
      });
   };

   return {
      deleteInterestTemplate,
      isDeleting: deleteTemplateMutation.isPending,
   };
}
