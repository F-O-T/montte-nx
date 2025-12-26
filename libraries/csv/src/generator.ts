import { generateOptionsSchema } from "./schemas";
import type { GenerateOptions } from "./types";
import { escapeField } from "./utils";

/**
 * Default options for CSV generation.
 */
const DEFAULT_OPTIONS: Required<GenerateOptions> = {
   delimiter: ",",
   lineEnding: "\n",
   includeHeaders: true,
   alwaysQuote: false,
};

/**
 * Generates CSV content from a 2D array of strings.
 *
 * @param rows - The rows to convert to CSV
 * @param options - Generation options
 * @returns The generated CSV string
 * @throws Error if options are invalid
 */
export function generate(rows: string[][], options?: GenerateOptions): string {
   // Validate options if provided
   if (options !== undefined) {
      generateOptionsSchema.parse(options);
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };

   if (rows.length === 0) {
      return "";
   }

   const lines: string[] = [];

   for (const row of rows) {
      const escapedFields = row.map((field) =>
         escapeField(field, opts.delimiter, opts.alwaysQuote),
      );
      lines.push(escapedFields.join(opts.delimiter));
   }

   return lines.join(opts.lineEnding);
}

/**
 * Generates CSV content from an array of objects.
 * Uses the keys of the first object as headers.
 *
 * @param data - Array of objects to convert to CSV
 * @param options - Generation options
 * @returns The generated CSV string
 * @throws Error if options are invalid
 */
export function generateFromObjects<T extends Record<string, unknown>>(
   data: T[],
   options?: GenerateOptions & { headers?: string[] },
): string {
   // Validate base options if provided (headers is an extension, not validated)
   if (options !== undefined) {
      const { headers: _, ...baseOptions } = options;
      if (Object.keys(baseOptions).length > 0) {
         generateOptionsSchema.parse(baseOptions);
      }
   }

   if (data.length === 0) {
      return "";
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };

   // Get headers from options or first object keys
   const headers = opts.headers ?? Object.keys(data[0] as object);

   const rows: string[][] = [];

   // Add header row if requested
   if (opts.includeHeaders) {
      rows.push(headers);
   }

   // Add data rows
   for (const item of data) {
      const row: string[] = [];
      for (const header of headers) {
         const value = item[header];
         // Convert value to string
         if (value === null || value === undefined) {
            row.push("");
         } else if (typeof value === "string") {
            row.push(value);
         } else if (typeof value === "number" || typeof value === "boolean") {
            row.push(String(value));
         } else if (value instanceof Date) {
            row.push(value.toISOString());
         } else {
            // For objects/arrays, use JSON
            row.push(JSON.stringify(value));
         }
      }
      rows.push(row);
   }

   return generate(rows, { ...opts, includeHeaders: false });
}

/**
 * Generates a single CSV row from field values.
 *
 * @param fields - The field values
 * @param options - Generation options
 * @returns The generated CSV row string (without line ending)
 * @throws Error if options are invalid
 */
export function generateRow(
   fields: string[],
   options?: Omit<GenerateOptions, "lineEnding" | "includeHeaders">,
): string {
   // Validate options if provided
   if (options !== undefined) {
      generateOptionsSchema.partial().parse(options);
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };

   const escapedFields = fields.map((field) =>
      escapeField(field, opts.delimiter, opts.alwaysQuote),
   );

   return escapedFields.join(opts.delimiter);
}

/**
 * Creates a CSV generator that can be used to build CSV content incrementally.
 * Useful for streaming generation of large files.
 *
 * Note: The toStream() method captures a snapshot of rows at call time.
 * If the stream is created but not consumed, it holds references to the data.
 * Ensure streams are consumed or discarded to avoid memory retention.
 *
 * @param options - Generation options
 * @returns A generator object with methods to add rows
 * @throws Error if options are invalid
 */
export function createGenerator(options?: GenerateOptions): {
   addRow: (fields: string[]) => void;
   addObject: <T extends Record<string, unknown>>(
      obj: T,
      headers: string[],
   ) => void;
   toString: () => string;
   toStream: () => ReadableStream<string>;
} {
   // Validate options if provided
   if (options !== undefined) {
      generateOptionsSchema.parse(options);
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };
   const rows: string[] = [];

   return {
      addRow(fields: string[]) {
         rows.push(generateRow(fields, opts));
      },

      addObject<T extends Record<string, unknown>>(obj: T, headers: string[]) {
         const fields: string[] = [];
         for (const header of headers) {
            const value = obj[header];
            // Convert value to string - same logic as generateFromObjects
            if (value === null || value === undefined) {
               fields.push("");
            } else if (typeof value === "string") {
               fields.push(value);
            } else if (
               typeof value === "number" ||
               typeof value === "boolean"
            ) {
               fields.push(String(value));
            } else if (value instanceof Date) {
               fields.push(value.toISOString());
            } else if (Array.isArray(value) || typeof value === "object") {
               // For objects/arrays, use JSON
               fields.push(JSON.stringify(value));
            } else {
               fields.push(String(value));
            }
         }
         rows.push(generateRow(fields, opts));
      },

      toString() {
         return rows.join(opts.lineEnding);
      },

      toStream() {
         const rowsSnapshot = [...rows];
         let index = 0;

         return new ReadableStream<string>({
            pull(controller) {
               if (index >= rowsSnapshot.length) {
                  controller.close();
                  return;
               }

               const row = rowsSnapshot[index];
               const isLastRow = index === rowsSnapshot.length - 1;

               controller.enqueue(isLastRow ? row : row + opts.lineEnding);
               index++;
            },
         });
      },
   };
}
