import type { ParsedRow } from "./types";

/**
 * Common delimiters to check during auto-detection.
 */
const COMMON_DELIMITERS = [",", ";", "\t", "|"] as const;

/**
 * Detects the most likely delimiter used in CSV content.
 * Analyzes the first few lines and counts delimiter occurrences.
 *
 * @param content - The CSV content to analyze
 * @returns The detected delimiter (defaults to ',')
 */
export function detectDelimiter(content: string): string {
   if (!content || content.length === 0) {
      return ",";
   }

   // Get first few lines for analysis (avoid parsing entire file)
   const sampleLines: string[] = [];
   let lineStart = 0;
   let inQuotes = false;

   for (let i = 0; i < content.length && sampleLines.length < 10; i++) {
      const char = content[i];

      if (char === '"') {
         inQuotes = !inQuotes;
      } else if (!inQuotes && (char === "\n" || char === "\r")) {
         if (i > lineStart) {
            sampleLines.push(content.slice(lineStart, i));
         }
         // Skip \r\n as single line ending
         if (char === "\r" && content[i + 1] === "\n") {
            i++;
         }
         lineStart = i + 1;
      }
   }

   // Add remaining content as last line if needed
   if (lineStart < content.length && sampleLines.length < 10) {
      sampleLines.push(content.slice(lineStart));
   }

   if (sampleLines.length === 0) {
      return ",";
   }

   // Count occurrences of each delimiter in each line
   const delimiterScores: Record<string, number> = {};

   for (const delimiter of COMMON_DELIMITERS) {
      const counts: number[] = [];

      for (const line of sampleLines) {
         let count = 0;
         let inQuoted = false;

         for (const char of line) {
            if (char === '"') {
               inQuoted = !inQuoted;
            } else if (!inQuoted && char === delimiter) {
               count++;
            }
         }

         counts.push(count);
      }

      // Check for consistency (all lines should have similar count)
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);

      if (minCount > 0 && maxCount - minCount <= 1) {
         // Consistent delimiter usage, score by count
         delimiterScores[delimiter] = minCount * sampleLines.length;
      } else if (minCount > 0) {
         // Some inconsistency, lower score
         delimiterScores[delimiter] = minCount;
      }
   }

   // Return delimiter with highest score, default to comma
   let bestDelimiter = ",";
   let bestScore = 0;

   for (const [delimiter, score] of Object.entries(delimiterScores)) {
      if (score > bestScore) {
         bestScore = score;
         bestDelimiter = delimiter;
      }
   }

   return bestDelimiter;
}

/**
 * Detects the line ending style used in the content.
 *
 * @param content - The content to analyze
 * @returns The detected line ending ('\n' or '\r\n')
 */
export function detectLineEnding(content: string): "\n" | "\r\n" {
   const crlfIndex = content.indexOf("\r\n");
   const lfIndex = content.indexOf("\n");

   // If CRLF is found and appears before or at same position as LF
   if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex <= lfIndex)) {
      return "\r\n";
   }

   return "\n";
}

/**
 * Detects if the buffer starts with a UTF-8 BOM and returns the encoding.
 *
 * @param buffer - The buffer to check
 * @returns The encoding name and byte offset to skip
 */
export function detectEncoding(buffer: Uint8Array): {
   encoding: "utf-8" | "utf-16le" | "utf-16be";
   bomLength: number;
} {
   // UTF-8 BOM: EF BB BF
   if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
   ) {
      return { encoding: "utf-8", bomLength: 3 };
   }

   // UTF-16 LE BOM: FF FE
   if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return { encoding: "utf-16le", bomLength: 2 };
   }

   // UTF-16 BE BOM: FE FF
   if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return { encoding: "utf-16be", bomLength: 2 };
   }

   // Default to UTF-8
   return { encoding: "utf-8", bomLength: 0 };
}

/**
 * Decodes a buffer to string with the appropriate encoding.
 *
 * @param buffer - The buffer to decode
 * @returns The decoded string
 */
export function decodeBuffer(buffer: Uint8Array): string {
   const { encoding, bomLength } = detectEncoding(buffer);
   const data = bomLength > 0 ? buffer.slice(bomLength) : buffer;
   // TextDecoder accepts utf-8, utf-16le, and utf-16be at runtime
   // TypeScript's type definition is more restrictive, so we use a type assertion
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const decoder = new TextDecoder(encoding as any);
   return decoder.decode(data);
}

/**
 * Checks if a character needs to be quoted in CSV output.
 *
 * @param value - The string value to check
 * @param delimiter - The delimiter being used
 * @returns True if the value needs quoting
 */
export function needsQuoting(value: string, delimiter: string): boolean {
   return (
      value.includes(delimiter) ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
   );
}

/**
 * Escapes a value for CSV output by quoting and escaping internal quotes.
 *
 * @param value - The value to escape
 * @param delimiter - The delimiter being used
 * @param alwaysQuote - Whether to always quote values
 * @returns The escaped value
 */
export function escapeField(
   value: string,
   delimiter: string,
   alwaysQuote = false,
): string {
   if (alwaysQuote || needsQuoting(value, delimiter)) {
      // Escape quotes by doubling them and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
   }
   return value;
}

/**
 * Dangerous property names that could cause prototype pollution.
 */
const DANGEROUS_PROPS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Creates a ParsedRow from raw field values.
 *
 * @param fields - The raw field values from the CSV row
 * @param rowIndex - The 0-indexed row number in the original file
 * @param headers - Optional header names for creating keyed record
 * @param trimFields - Whether to trim whitespace from field values
 * @returns A ParsedRow with fields array and optional record
 */
export function createParsedRow(
   fields: string[],
   rowIndex: number,
   headers: string[] | undefined,
   trimFields: boolean,
): ParsedRow {
   const processedFields = trimFields ? fields.map((f) => f.trim()) : fields;

   const row: ParsedRow = {
      rowIndex,
      fields: processedFields,
   };

   if (headers) {
      // Use Object.create(null) to prevent prototype pollution attacks
      // from malicious CSV headers like "__proto__" or "constructor"
      row.record = Object.create(null) as Record<string, string>;
      for (let i = 0; i < headers.length; i++) {
         const header = headers[i];
         // Skip undefined headers and dangerous property names
         if (header !== undefined && !DANGEROUS_PROPS.has(header)) {
            row.record[header] = processedFields[i] ?? "";
         }
      }
   }

   return row;
}
