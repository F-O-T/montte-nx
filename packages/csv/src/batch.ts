import { parseBatchStream, type BatchCsvFileInput } from "@f-o-t/csv";
import { normalizeText } from "@packages/utils/text";

import { parseAmount, parseDate } from "./parser";
import type {
   CsvColumnMapping,
   CsvParseError,
   CsvParseOptions,
   ParsedCsvRow,
} from "./types";

// Batch progress event types
export type BatchCsvProgressEvent =
   | { type: "file_start"; fileIndex: number; filename: string }
   | { type: "headers"; fileIndex: number; headers: string[] }
   | { type: "row"; fileIndex: number; row: BatchParsedCsvRow }
   | {
        type: "file_complete";
        fileIndex: number;
        filename: string;
        rowCount: number;
        errors: CsvParseError[];
     }
   | { type: "file_error"; fileIndex: number; filename: string; error: string }
   | {
        type: "batch_complete";
        totalFiles: number;
        totalRows: number;
        totalErrors: number;
     };

// Extended parsed row with file tracking
export interface BatchParsedCsvRow extends ParsedCsvRow {
   fileIndex: number;
   filename: string;
}

export interface BatchCsvParseOptions extends CsvParseOptions {
   onProgress?: (event: BatchCsvProgressEvent) => void;
   /** Shared column mapping applied to all files */
   columnMapping: CsvColumnMapping;
}

export interface BatchCsvParseResult {
   rows: BatchParsedCsvRow[];
   errors: CsvParseError[];
   fileResults: BatchCsvFileResult[];
}

export interface BatchCsvFileResult {
   fileIndex: number;
   filename: string;
   rowCount: number;
   errors: CsvParseError[];
   headers?: string[];
}

/**
 * Processes a single row from the CSV and converts it to a ParsedCsvRow.
 */
function processRow(
   rowIndex: number,
   fields: string[],
   mapping: CsvColumnMapping,
   dateFormat: string,
   amountFormat: "decimal-comma" | "decimal-dot",
   errors: CsvParseError[],
   fileIndex: number,
   filename: string,
): BatchParsedCsvRow | null {
   const dateValue = fields[mapping.date] ?? "";
   const amountValue = fields[mapping.amount] ?? "";
   const descriptionValue = fields[mapping.description] ?? "";

   const date = parseDate(dateValue, dateFormat);
   if (!date) {
      errors.push({
         row: rowIndex,
         column: mapping.date,
         message: `Invalid date: "${dateValue}"`,
      });
      return null;
   }

   const amount = parseAmount(amountValue, amountFormat);
   if (amount === 0 && amountValue?.trim() !== "0") {
      errors.push({
         row: rowIndex,
         column: mapping.amount,
         message: `Invalid amount: "${amountValue}"`,
      });
      return null;
   }

   const description = normalizeText(descriptionValue || "Sem descrição");

   let type: "income" | "expense" = amount >= 0 ? "income" : "expense";

   if (mapping.type !== undefined) {
      const typeValue = fields[mapping.type]?.toLowerCase();
      if (
         typeValue?.includes("credit") ||
         typeValue?.includes("credito") ||
         typeValue?.includes("crédito") ||
         typeValue?.includes("entrada")
      ) {
         type = "income";
      } else if (
         typeValue?.includes("debit") ||
         typeValue?.includes("debito") ||
         typeValue?.includes("débito") ||
         typeValue?.includes("saida") ||
         typeValue?.includes("saída")
      ) {
         type = "expense";
      }
   }

   return {
      rowIndex,
      date,
      amount: Math.abs(amount),
      description,
      type,
      raw: fields,
      fileIndex,
      filename,
   };
}

/**
 * High-level batch CSV parser with shared column mapping.
 * Streams files for memory efficiency.
 *
 * @param files - Array of files with filename and content
 * @param options - Parse options with column mapping and progress callback
 * @returns Parsed rows and errors from all files
 */
export async function parseCsvBatch(
   files: BatchCsvFileInput[],
   options: BatchCsvParseOptions,
): Promise<BatchCsvParseResult> {
   const rows: BatchParsedCsvRow[] = [];
   const allErrors: CsvParseError[] = [];
   const fileResults: BatchCsvFileResult[] = files.map((file, index) => ({
      fileIndex: index,
      filename: file.filename,
      rowCount: 0,
      errors: [],
   }));

   const dateFormat = options.dateFormat ?? "DD/MM/YYYY";
   const amountFormat = options.amountFormat ?? "decimal-comma";
   let totalErrors = 0;

   // Track row counts per file for reporting
   const fileRowCounts: number[] = files.map(() => 0);
   const fileErrors: CsvParseError[][] = files.map(() => []);
   const fileHeaders: (string[] | undefined)[] = files.map(() => undefined);

   for await (const event of parseBatchStream(files, {
      delimiter: options.delimiter,
      hasHeaders: true,
      trimFields: true,
   })) {
      switch (event.type) {
         case "file_start":
            options.onProgress?.({
               type: "file_start",
               fileIndex: event.fileIndex,
               filename: event.filename,
            });
            break;

         case "headers": {
            fileHeaders[event.fileIndex] = event.data;
            const result = fileResults[event.fileIndex];
            if (result) result.headers = event.data;
            options.onProgress?.({
               type: "headers",
               fileIndex: event.fileIndex,
               headers: event.data,
            });
            break;
         }

         case "row": {
            const file = files[event.fileIndex];
            if (!file) break;

            const fileErrorList = fileErrors[event.fileIndex] ?? [];
            const parsed = processRow(
               event.data.rowIndex,
               event.data.fields,
               options.columnMapping,
               dateFormat,
               amountFormat,
               fileErrorList,
               event.fileIndex,
               file.filename,
            );

            if (parsed) {
               rows.push(parsed);
               fileRowCounts[event.fileIndex] =
                  (fileRowCounts[event.fileIndex] ?? 0) + 1;
               options.onProgress?.({
                  type: "row",
                  fileIndex: event.fileIndex,
                  row: parsed,
               });
            }
            break;
         }

         case "file_complete": {
            const errors = fileErrors[event.fileIndex] ?? [];
            const result = fileResults[event.fileIndex];
            if (result) {
               result.rowCount = fileRowCounts[event.fileIndex] ?? 0;
               result.errors = errors;
            }
            allErrors.push(...errors);
            totalErrors += errors.length;
            options.onProgress?.({
               type: "file_complete",
               fileIndex: event.fileIndex,
               filename: event.filename,
               rowCount: fileRowCounts[event.fileIndex] ?? 0,
               errors,
            });
            break;
         }

         case "file_error":
            options.onProgress?.({
               type: "file_error",
               fileIndex: event.fileIndex,
               filename: event.filename,
               error: event.error,
            });
            break;

         case "batch_complete":
            options.onProgress?.({
               type: "batch_complete",
               totalFiles: event.totalFiles,
               totalRows: rows.length,
               totalErrors,
            });
            break;
      }
   }

   return {
      rows,
      errors: allErrors,
      fileResults,
   };
}

// Re-export types for convenience
export type { BatchCsvFileInput, CsvColumnMapping };
