import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
   AlertCircle,
   CheckCircle2,
   FileSpreadsheet,
   Loader2,
   X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";

type FileToImport = {
   name: string;
   content: string;
   error?: string;
};

type ImportOfxSheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   bankAccountId: string;
};

export function ImportOfxSheet({
   isOpen,
   onOpenChange,
   bankAccountId,
}: ImportOfxSheetProps) {
   const queryClient = useQueryClient();
   const [files, setFiles] = useState<FileToImport[]>([]);
   const [isReadingFiles, setIsReadingFiles] = useState(false);
   const [importedCount, setImportedCount] = useState(0);
   const [totalToImport, setTotalToImport] = useState(0);

   const hasFiles = files.length > 0;
   const validFiles = files.filter((f) => !f.error);
   const filesWithErrors = files.filter((f) => f.error);

   const parseOfxMutation = useMutation(
      trpc.bankAccounts.parseOfx.mutationOptions({
         onError: (error) => {
            console.error("Failed to parse OFX:", error);
         },
      }),
   );

   const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsReadingFiles(true);

      const newFiles: FileToImport[] = [];

      for (const file of acceptedFiles) {
         try {
            const content = await file.text();
            newFiles.push({
               content,
               name: file.name,
            });
         } catch (error) {
            const message =
               error instanceof Error ? error.message : "Erro ao ler arquivo";
            newFiles.push({
               content: "",
               error: message,
               name: file.name,
            });
         }
      }

      setFiles((prev) => [...prev, ...newFiles]);

      const errorCount = newFiles.filter((f) => f.error).length;
      const successCount = newFiles.filter((f) => !f.error).length;

      if (errorCount > 0 && successCount > 0) {
         toast.warning(
            `${successCount} arquivo(s) carregado(s), ${errorCount} com erro`,
         );
      } else if (errorCount > 0) {
         toast.error(`Erro ao carregar ${errorCount} arquivo(s)`);
      }

      setIsReadingFiles(false);
   }, []);

   const removeFile = (fileName: string) => {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
   };

   const handleImport = async () => {
      if (validFiles.length === 0) {
         toast.error("Nenhum arquivo valido para importar");
         return;
      }

      setTotalToImport(validFiles.length);
      setImportedCount(0);

      let totalTransactionsCreated = 0;
      let filesProcessed = 0;

      try {
         for (const file of validFiles) {
            const result = await parseOfxMutation.mutateAsync({
               bankAccountId,
               content: file.content,
            });
            totalTransactionsCreated += result.length;
            filesProcessed++;
            setImportedCount(filesProcessed);
         }

         await Promise.all([
            queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAllPaginated.queryKey(),
            }),
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getTransactions.queryKey(),
            }),
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getById.queryKey(),
            }),
         ]);

         if (totalTransactionsCreated > 0) {
            toast.success(
               `${totalTransactionsCreated} transacoes importadas com sucesso`,
            );
         } else {
            toast.info(
               "Nenhuma transacao nova encontrada (possiveis duplicatas)",
            );
         }
         handleClose();
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : "Erro ao importar transacoes";
         toast.error(message);
      } finally {
         setTotalToImport(0);
      }
   };

   const handleClose = () => {
      setFiles([]);
      setImportedCount(0);
      setTotalToImport(0);
      onOpenChange(false);
   };

   const isImporting = totalToImport > 0;

   return (
      <Sheet onOpenChange={handleClose} open={isOpen}>
         <SheetContent className="flex flex-col sm:max-w-lg" side="right">
            <SheetHeader>
               <SheetTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="size-5" />
                  Importar OFX
               </SheetTitle>
               <SheetDescription>
                  Importe transacoes de arquivos OFX do seu banco. Voce pode
                  selecionar multiplos arquivos. Transacoes duplicadas serao
                  ignoradas automaticamente.
               </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden px-4">
               <Dropzone
                  accept={{
                     "application/x-ofx": [".ofx"],
                     "text/plain": [".ofx"],
                  }}
                  className={hasFiles ? "h-24 mb-4" : "h-48"}
                  disabled={isImporting}
                  maxFiles={20}
                  maxSize={10 * 1024 * 1024}
                  onDrop={handleFileDrop}
               >
                  <DropzoneEmptyState>
                     <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="size-10 text-muted-foreground" />
                        <p className="font-medium text-sm">
                           {hasFiles
                              ? "Adicionar mais arquivos"
                              : "Arraste arquivos OFX aqui"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                           ou clique para selecionar (multiplos arquivos)
                        </p>
                     </div>
                  </DropzoneEmptyState>
                  <DropzoneContent />
               </Dropzone>

               {isReadingFiles && (
                  <div className="flex h-24 flex-col items-center justify-center gap-2">
                     <Loader2 className="size-6 animate-spin text-primary" />
                     <p className="text-muted-foreground text-sm">
                        Carregando arquivos...
                     </p>
                  </div>
               )}

               {filesWithErrors.length > 0 && (
                  <div className="mb-4 space-y-2">
                     {filesWithErrors.map((file) => (
                        <div
                           className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm"
                           key={file.name}
                        >
                           <AlertCircle className="size-4 text-destructive shrink-0" />
                           <span className="flex-1 truncate">{file.name}</span>
                           <span className="text-destructive text-xs truncate max-w-32">
                              {file.error}
                           </span>
                           <Button
                              className="size-6 shrink-0"
                              disabled={isImporting}
                              onClick={() => removeFile(file.name)}
                              size="icon"
                              variant="ghost"
                           >
                              <X className="size-3" />
                           </Button>
                        </div>
                     ))}
                  </div>
               )}

               {validFiles.length > 0 && (
                  <div className="flex flex-col gap-4">
                     <div className="flex flex-wrap gap-2">
                        {validFiles.map((file) => (
                           <Badge
                              className="gap-1 pr-1"
                              key={file.name}
                              variant="secondary"
                           >
                              <FileSpreadsheet className="size-3" />
                              <span className="max-w-32 truncate">
                                 {file.name}
                              </span>
                              <Button
                                 className="size-4 ml-1 hover:bg-destructive/20"
                                 disabled={isImporting}
                                 onClick={() => removeFile(file.name)}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <X className="size-3" />
                              </Button>
                           </Badge>
                        ))}
                     </div>

                     <p className="text-muted-foreground text-sm">
                        {validFiles.length} arquivo(s) pronto(s) para importar
                     </p>
                  </div>
               )}

               {isImporting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                     <Loader2 className="size-8 animate-spin text-primary" />
                     <p className="text-sm">
                        Importando arquivo {importedCount} de {totalToImport}...
                     </p>
                  </div>
               )}
            </div>

            <SheetFooter className="px-4">
               {validFiles.length > 0 && (
                  <Button
                     className="w-full"
                     disabled={validFiles.length === 0 || isImporting}
                     onClick={handleImport}
                  >
                     {isImporting ? (
                        <>
                           <Loader2 className="mr-2 size-4 animate-spin" />
                           Importando...
                        </>
                     ) : (
                        <>
                           <CheckCircle2 className="mr-2 size-4" />
                           Importar {validFiles.length}{" "}
                           {validFiles.length === 1 ? "arquivo" : "arquivos"}
                        </>
                     )}
                  </Button>
               )}
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
}
