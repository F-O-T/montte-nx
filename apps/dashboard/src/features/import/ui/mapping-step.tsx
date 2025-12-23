import { previewCsv } from "@packages/csv";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { FileSpreadsheetIcon, InfoIcon, Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ColumnMapping, CsvPreviewData, ImportedFile } from "../lib/use-import-wizard";
import { CsvColumnMapper } from "./csv-column-mapper";

interface MappingStepProps {
   files: ImportedFile[];
   initialCsvPreviewData: CsvPreviewData | null;
   initialColumnMapping: ColumnMapping | null;
   onBack: () => void;
   onComplete: (mapping: ColumnMapping, previewData: CsvPreviewData) => void;
}

export function MappingStep({
   files,
   initialCsvPreviewData,
   initialColumnMapping,
   onBack,
   onComplete,
}: MappingStepProps) {
   const [isLoading, setIsLoading] = useState(!initialCsvPreviewData);
   const [error, setError] = useState<string | null>(null);
   const [previewData, setPreviewData] = useState<CsvPreviewData | null>(
      initialCsvPreviewData,
   );
   const hasLoadedRef = useRef(false);

   // Get CSV files only
   const csvFiles = files.filter((f) => f.fileType === "csv");
   const firstCsvFile = csvFiles[0];

   useEffect(() => {
      if (hasLoadedRef.current || previewData || !firstCsvFile) return;
      hasLoadedRef.current = true;

      try {
         // Decode base64 content preserving UTF-8 characters
         const decodedContent = decodeURIComponent(
            atob(firstCsvFile.content)
               .split("")
               .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
               .join(""),
         );
         const result = previewCsv(decodedContent);
         setPreviewData(result);
         setIsLoading(false);
      } catch (err) {
         console.error("Failed to preview CSV:", err);
         setError(
            err instanceof Error
               ? err.message
               : "Erro ao processar arquivo CSV",
         );
         setIsLoading(false);
         toast.error("Erro ao processar arquivo CSV");
      }
   }, [firstCsvFile, previewData]);

   const handleMappingComplete = (mapping: {
      date: number;
      amount: number;
      description: number;
   }) => {
      if (previewData) {
         onComplete(mapping, previewData);
      }
   };

   if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2Icon className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
               Analisando arquivo CSV...
            </p>
         </div>
      );
   }

   if (error) {
      return (
         <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <XIcon className="size-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
         </div>
      );
   }

   if (!previewData) {
      return (
         <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2Icon className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {/* Shared mapping banner for multiple CSVs */}
         {csvFiles.length > 1 && (
            <Alert>
               <InfoIcon className="size-4" />
               <AlertTitle>Mapeamento compartilhado</AlertTitle>
               <AlertDescription className="space-y-2">
                  <p>
                     Este mapeamento será aplicado a todos os {csvFiles.length} arquivos CSV.
                     Certifique-se de que todos os arquivos possuem a mesma estrutura de colunas.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                     {csvFiles.map((file) => (
                        <div
                           key={`csv-file-${file.fileIndex}`}
                           className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-xs"
                        >
                           <FileSpreadsheetIcon className="size-3 text-green-600" />
                           <span className="truncate max-w-[120px]">{file.filename}</span>
                        </div>
                     ))}
                  </div>
               </AlertDescription>
            </Alert>
         )}

         {/* Show which file is being used for preview */}
         {csvFiles.length > 1 && firstCsvFile && (
            <p className="text-xs text-muted-foreground">
               Visualizando: <span className="font-medium">{firstCsvFile.filename}</span>
            </p>
         )}

         <CsvColumnMapper
            detectedFormat={previewData.detectedFormat}
            headers={previewData.headers}
            onBack={onBack}
            onMappingComplete={handleMappingComplete}
            sampleRows={previewData.sampleRows}
            suggestedMapping={
               initialColumnMapping
                  ? {
                       date: initialColumnMapping.date,
                       amount: initialColumnMapping.amount,
                       description: initialColumnMapping.description,
                    }
                  : previewData.suggestedMapping
            }
         />
      </div>
   );
}
