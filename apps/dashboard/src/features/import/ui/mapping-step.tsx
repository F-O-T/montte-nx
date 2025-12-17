import { previewCsv } from "@packages/csv";
import { Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ColumnMapping, CsvPreviewData } from "../types";
import { CsvColumnMapper } from "./csv-column-mapper";

interface MappingStepProps {
   content: string;
   initialCsvPreviewData: CsvPreviewData | null;
   initialColumnMapping: ColumnMapping | null;
   onBack: () => void;
   onComplete: (mapping: ColumnMapping, previewData: CsvPreviewData) => void;
}

export function MappingStep({
   content,
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

   useEffect(() => {
      if (hasLoadedRef.current || previewData) return;
      hasLoadedRef.current = true;

      try {
         // Decode base64 content preserving UTF-8 characters
         const decodedContent = decodeURIComponent(
            atob(content)
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
   }, [content, previewData]);

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
   );
}
