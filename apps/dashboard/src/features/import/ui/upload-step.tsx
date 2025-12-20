import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import {
   AlertCircleIcon,
   FileSpreadsheetIcon,
   FileTextIcon,
   Loader2Icon,
   ShieldCheckIcon,
   UploadIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { detectFileType, type FileType } from "../lib/use-import-wizard";

interface UploadStepProps {
   onFileUploaded: (
      fileType: FileType,
      filename: string,
      content: string,
   ) => void;
}

export function UploadStep({ onFileUploaded }: UploadStepProps) {
   const [error, setError] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);

   const processFile = useCallback(
      async (file: File) => {
         setError(null);
         setIsProcessing(true);

         try {
            const fileType = detectFileType(file.name);
            if (!fileType) {
               setError(
                  "Formato de arquivo não suportado. Use arquivos .csv ou .ofx",
               );
               setIsProcessing(false);
               return;
            }

            // Read file and encode as base64
            const arrayBuffer = await file.arrayBuffer();

            // For CSV files, decode as UTF-8 text first, then encode to base64
            // This preserves special characters like "às" in Portuguese
            if (fileType === "csv") {
               const decoder = new TextDecoder("utf-8");
               const text = decoder.decode(arrayBuffer);
               // Use a UTF-8 safe base64 encoding
               const base64Content = btoa(
                  encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) =>
                     String.fromCharCode(Number.parseInt(p1, 16)),
                  ),
               );
               onFileUploaded(fileType, file.name, base64Content);
            } else {
               // For OFX files, use binary encoding
               const bytes = new Uint8Array(arrayBuffer);
               let binaryString = "";
               for (let i = 0; i < bytes.length; i++) {
                  binaryString += String.fromCharCode(bytes[i] ?? 0);
               }
               const base64Content = btoa(binaryString);
               onFileUploaded(fileType, file.name, base64Content);
            }
         } catch (err) {
            console.error("Failed to process file:", err);
            setError("Erro ao processar o arquivo. Tente novamente.");
            toast.error("Erro ao processar o arquivo");
         } finally {
            setIsProcessing(false);
         }
      },
      [onFileUploaded],
   );

   const handleFileDrop = useCallback(
      async (acceptedFiles: File[]) => {
         const file = acceptedFiles[0];
         if (!file) return;
         processFile(file);
      },
      [processFile],
   );

   return (
      <div className="space-y-4">
         <Alert>
            <ShieldCheckIcon className="size-4" />
            <AlertTitle>Processamento local e seguro</AlertTitle>
            <AlertDescription>
               Seu arquivo é processado localmente no seu navegador. Apenas os
               dados necessários são enviados ao servidor para importação.
            </AlertDescription>
         </Alert>

         <Dropzone
            accept={{
               "text/csv": [".csv"],
               "application/x-ofx": [".ofx"],
               "text/plain": [".ofx", ".csv"],
            }}
            className="h-48"
            disabled={isProcessing}
            maxFiles={1}
            maxSize={10 * 1024 * 1024}
            onDrop={handleFileDrop}
         >
            <DropzoneEmptyState>
               <div className="flex flex-col items-center justify-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                     <UploadIcon className="size-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                     <p className="font-medium">
                        Arraste um arquivo ou{" "}
                        <span className="text-primary">
                           clique para selecionar
                        </span>
                     </p>
                     <p className="text-sm text-muted-foreground">
                        Formatos aceitos: CSV, OFX (máx. 10MB)
                     </p>
                  </div>
               </div>
            </DropzoneEmptyState>
            <DropzoneContent />
         </Dropzone>

         {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
               <AlertCircleIcon className="size-4 shrink-0" />
               <p className="text-sm">{error}</p>
            </div>
         )}

         <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
               <div className="p-2 rounded-lg bg-green-500/10">
                  <FileSpreadsheetIcon className="size-5 text-green-600" />
               </div>
               <div>
                  <p className="font-medium text-sm">CSV</p>
                  <p className="text-xs text-muted-foreground">
                     Planilhas de extrato
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
               <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileTextIcon className="size-5 text-blue-600" />
               </div>
               <div>
                  <p className="font-medium text-sm">OFX</p>
                  <p className="text-xs text-muted-foreground">
                     Extrato bancário padrão
                  </p>
               </div>
            </div>
         </div>

         {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4">
               <Loader2Icon className="size-4 animate-spin text-primary" />
               <span className="text-sm text-muted-foreground">
                  Processando arquivo...
               </span>
            </div>
         )}
      </div>
   );
}
