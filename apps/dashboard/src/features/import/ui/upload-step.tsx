import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   AlertCircleIcon,
   FileSpreadsheetIcon,
   FileTextIcon,
   Loader2Icon,
   ShieldCheckIcon,
   UploadIcon,
   XIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { detectFileType, type ImportedFile } from "../lib/use-import-wizard";

const MAX_FILES = 10;

interface UploadStepProps {
   onFilesUploaded: (files: ImportedFile[]) => void;
   initialFiles?: ImportedFile[];
}

export function UploadStep({
   onFilesUploaded,
   initialFiles = [],
}: UploadStepProps) {
   const [error, setError] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [files, setFiles] = useState<ImportedFile[]>(initialFiles);

   const processFile = useCallback(
      async (file: File, fileIndex: number): Promise<ImportedFile | null> => {
         try {
            const fileType = detectFileType(file.name);
            if (!fileType) {
               return null;
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
               return {
                  fileIndex,
                  filename: file.name,
                  fileType,
                  content: base64Content,
                  status: "pending",
               };
            }
            // For OFX files, use binary encoding
            const bytes = new Uint8Array(arrayBuffer);
            let binaryString = "";
            for (let i = 0; i < bytes.length; i++) {
               binaryString += String.fromCharCode(bytes[i] ?? 0);
            }
            const base64Content = btoa(binaryString);
            return {
               fileIndex,
               filename: file.name,
               fileType,
               content: base64Content,
               status: "pending",
            };
         } catch (err) {
            console.error("Failed to process file:", file.name, err);
            return null;
         }
      },
      [],
   );

   const handleFileDrop = useCallback(
      async (acceptedFiles: File[]) => {
         setError(null);

         // Check if adding these files would exceed the limit
         const remainingSlots = MAX_FILES - files.length;
         if (remainingSlots <= 0) {
            setError(`Limite máximo de ${MAX_FILES} arquivos atingido`);
            toast.error(`Limite máximo de ${MAX_FILES} arquivos`);
            return;
         }

         // Only process up to the remaining slots
         const filesToProcess = acceptedFiles.slice(0, remainingSlots);
         if (filesToProcess.length < acceptedFiles.length) {
            toast.warning(
               `Apenas ${filesToProcess.length} de ${acceptedFiles.length} arquivos adicionados (limite: ${MAX_FILES})`,
            );
         }

         // Check for unsupported files
         const unsupportedFiles = filesToProcess.filter(
            (f) => !detectFileType(f.name),
         );
         if (unsupportedFiles.length > 0) {
            const names = unsupportedFiles.map((f) => f.name).join(", ");
            toast.error(`Arquivos não suportados: ${names}`);
         }

         // Filter to only supported files
         const supportedFiles = filesToProcess.filter((f) =>
            detectFileType(f.name),
         );
         if (supportedFiles.length === 0) {
            setError("Nenhum arquivo suportado. Use arquivos .csv ou .ofx");
            return;
         }

         setIsProcessing(true);

         try {
            // Process all files
            const startIndex = files.length;
            const processedPromises = supportedFiles.map((file, idx) =>
               processFile(file, startIndex + idx),
            );
            const processedFiles = await Promise.all(processedPromises);

            // Filter out failed files
            const successfulFiles = processedFiles.filter(
               (f): f is ImportedFile => f !== null,
            );

            if (successfulFiles.length === 0) {
               setError("Erro ao processar os arquivos. Tente novamente.");
               return;
            }

            // Merge with existing files
            const newFiles = [...files, ...successfulFiles];
            setFiles(newFiles);
            onFilesUploaded(newFiles);

            toast.success(`${successfulFiles.length} arquivo(s) adicionado(s)`);
         } catch (err) {
            console.error("Failed to process files:", err);
            setError("Erro ao processar os arquivos. Tente novamente.");
            toast.error("Erro ao processar arquivos");
         } finally {
            setIsProcessing(false);
         }
      },
      [files, onFilesUploaded, processFile],
   );

   const handleRemoveFile = useCallback(
      (indexToRemove: number) => {
         const newFiles = files
            .filter((_, idx) => idx !== indexToRemove)
            .map((f, idx) => ({ ...f, fileIndex: idx }));
         setFiles(newFiles);
         onFilesUploaded(newFiles);
      },
      [files, onFilesUploaded],
   );

   const handleClearAll = useCallback(() => {
      setFiles([]);
      onFilesUploaded([]);
   }, [onFilesUploaded]);

   const csvCount = files.filter((f) => f.fileType === "csv").length;
   const ofxCount = files.filter((f) => f.fileType === "ofx").length;

   return (
      <div className="space-y-4">
         <Alert>
            <ShieldCheckIcon className="size-4" />
            <AlertTitle>Processamento local e seguro</AlertTitle>
            <AlertDescription>
               Seus arquivos são processados localmente no seu navegador. Apenas
               os dados necessários são enviados ao servidor para importação.
            </AlertDescription>
         </Alert>

         <Dropzone
            accept={{
               "text/csv": [".csv"],
               "application/x-ofx": [".ofx"],
               "text/plain": [".ofx", ".csv"],
            }}
            className="h-48"
            disabled={isProcessing || files.length >= MAX_FILES}
            maxFiles={MAX_FILES}
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
                        Arraste arquivos ou{" "}
                        <span className="text-primary">
                           clique para selecionar
                        </span>
                     </p>
                     <p className="text-sm text-muted-foreground">
                        Formatos aceitos: CSV, OFX (máx. {MAX_FILES} arquivos,
                        10MB cada)
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

         {/* File list */}
         {files.length > 0 && (
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                     {files.length} arquivo(s) selecionado(s)
                     {csvCount > 0 && ofxCount > 0 && (
                        <span className="text-muted-foreground ml-1">
                           ({csvCount} CSV, {ofxCount} OFX)
                        </span>
                     )}
                  </p>
                  <Button
                     className="text-muted-foreground hover:text-destructive"
                     onClick={handleClearAll}
                     size="sm"
                     variant="ghost"
                  >
                     Limpar tudo
                  </Button>
               </div>
               <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                     <div
                        className="flex items-center justify-between p-3 hover:bg-muted/50"
                        key={`file-${index + 1}`}
                     >
                        <div className="flex items-center gap-3 min-w-0">
                           <div
                              className={`p-1.5 rounded-lg ${
                                 file.fileType === "csv"
                                    ? "bg-green-500/10"
                                    : "bg-blue-500/10"
                              }`}
                           >
                              {file.fileType === "csv" ? (
                                 <FileSpreadsheetIcon className="size-4 text-green-600" />
                              ) : (
                                 <FileTextIcon className="size-4 text-blue-600" />
                              )}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                 {file.filename}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase">
                                 {file.fileType}
                              </p>
                           </div>
                        </div>
                        <Button
                           className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                           onClick={() => handleRemoveFile(index)}
                           size="icon"
                           variant="ghost"
                        >
                           <XIcon className="size-4" />
                        </Button>
                     </div>
                  ))}
               </div>
            </div>
         )}

         <div className="grid grid-cols-2 gap-4">
            <Item variant="outline">
               <ItemMedia
                  className="bg-green-500/10 border-green-500/20"
                  variant="icon"
               >
                  <FileSpreadsheetIcon className="text-green-600" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>CSV</ItemTitle>
                  <ItemDescription>Planilhas de extrato</ItemDescription>
               </ItemContent>
            </Item>
            <Item variant="outline">
               <ItemMedia
                  className="bg-blue-500/10 border-blue-500/20"
                  variant="icon"
               >
                  <FileTextIcon className="text-blue-600" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>OFX</ItemTitle>
                  <ItemDescription>Extrato bancário padrão</ItemDescription>
               </ItemContent>
            </Item>
         </div>

         {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4">
               <Loader2Icon className="size-4 animate-spin text-primary" />
               <span className="text-sm text-muted-foreground">
                  Processando arquivos...
               </span>
            </div>
         )}
      </div>
   );
}
