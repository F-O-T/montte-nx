import { Button } from "@packages/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { FileUp, XIcon } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePendingImport } from "@/hooks/use-pending-import";
import {
   type ColumnMapping,
   type CsvPreviewData,
   type DuplicateInfo,
   type FileType,
   getStepsForFileType,
   type ImportStep,
   type ParsedTransaction,
} from "../lib/use-import-wizard";
import { AccountStep } from "./account-step";
import { ImportingStep } from "./importing-step";
import { MappingStep } from "./mapping-step";
import { PreviewStep } from "./preview-step";
import { UploadStep } from "./upload-step";

interface ImportWizardProps {
   slug: string;
   initialStep?: ImportStep;
   initialBankAccountId?: string;
}

export function ImportWizard({
   slug,
   initialStep = "select-account",
   initialBankAccountId,
}: ImportWizardProps) {
   const navigate = useNavigate();
   const { getPending, updatePending, clearPending } = usePendingImport();

   // State
   const [step, setStep] = useState<ImportStep>(initialStep);
   const [bankAccountId, setBankAccountId] = useState<string | null>(
      initialBankAccountId ?? null,
   );
   const [fileType, setFileType] = useState<FileType | null>(null);
   const [filename, setFilename] = useState<string | null>(null);
   const [content, setContent] = useState<string | null>(null);
   const [csvPreviewData, setCsvPreviewData] = useState<CsvPreviewData | null>(
      null,
   );
   const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(
      null,
   );
   const [parsedTransactions, setParsedTransactions] = useState<
      ParsedTransaction[]
   >([]);
   const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
   const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
   const [duplicatesChecked, setDuplicatesChecked] = useState(false);

   // Load state from session storage on mount
   useEffect(() => {
      const pending = getPending();
      if (pending) {
         setFileType(pending.fileType);
         setFilename(pending.filename);
         setContent(pending.content);
         setBankAccountId(pending.bankAccountId);
         setCsvPreviewData(pending.csvPreviewData);
         setColumnMapping(pending.columnMapping);
         setDuplicates(pending.duplicates);
         setDuplicatesChecked(pending.duplicatesChecked);

         // Deserialize transactions
         if (pending.parsedTransactions.length > 0) {
            const deserialized = pending.parsedTransactions.map((t) => ({
               ...t,
               date: new Date(t.date),
            }));
            setParsedTransactions(deserialized);
         }

         // Deserialize selected rows
         if (pending.selectedRowIndices.length > 0) {
            setSelectedRows(new Set(pending.selectedRowIndices));
         }
      }
   }, [getPending]);

   // Persist state changes to session storage
   const persistState = useCallback(() => {
      if (!fileType || !content || !filename) return;

      updatePending({
         fileType,
         filename,
         content,
         bankAccountId,
         csvPreviewData,
         columnMapping,
         parsedTransactions: parsedTransactions.map((t) => ({
            ...t,
            date: t.date.toISOString(),
         })),
         selectedRowIndices: Array.from(selectedRows),
         duplicates,
         duplicatesChecked,
      });
   }, [
      fileType,
      filename,
      content,
      bankAccountId,
      csvPreviewData,
      columnMapping,
      parsedTransactions,
      selectedRows,
      duplicates,
      duplicatesChecked,
      updatePending,
   ]);

   // Persist on state changes (debounced via effect)
   useEffect(() => {
      if (fileType && content && filename) {
         persistState();
      }
   }, [fileType, content, filename, persistState]);

   // Navigation
   const steps = getStepsForFileType(fileType);
   const currentStepIndex = steps.indexOf(step);
   const totalSteps = fileType ? steps.length : 5; // Show 5 steps in indicator before file type is known

   const handleCancel = useCallback(() => {
      clearPending();
      navigate({
         params: { slug },
         to: "/$slug/bank-accounts",
      });
   }, [clearPending, navigate, slug]);

   const handleBack = useCallback(() => {
      const prevIndex = currentStepIndex - 1;
      const prevStep = steps[prevIndex];
      if (prevIndex >= 0 && prevStep) {
         setStep(prevStep);
      } else {
         handleCancel();
      }
   }, [currentStepIndex, steps, handleCancel]);

   const goToStep = useCallback((nextStep: ImportStep) => {
      setStep(nextStep);
   }, []);

   // Step handlers
   const handleAccountSelected = useCallback(
      (accountId: string) => {
         setBankAccountId(accountId);
         goToStep("upload");
      },
      [goToStep],
   );

   const handleFileUploaded = useCallback(
      (
         uploadedFileType: FileType,
         uploadedFilename: string,
         uploadedContent: string,
      ) => {
         setFileType(uploadedFileType);
         setFilename(uploadedFilename);
         setContent(uploadedContent);

         // If OFX, skip column mapping
         if (uploadedFileType === "ofx") {
            goToStep("preview");
         } else {
            goToStep("column-mapping");
         }
      },
      [goToStep],
   );

   const handleMappingComplete = useCallback(
      (mapping: ColumnMapping, previewData: CsvPreviewData) => {
         setColumnMapping(mapping);
         setCsvPreviewData(previewData);
         goToStep("preview");
      },
      [goToStep],
   );

   const handlePreviewComplete = useCallback(
      (
         transactions: ParsedTransaction[],
         selected: Set<number>,
         dups: DuplicateInfo[],
      ) => {
         setParsedTransactions(transactions);
         setSelectedRows(selected);
         setDuplicates(dups);
         setDuplicatesChecked(true);
         goToStep("importing");
      },
      [goToStep],
   );

   const handleImportComplete = useCallback(() => {
      clearPending();
      if (bankAccountId) {
         navigate({
            params: { slug, bankAccountId },
            to: "/$slug/bank-accounts/$bankAccountId",
         });
      } else {
         navigate({
            params: { slug },
            to: "/$slug/bank-accounts",
         });
      }
   }, [clearPending, navigate, slug, bankAccountId]);

   // Step indicator
   const StepIndicator = () => (
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, index) => (
               <div
                  className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                     index <= currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                  key={`step-${index + 1}`}
               />
            ))}
         </div>
         <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentStepIndex + 1} de {totalSteps}
         </span>
      </div>
   );

   const getStepTitle = () => {
      switch (step) {
         case "select-account":
            return "Selecionar Conta";
         case "upload":
            return "Selecionar Arquivo";
         case "column-mapping":
            return "Mapear Colunas";
         case "preview":
            return "Revisar Transações";
         case "importing":
            return "Importando...";
         default:
            return "";
      }
   };

   const getStepDescription = () => {
      switch (step) {
         case "select-account":
            return "Escolha a conta bancária para importar as transações";
         case "upload":
            return "Arraste ou selecione um arquivo CSV ou OFX";
         case "column-mapping":
            return "Indique quais colunas correspondem a data, valor e descrição";
         case "preview":
            return "Revise e selecione as transações a importar";
         case "importing":
            return "Processando o arquivo e criando as transações...";
         default:
            return "";
      }
   };

   return (
      <div className="min-h-screen flex flex-col">
         <header className="p-4 border-b">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
               <Button
                  className="gap-2"
                  onClick={handleCancel}
                  size="sm"
                  variant="ghost"
               >
                  <XIcon className="size-4" />
                  Cancelar
               </Button>
               <StepIndicator />
               <div className="w-20" />
            </div>
         </header>

         <div className="flex-1 flex flex-col items-center p-4">
            <div className="w-full max-w-3xl space-y-8">
               <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                     <div className="p-4 rounded-full bg-primary/10">
                        <FileUp className="size-8 text-primary" />
                     </div>
                  </div>
                  <h1 className="text-3xl font-semibold font-serif">
                     {getStepTitle()}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                     {getStepDescription()}
                  </p>
               </div>

               <div className="space-y-4">
                  {step === "select-account" && (
                     <Suspense
                        fallback={
                           <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                 <div
                                    className="h-20 w-full rounded-lg bg-muted animate-pulse"
                                    key={i}
                                 />
                              ))}
                           </div>
                        }
                     >
                        <AccountStep
                           initialBankAccountId={initialBankAccountId}
                           onSelect={handleAccountSelected}
                        />
                     </Suspense>
                  )}

                  {step === "upload" && bankAccountId && (
                     <UploadStep onFileUploaded={handleFileUploaded} />
                  )}

                  {step === "column-mapping" &&
                     bankAccountId &&
                     content &&
                     fileType === "csv" && (
                        <MappingStep
                           content={content}
                           initialColumnMapping={columnMapping}
                           initialCsvPreviewData={csvPreviewData}
                           onBack={handleBack}
                           onComplete={handleMappingComplete}
                        />
                     )}

                  {step === "preview" &&
                     bankAccountId &&
                     content &&
                     fileType &&
                     // For CSV, ensure column mapping and preview data are set
                     (fileType === "ofx" ||
                        (columnMapping && csvPreviewData)) && (
                        <PreviewStep
                           bankAccountId={bankAccountId}
                           columnMapping={columnMapping}
                           content={content}
                           csvPreviewData={csvPreviewData}
                           fileType={fileType}
                           initialDuplicates={duplicates}
                           initialParsedTransactions={parsedTransactions}
                           initialSelectedRows={selectedRows}
                           onBack={handleBack}
                           onComplete={handlePreviewComplete}
                        />
                     )}

                  {step === "importing" && bankAccountId && (
                     <ImportingStep
                        bankAccountId={bankAccountId}
                        onComplete={handleImportComplete}
                        onError={handleBack}
                        selectedRows={selectedRows}
                        transactions={parsedTransactions}
                     />
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
