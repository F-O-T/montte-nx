export type ExportStep = "select-account" | "options" | "exporting";

export type ExportFormat = "ofx" | "csv" | "pdf";

export type TransactionTypeFilter = "all" | "income" | "expense" | "transfer";

export type ExportOptions = {
   format: ExportFormat;
   startDate: Date | null;
   endDate: Date | null;
   typeFilter: TransactionTypeFilter;
};

export const EXPORT_FORMATS: {
   id: ExportFormat;
   name: string;
   description: string;
}[] = [
   {
      id: "ofx",
      name: "OFX",
      description:
         "Open Financial Exchange - compatível com softwares financeiros",
   },
   {
      id: "csv",
      name: "CSV",
      description: "Planilha - compatível com Excel e Google Sheets",
   },
   {
      id: "pdf",
      name: "PDF",
      description: "Documento - ideal para impressão e arquivamento",
   },
];

/**
 * Gets the wizard steps for export flow
 */
export function getExportSteps(): ExportStep[] {
   return ["select-account", "options", "exporting"];
}
