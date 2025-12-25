import {
   createStateMachineContext,
   flush,
   processChar,
} from "./csv-state-machine";
import { parseOptionsSchema } from "./schemas";
import type {
   CSVDocument,
   ParsedRow,
   ParseOptions,
   ParseResult,
} from "./types";
import { createParsedRow, decodeBuffer, detectDelimiter } from "./utils";

/**
 * Parses raw CSV content into a 2D array of strings using a state machine.
 * Handles RFC 4180 edge cases including:
 * - Quoted fields with embedded delimiters
 * - Escaped quotes (doubled quotes)
 * - Newlines within quoted fields (both LF and CRLF)
 * - Mixed line endings
 *
 * @param input - The CSV string to parse
 * @param delimiter - The field delimiter to use
 * @returns A 2D array of field values
 */
function parseRawCSV(input: string, delimiter: string): string[][] {
   const rows: string[][] = [];
   const ctx = createStateMachineContext(delimiter);

   const onRowComplete = (row: string[]) => {
      // Only add non-empty rows (rows with content or more than one empty field)
      if (row.length > 0 || (row.length === 1 && row[0] !== "")) {
         rows.push([...row]);
      }
   };

   for (let i = 0; i < input.length; i++) {
      const char = input[i] as string;
      const nextChar = input[i + 1];
      const skip = processChar(ctx, char, nextChar, onRowComplete);
      i += skip;
   }

   // Handle final field/row
   flush(ctx, onRowComplete);

   return rows;
}

/**
 * Parses CSV content and returns a result object.
 *
 * @param content - The CSV string to parse
 * @param options - Parsing options
 * @returns A ParseResult containing either the parsed document or an error
 */
export function parse(
   content: string,
   options?: ParseOptions,
): ParseResult<CSVDocument> {
   try {
      const data = parseOrThrow(content, options);
      return { success: true, data };
   } catch (error) {
      return {
         success: false,
         error: error instanceof Error ? error : new Error(String(error)),
      };
   }
}

/**
 * Parses CSV content and throws on error.
 *
 * @param content - The CSV string to parse
 * @param options - Parsing options
 * @returns The parsed CSV document
 * @throws Error if parsing fails or options are invalid
 */
export function parseOrThrow(
   content: string,
   options?: ParseOptions,
): CSVDocument {
   // Validate options if provided
   if (options !== undefined) {
      parseOptionsSchema.parse(options);
   }

   const delimiter = options?.delimiter ?? detectDelimiter(content);
   const skipRows = options?.skipRows ?? 0;
   const hasHeaders = options?.hasHeaders ?? false;
   const trimFields = options?.trimFields ?? false;
   const customColumns = options?.columns;

   // Parse raw CSV
   const rawRows = parseRawCSV(content, delimiter);

   // Handle empty content
   if (rawRows.length === 0) {
      return {
         headers: hasHeaders ? [] : undefined,
         rows: [],
         delimiter,
         totalRows: 0,
      };
   }

   // Skip rows if requested
   const dataRows = rawRows.slice(skipRows);

   if (dataRows.length === 0) {
      return {
         headers: hasHeaders ? [] : undefined,
         rows: [],
         delimiter,
         totalRows: 0,
      };
   }

   // Extract headers
   let headers: string[] | undefined;
   let startIndex = 0;

   if (hasHeaders) {
      const headerRow = dataRows[0];
      if (headerRow) {
         headers = trimFields ? headerRow.map((h) => h.trim()) : headerRow;
         startIndex = 1;
      }
   } else if (customColumns) {
      headers = customColumns;
   }

   // Build parsed rows
   const parsedRows: ParsedRow[] = [];

   for (let i = startIndex; i < dataRows.length; i++) {
      const rawRow = dataRows[i];
      if (rawRow) {
         // Skip completely empty rows (single empty field)
         if (rawRow.length === 1 && rawRow[0] === "") {
            continue;
         }
         parsedRows.push(
            createParsedRow(rawRow, skipRows + i, headers, trimFields),
         );
      }
   }

   return {
      headers,
      rows: parsedRows,
      delimiter,
      totalRows: parsedRows.length,
   };
}

/**
 * Parses CSV from a buffer with automatic encoding detection.
 *
 * @param buffer - The buffer containing CSV data
 * @param options - Parsing options
 * @returns A ParseResult containing either the parsed document or an error
 */
export function parseBuffer(
   buffer: Uint8Array,
   options?: ParseOptions,
): ParseResult<CSVDocument> {
   try {
      const data = parseBufferOrThrow(buffer, options);
      return { success: true, data };
   } catch (error) {
      return {
         success: false,
         error: error instanceof Error ? error : new Error(String(error)),
      };
   }
}

/**
 * Parses CSV from a buffer with automatic encoding detection.
 * Throws on error.
 *
 * @param buffer - The buffer containing CSV data
 * @param options - Parsing options
 * @returns The parsed CSV document
 * @throws Error if parsing fails
 */
export function parseBufferOrThrow(
   buffer: Uint8Array,
   options?: ParseOptions,
): CSVDocument {
   const content = decodeBuffer(buffer);
   return parseOrThrow(content, options);
}

/**
 * Parses CSV content and returns raw 2D array without metadata.
 * Useful for simple use cases that don't need the full document structure.
 *
 * @param content - The CSV string to parse
 * @param delimiter - The delimiter to use (default: auto-detect)
 * @returns A 2D array of field values
 */
export function parseToArray(content: string, delimiter?: string): string[][] {
   const effectiveDelimiter = delimiter ?? detectDelimiter(content);
   return parseRawCSV(content, effectiveDelimiter);
}
