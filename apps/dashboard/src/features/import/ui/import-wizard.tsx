import { Button } from "@packages/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { FileUp, XIcon } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePendingImport } from "@/hooks/use-pending-import";
import {
   type ColumnMapping,
   type CsvPreviewData,
   type BatchDuplicateInfo,
   type ImportedFile,
   getStepsForBatchFileType,
   type ImportStep,
   type BatchParsedTransaction,
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
   const [files, setFiles] = useState<ImportedFile[]>([]);
   const [csvPreviewData, setCsvPreviewData] = useState<CsvPreviewData | null>(
      null,
   );
   const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(
      null,
   );
   const [parsedTransactions, setParsedTransactions] = useState<
      BatchParsedTransaction[]
   >([]);
   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
   const [duplicates, setDuplicates] = useState<BatchDuplicateInfo[]>([]);
   const [duplicatesChecked, setDuplicatesChecked] = useState(false);

   // Load state from session storage on mount
   useEffect(() => {
      const pending = getPending();
      if (pending) {
         setFiles(pending.files);
         setBankAccountId(pending.bankAccountId);
         setCsvPreviewData(pending.csvPreviewDataList[0]?.previewData ?? null);
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
         if (pending.selectedRowKeys.length > 0) {
            setSelectedRows(new Set(pending.selectedRowKeys));
         }
      }
   }, [getPending]);

   // Persist state changes to session storage
   const persistState = useCallback(() => {
      if (files.length === 0) return;

      updatePending({
         files,
         bankAccountId,
         csvPreviewDataList: csvPreviewData
            ? [{ fileIndex: 0, previewData: csvPreviewData }]
            : [],
         columnMapping,
         parsedTransactions: parsedTransactions.map((t) => ({
            ...t,
            date: t.date.toISOString(),
         })),
         selectedRowKeys: Array.from(selectedRows),
         duplicates,
         duplicatesChecked,
      });
   }, [
      files,
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
      if (files.length > 0) {
         persistState();
      }
   }, [files, persistState]);

   // Navigation
   const steps = getStepsForBatchFileType(files);
   const currentStepIndex = steps.indexOf(step);
   const totalSteps = files.length > 0 ? steps.length : 5;

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

   const handleFilesUploaded = useCallback(
      (uploadedFiles: ImportedFile[]) => {
         setFiles(uploadedFiles);

         // If only OFX files, skip column mapping
         const hasCsv = uploadedFiles.some((f) => f.fileType === "csv");
         if (!hasCsv && uploadedFiles.length > 0) {
            goToStep("preview");
         } else if (hasCsv) {
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
         transactions: BatchParsedTransaction[],
         selected: Set<string>,
         dups: BatchDuplicateInfo[],
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
            return "Selecionar Arquivos";
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
            return `Arraste ou selecione até 10 arquivos CSV ou OFX${files.length > 0 ? ` (${files.length} selecionado${files.length > 1 ? "s" : ""})` : ""}`;
         case "column-mapping":
            return "Indique quais colunas correspondem a data, valor e descrição";
         case "preview":
            return "Revise e selecione as transações a importar";
         case "importing":
            return "Processando os arquivos e criando as transações...";
         default:
            return "";
      }
   };

   // Check if we have CSV files for mapping step
   const hasCsv = files.some((f) => f.fileType === "csv");

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
                     <UploadStep
                        initialFiles={files}
                        onFilesUploaded={handleFilesUploaded}
                     />
                  )}

                  {step === "column-mapping" &&
                     bankAccountId &&
                     files.length > 0 &&
                     hasCsv && (
                        <MappingStep
                           files={files}
                           initialColumnMapping={columnMapping}
                           initialCsvPreviewData={csvPreviewData}
                           onBack={handleBack}
                           onComplete={handleMappingComplete}
                        />
                     )}

                  {step === "preview" &&
                     bankAccountId &&
                     files.length > 0 &&
                     // For CSV, ensure column mapping and preview data are set
                     (!hasCsv || (columnMapping && csvPreviewData)) && (
                        <PreviewStep
                           bankAccountId={bankAccountId}
                           columnMapping={columnMapping}
                           csvPreviewData={csvPreviewData}
                           files={files}
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
