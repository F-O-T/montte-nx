/**
 * Parser state for the state machine CSV parser.
 * Handles RFC 4180 compliant parsing including multiline quoted fields.
 */
export type ParserState =
   | "FIELD_START"
   | "UNQUOTED_FIELD"
   | "QUOTED_FIELD"
   | "QUOTE_IN_QUOTED"
   | "FIELD_END";

/**
 * Internal context maintained during parsing.
 */
export interface ParserContext {
   state: ParserState;
   currentField: string;
   currentRow: string[];
   rows: string[][];
   delimiter: string;
   position: number;
}

/**
 * Options for parsing CSV content.
 */
export interface ParseOptions {
   /** Field delimiter (default: auto-detect, fallback ',') */
   delimiter?: string;
   /** Skip first N rows (default: 0) */
   skipRows?: number;
   /** Treat first row as headers (default: false) */
   hasHeaders?: boolean;
   /** Trim whitespace from fields (default: false) */
   trimFields?: boolean;
   /** Column names to use if hasHeaders is false */
   columns?: string[];
}

/**
 * A parsed row with metadata.
 */
export interface ParsedRow {
   /** 0-indexed row number in original file */
   rowIndex: number;
   /** Field values as array */
   fields: string[];
   /** If headers enabled, keyed object */
   record?: Record<string, string>;
}

/**
 * Complete parsed CSV document.
 */
export interface CSVDocument {
   /** Header row (if hasHeaders was true) */
   headers?: string[];
   /** Parsed rows */
   rows: ParsedRow[];
   /** Detected or specified delimiter */
   delimiter: string;
   /** Total row count (excluding headers if present) */
   totalRows: number;
}

/**
 * Result type for parse operations.
 */
export type ParseResult<T> =
   | { success: true; data: T }
   | { success: false; error: Error };

/**
 * Options for CSV generation.
 */
export interface GenerateOptions {
   /** Field delimiter (default: ',') */
   delimiter?: string;
   /** Line ending (default: '\n') */
   lineEnding?: "\n" | "\r\n";
   /** Include headers row (default: true if headers provided) */
   includeHeaders?: boolean;
   /** Always quote all fields (default: false, quotes only when needed) */
   alwaysQuote?: boolean;
}

/**
 * Options for streaming parser.
 */
export interface StreamOptions extends ParseOptions {
   /** Chunk size for processing (default: 64KB) */
   chunkSize?: number;
}

/**
 * Events emitted by the streaming parser.
 */
export type StreamEvent =
   | { type: "headers"; data: string[] }
   | { type: "row"; data: ParsedRow }
   | { type: "complete"; rowCount: number; delimiter: string };

// Batch streaming types
export interface BatchCsvFileInput {
   /** Filename for tracking */
   filename: string;
   /** Already decoded string content */
   content: string;
}

export type BatchCsvStreamEvent =
   | { type: "file_start"; fileIndex: number; filename: string }
   | { type: "headers"; fileIndex: number; data: string[] }
   | { type: "row"; fileIndex: number; data: ParsedRow }
   | {
        type: "file_complete";
        fileIndex: number;
        filename: string;
        rowCount: number;
        delimiter: string;
     }
   | { type: "file_error"; fileIndex: number; filename: string; error: string }
   | {
        type: "batch_complete";
        totalFiles: number;
        totalRows: number;
        errorCount: number;
     };

export interface BatchParsedCsvFile {
   fileIndex: number;
   filename: string;
   headers?: string[];
   rows: ParsedRow[];
   delimiter: string;
   totalRows: number;
   error?: string;
}
