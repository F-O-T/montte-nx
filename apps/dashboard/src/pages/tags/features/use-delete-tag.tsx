import type { Tag } from "@packages/database/repositories/tag-repository";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

export function useDeleteTag({
   tag,
   onSuccess,
}: {
   tag: Tag;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteTagMutation = useMutation(
      trpc.tags.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Failed to delete tag");
         },
         onSuccess: () => {
            toast.success("Tag deleted successfully");
            onSuccess?.();
         },
      }),
   );

   const deleteTag = () => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.tags.list-section.actions.delete-tag",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description",
         ),
         onAction: async () => {
            await deleteTagMutation.mutateAsync({ id: tag.id });
         },
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   return { deleteTag, isDeleting: deleteTagMutation.isPending };
}
