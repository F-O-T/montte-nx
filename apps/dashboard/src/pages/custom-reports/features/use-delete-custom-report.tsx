import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import type { CustomReport } from "../ui/custom-reports-page";

export function useDeleteCustomReport({
   report,
   onSuccess,
}: {
   report: CustomReport;
   onSuccess?: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();

   const deleteReportMutation = useMutation(
      trpc.customReports.delete.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao excluir relatório");
         },
         onSuccess: () => {
            toast.success("Relatório excluído com sucesso");
            onSuccess?.();
         },
      }),
   );

   const deleteReport = () => {
      openAlertDialog({
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         description:
            "Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.",
         onAction: async () => {
            await deleteReportMutation.mutateAsync({ id: report.id });
         },
         title: "Excluir Relatório",
         variant: "destructive",
      });
   };

   return { deleteReport, isDeleting: deleteReportMutation.isPending };
}
