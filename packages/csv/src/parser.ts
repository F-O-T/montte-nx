import { AppError } from "@packages/utils/errors";
import { normalizeText } from "@packages/utils/text";
import {
   detectBankFormat,
   detectDelimiter,
   suggestColumnMapping,
} from "./bank-formats";
import type {
   CsvParseError,
   CsvParseOptions,
   CsvParseResult,
   ParsedCsvRow,
} from "./types";

function parseCsvLine(line: string, delimiter: string): string[] {
   const result: string[] = [];
   let current = "";
   let inQuotes = false;

   for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
         if (inQuotes && nextChar === '"') {
            current += '"';
            i++;
         } else {
            inQuotes = !inQuotes;
         }
      } else if (char === delimiter && !inQuotes) {
         result.push(current.trim());
         current = "";
      } else {
         current += char;
      }
   }

   result.push(current.trim());
   return result;
}

export function parseAmount(
   value: string,
   format: "decimal-comma" | "decimal-dot",
): number {
   if (!value || value.trim() === "") {
      return 0;
   }

   let normalized = value.trim();

   normalized = normalized.replace(/[R$\s]/g, "");

   if (format === "decimal-comma") {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
   } else {
      normalized = normalized.replace(/,/g, "");
   }

   const parsed = Number.parseFloat(normalized);

   if (Number.isNaN(parsed)) {
      return 0;
   }

   return parsed;
}

export function parseDate(value: string, format: string): Date | null {
   if (!value || value.trim() === "") {
      return null;
   }

   // Strip time suffix (e.g., "às 17:16:03" from Nubank format)
   let trimmed = value
      .trim()
      .replace(/\s+às\s+\d{1,2}:\d{2}(:\d{2})?/i, "")
      .trim();
   // Also strip generic time patterns
   trimmed = trimmed.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, "").trim();

   if (format === "DD/MM/YYYY" || format === "dd/mm/yyyy") {
      // Try 4-digit year first
      const match4 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match4?.[1] && match4[2] && match4[3]) {
         const day = Number.parseInt(match4[1], 10);
         const month = Number.parseInt(match4[2], 10) - 1;
         const year = Number.parseInt(match4[3], 10);
         const date = new Date(year, month, day);
         if (!Number.isNaN(date.getTime())) {
            return date;
         }
      }

      // Try 2-digit year (DD/MM/YY) - assume 2000s
      const match2 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
      if (match2?.[1] && match2[2] && match2[3]) {
         const day = Number.parseInt(match2[1], 10);
         const month = Number.parseInt(match2[2], 10) - 1;
         let year = Number.parseInt(match2[3], 10);
         // Convert 2-digit year to 4-digit (00-99 -> 2000-2099)
         year = year + 2000;
         const date = new Date(year, month, day);
         if (!Number.isNaN(date.getTime())) {
            return date;
         }
      }
   }

   if (format === "YYYY-MM-DD" || format === "yyyy-mm-dd") {
      const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match?.[1] && match[2] && match[3]) {
         const year = Number.parseInt(match[1], 10);
         const month = Number.parseInt(match[2], 10) - 1;
         const day = Number.parseInt(match[3], 10);
         const date = new Date(year, month, day);
         if (!Number.isNaN(date.getTime())) {
            return date;
         }
      }
   }

   if (format === "MM/DD/YYYY" || format === "mm/dd/yyyy") {
      const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match?.[1] && match[2] && match[3]) {
         const month = Number.parseInt(match[1], 10) - 1;
         const day = Number.parseInt(match[2], 10);
         const year = Number.parseInt(match[3], 10);
         const date = new Date(year, month, day);
         if (!Number.isNaN(date.getTime())) {
            return date;
         }
      }
   }

   const genericDate = new Date(trimmed);
   if (!Number.isNaN(genericDate.getTime())) {
      return genericDate;
   }

   return null;
}

export function parseCsvContent(
   content: string,
   options?: CsvParseOptions,
): CsvParseResult {
   const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

   if (lines.length === 0) {
      throw AppError.validation("CSV file is empty");
   }

   const delimiter = options?.delimiter ?? detectDelimiter(content);
   const skipRows = options?.skipRows ?? 1;

   const firstLine = lines[0] ?? "";
   const headers = parseCsvLine(firstLine, delimiter);

   const detectedFormat = detectBankFormat(headers);

   let columnMapping = options?.columnMapping;
   if (!columnMapping) {
      if (detectedFormat) {
         columnMapping = detectedFormat.columnMapping;
      } else {
         const suggested = suggestColumnMapping(headers);
         if (
            suggested.date !== null &&
            suggested.amount !== null &&
            suggested.description !== null
         ) {
            columnMapping = {
               date: suggested.date,
               amount: suggested.amount,
               description: suggested.description,
            };
         }
      }
   }

   const dateFormat =
      options?.dateFormat ?? detectedFormat?.dateFormat ?? "DD/MM/YYYY";
   const amountFormat =
      options?.amountFormat ?? detectedFormat?.amountFormat ?? "decimal-comma";

   const rows: ParsedCsvRow[] = [];
   const errors: CsvParseError[] = [];

   const dataLines = lines.slice(skipRows);

   for (let i = 0; i < dataLines.length; i++) {
      const lineIndex = i + skipRows;
      const line = dataLines[i] ?? "";

      if (!line.trim()) {
         continue;
      }

      const values = parseCsvLine(line, delimiter);

      if (!columnMapping) {
         errors.push({
            row: lineIndex,
            message: "Column mapping not defined",
         });
         continue;
      }

      const dateValue = values[columnMapping.date] ?? "";
      const amountValue = values[columnMapping.amount] ?? "";
      const descriptionValue = values[columnMapping.description] ?? "";

      const date = parseDate(dateValue, dateFormat);
      if (!date) {
         errors.push({
            row: lineIndex,
            column: columnMapping.date,
            message: `Invalid date: "${dateValue}"`,
         });
         continue;
      }

      const amount = parseAmount(amountValue, amountFormat);
      if (amount === 0 && amountValue?.trim() !== "0") {
         errors.push({
            row: lineIndex,
            column: columnMapping.amount,
            message: `Invalid amount: "${amountValue}"`,
         });
         continue;
      }

      const description = normalizeText(descriptionValue || "Sem descrição");

      let type: "income" | "expense" = amount >= 0 ? "income" : "expense";

      if (columnMapping.type !== undefined) {
         const typeValue = values[columnMapping.type]?.toLowerCase();
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

      if (options?.selectedRows && !options.selectedRows.includes(lineIndex)) {
         continue;
      }

      rows.push({
         rowIndex: lineIndex,
         date,
         amount: Math.abs(amount),
         description,
         type,
         raw: values,
      });
   }

   return {
      headers,
      rows,
      detectedFormat,
      errors,
      totalRows: dataLines.length,
   };
}

export function previewCsv(
   content: string,
   options?: { delimiter?: string; maxRows?: number },
): {
   headers: string[];
   sampleRows: string[][];
   detectedFormat: { id: string; name: string } | null;
   suggestedMapping: {
      date: number | null;
      amount: number | null;
      description: number | null;
   };
   totalRows: number;
   delimiter: string;
} {
   const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

   if (lines.length === 0) {
      throw AppError.validation("CSV file is empty");
   }

   const delimiter = options?.delimiter ?? detectDelimiter(content);
   const previewFirstLine = lines[0] ?? "";
   const headers = parseCsvLine(previewFirstLine, delimiter);
   const detectedFormat = detectBankFormat(headers);
   const suggestedMapping = suggestColumnMapping(headers);

   const maxRows = options?.maxRows ?? 5;
   const sampleRows: string[][] = [];

   for (let i = 1; i < lines.length && sampleRows.length < maxRows; i++) {
      const currentLine = lines[i];
      if (currentLine?.trim()) {
         sampleRows.push(parseCsvLine(currentLine, delimiter));
      }
   }

   return {
      headers,
      sampleRows,
      detectedFormat: detectedFormat
         ? { id: detectedFormat.id, name: detectedFormat.name }
         : null,
      suggestedMapping,
      totalRows: lines.length - 1,
      delimiter,
   };
}
