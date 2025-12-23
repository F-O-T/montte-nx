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
 * Transaction type keyword mapping for income and expense detection.
 */
const TYPE_KEYWORDS = {
   income: ["credit", "credito", "crédito", "entrada"],
   expense: ["debit", "debito", "débito", "saida", "saída"],
} as const;

/**
 * Infers transaction type from a type column value by checking against known keywords.
 * @param typeValue - Raw type column value
 * @returns "income" or "expense" if matched, null otherwise
 */
function inferType(typeValue: string | undefined): "income" | "expense" | null {
   if (!typeValue) return null;

   const normalized = typeValue.toLowerCase();

   if (TYPE_KEYWORDS.income.some((keyword) => normalized.includes(keyword))) {
      return "income";
   }

   if (TYPE_KEYWORDS.expense.some((keyword) => normalized.includes(keyword))) {
      return "expense";
   }

   return null;
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
   // Bounds checks for required columns
   if (mapping.date < 0 || mapping.date >= fields.length) {
      errors.push({
         row: rowIndex,
         column: mapping.date,
         message: `Missing column at index ${mapping.date} for date`,
      });
      return null;
   }

   if (mapping.amount < 0 || mapping.amount >= fields.length) {
      errors.push({
         row: rowIndex,
         column: mapping.amount,
         message: `Missing column at index ${mapping.amount} for amount`,
      });
      return null;
   }

   if (mapping.description < 0 || mapping.description >= fields.length) {
      errors.push({
         row: rowIndex,
         column: mapping.description,
         message: `Missing column at index ${mapping.description} for description`,
      });
      return null;
   }

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
   if (!amount && amountValue?.trim() !== "0") {
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
      // Bounds check for optional type column
      if (mapping.type < 0 || mapping.type >= fields.length) {
         errors.push({
            row: rowIndex,
            column: mapping.type,
            message: `Missing column at index ${mapping.type} for type`,
         });
         return null;
      }

      const typeValue = fields[mapping.type];
      const inferredType = inferType(typeValue);
      if (inferredType) {
         type = inferredType;
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

            const result = fileResults[event.fileIndex];
            if (!result) break;

            const parsed = processRow(
               event.data.rowIndex,
               event.data.fields,
               options.columnMapping,
               dateFormat,
               amountFormat,
               result.errors,
               event.fileIndex,
               file.filename,
            );

            if (parsed) {
               rows.push(parsed);
               result.rowCount++;
               options.onProgress?.({
                  type: "row",
                  fileIndex: event.fileIndex,
                  row: parsed,
               });
            }
            break;
         }

         case "file_complete": {
            const result = fileResults[event.fileIndex];
            if (result) {
               allErrors.push(...result.errors);
               totalErrors += result.errors.length;
            }
            options.onProgress?.({
               type: "file_complete",
               fileIndex: event.fileIndex,
               filename: event.filename,
               rowCount: result?.rowCount ?? 0,
               errors: result?.errors ?? [],
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
