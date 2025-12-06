import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

export function useExportPdf() {
   const trpc = useTRPC();

   const exportPdfMutation = useMutation(
      trpc.customReports.exportPdf.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao exportar PDF");
         },
         onSuccess: (data) => {
            const byteCharacters = atob(data.buffer);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
               byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: data.contentType });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("PDF exportado com sucesso");
         },
      }),
   );

   const exportPdf = async (reportId: string) => {
      await exportPdfMutation.mutateAsync({ id: reportId });
   };

   return { exportPdf, isExporting: exportPdfMutation.isPending };
}
