import { Button } from "@packages/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import {
   CheckCircle2Icon,
   Download,
   FileIcon,
   FileSpreadsheetIcon,
   FileTextIcon,
   Loader2Icon,
   XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import type { ExportFormat, ExportOptions } from "../lib/use-export-wizard";

interface ExportingStepProps {
   bankAccountId: string;
   options: ExportOptions;
   onComplete: () => void;
   onError: () => void;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
   ofx: "OFX",
   csv: "CSV",
   pdf: "PDF",
};

const FORMAT_MIME_TYPES: Record<ExportFormat, string> = {
   ofx: "application/x-ofx",
   csv: "text/csv;charset=utf-8",
   pdf: "application/pdf",
};

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
   ofx: <FileTextIcon className="size-8 text-blue-600" />,
   csv: <FileSpreadsheetIcon className="size-8 text-green-600" />,
   pdf: <FileIcon className="size-8 text-red-600" />,
};

function downloadFile(content: string, filename: string, format: ExportFormat) {
   let blob: Blob;

   if (format === "pdf") {
      // PDF content is base64 encoded
      const binaryString = atob(content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
         bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: FORMAT_MIME_TYPES[format] });
   } else {
      // OFX and CSV are plain text
      blob = new Blob([content], { type: FORMAT_MIME_TYPES[format] });
   }

   const url = URL.createObjectURL(blob);
   const link = document.createElement("a");
   link.href = url;
   link.download = filename;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
}

export function ExportingStep({
   bankAccountId,
   options,
   onComplete,
   onError,
}: ExportingStepProps) {
   const trpc = useTRPC();
   const hasStartedRef = useRef(false);
   const [status, setStatus] = useState<"exporting" | "success" | "error">(
      "exporting",
   );
   const [transactionCount, setTransactionCount] = useState(0);

   const handleSuccess = (
      data: { content: string; filename: string; transactionCount: number },
      format: ExportFormat,
   ) => {
      downloadFile(data.content, data.filename, format);
      setTransactionCount(data.transactionCount);
      setStatus("success");

      if (data.transactionCount > 0) {
         toast.success(
            `${data.transactionCount} transações exportadas com sucesso`,
         );
      } else {
         toast.info("Nenhuma transação encontrada no período selecionado");
      }
   };

   const handleError = (error: unknown, format: ExportFormat) => {
      console.error(`Failed to export ${format}:`, error);
      setStatus("error");
      toast.error(`Erro ao exportar ${FORMAT_LABELS[format]}`);
   };

   const exportOfxMutation = useMutation(
      trpc.bankAccounts.exportOfx.mutationOptions({
         onError: (error) => handleError(error, "ofx"),
         onSuccess: (data) => handleSuccess(data, "ofx"),
      }),
   );

   const exportCsvMutation = useMutation(
      trpc.bankAccounts.exportCsv.mutationOptions({
         onError: (error) => handleError(error, "csv"),
         onSuccess: (data) => handleSuccess(data, "csv"),
      }),
   );

   const exportPdfMutation = useMutation(
      trpc.bankAccounts.exportPdf.mutationOptions({
         onError: (error) => handleError(error, "pdf"),
         onSuccess: (data) => handleSuccess(data, "pdf"),
      }),
   );

   // Start export on mount
   useEffect(() => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      const exportParams = {
         bankAccountId,
         endDate: options.endDate?.toISOString(),
         startDate: options.startDate?.toISOString(),
         type: options.typeFilter === "all" ? undefined : options.typeFilter,
      };

      switch (options.format) {
         case "csv":
            exportCsvMutation.mutate(exportParams);
            break;
         case "pdf":
            exportPdfMutation.mutate(exportParams);
            break;
         default:
            exportOfxMutation.mutate(exportParams);
            break;
      }
   }, [
      bankAccountId,
      options,
      exportOfxMutation,
      exportCsvMutation,
      exportPdfMutation,
   ]);

   if (status === "exporting") {
      return (
         <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
               <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2Icon className="size-12 animate-spin text-primary" />
               </div>
               <div className="size-24 rounded-full bg-primary/10" />
            </div>
            <div className="text-center space-y-2">
               <p className="font-medium">Exportando transações...</p>
               <p className="text-sm text-muted-foreground">
                  Gerando arquivo {FORMAT_LABELS[options.format]}
               </p>
            </div>
         </div>
      );
   }

   if (status === "error") {
      return (
         <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-4 rounded-full bg-destructive/10">
               <XIcon className="size-8 text-destructive" />
            </div>
            <div className="text-center space-y-2">
               <p className="font-medium text-destructive">Erro ao exportar</p>
               <p className="text-sm text-muted-foreground">
                  Não foi possível gerar o arquivo{" "}
                  {FORMAT_LABELS[options.format]}
               </p>
            </div>
            <Button onClick={onError} variant="outline">
               Voltar
            </Button>
         </div>
      );
   }

   return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
         <div className="p-4 rounded-full bg-green-500/10">
            <CheckCircle2Icon className="size-12 text-green-600" />
         </div>
         <div className="text-center space-y-2">
            <p className="font-medium text-lg">Exportação concluída!</p>
            {transactionCount > 0 ? (
               <p className="text-sm text-muted-foreground">
                  {transactionCount} transação(ões) exportadas com sucesso
               </p>
            ) : (
               <p className="text-sm text-muted-foreground">
                  Nenhuma transação encontrada no período selecionado
               </p>
            )}
         </div>
         <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            {FORMAT_ICONS[options.format]}
            <div>
               <p className="font-medium text-sm">
                  Arquivo {FORMAT_LABELS[options.format]}
               </p>
               <p className="text-xs text-muted-foreground">
                  O download foi iniciado automaticamente
               </p>
            </div>
            <Download className="size-5 text-green-600" />
         </div>
         <Button onClick={onComplete}>Concluir</Button>
      </div>
   );
}
