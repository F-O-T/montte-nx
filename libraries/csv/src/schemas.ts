import { z } from "zod";

// =============================================================================
// Constants
// =============================================================================

/**
 * Default maximum buffer size (10MB) to prevent memory exhaustion attacks.
 */
export const DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024;

// =============================================================================
// Core Option Schemas
// =============================================================================

/**
 * Schema for parse options validation.
 */
export const parseOptionsSchema = z.object({
   /** Field delimiter (default: auto-detect, fallback ',') */
   delimiter: z.string().length(1).optional(),
   /** Skip first N rows (default: 0) */
   skipRows: z.number().int().min(0).optional(),
   /** Treat first row as headers (default: false) */
   hasHeaders: z.boolean().optional(),
   /** Trim whitespace from fields (default: false) */
   trimFields: z.boolean().optional(),
   /** Column names to use if hasHeaders is false */
   columns: z.array(z.string()).optional(),
});

/**
 * Schema for generate options validation.
 */
export const generateOptionsSchema = z.object({
   /** Field delimiter (default: ',') */
   delimiter: z.string().length(1).optional(),
   /** Line ending (default: '\n') */
   lineEnding: z.enum(["\n", "\r\n"]).optional(),
   /** Include headers row (default: true if headers provided) */
   includeHeaders: z.boolean().optional(),
   /** Always quote all fields (default: false, quotes only when needed) */
   alwaysQuote: z.boolean().optional(),
});

/**
 * Schema for stream options validation.
 */
export const streamOptionsSchema = parseOptionsSchema.extend({
   /** Chunk size for processing (default: 64KB) */
   chunkSize: z.number().int().positive().optional(),
   /**
    * Maximum buffer size in bytes. Prevents memory exhaustion from
    * malicious CSV files with very long quoted fields.
    * Default: 10MB
    */
   maxBufferSize: z.number().int().positive().optional(),
});

// =============================================================================
// Data Schemas
// =============================================================================

/**
 * Schema for a parsed row.
 */
export const parsedRowSchema = z.object({
   /** 0-indexed row number in original file */
   rowIndex: z.number().int().min(0),
   /** Field values as array */
   fields: z.array(z.string()),
   /** If headers enabled, keyed object */
   record: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for a complete CSV document.
 */
export const csvDocumentSchema = z.object({
   /** Header row (if hasHeaders was true) */
   headers: z.array(z.string()).optional(),
   /** Parsed rows */
   rows: z.array(parsedRowSchema),
   /** Detected or specified delimiter */
   delimiter: z.string().length(1),
   /** Total row count (excluding headers if present) */
   totalRows: z.number().int().min(0),
});

// =============================================================================
// Streaming Event Schemas
// =============================================================================

/**
 * Schema for streaming parser events.
 */
export const streamEventSchema = z.discriminatedUnion("type", [
   z.object({ type: z.literal("headers"), data: z.array(z.string()) }),
   z.object({ type: z.literal("row"), data: parsedRowSchema }),
   z.object({
      type: z.literal("complete"),
      rowCount: z.number().int().min(0),
      delimiter: z.string(),
   }),
]);

// =============================================================================
// Batch Processing Schemas
// =============================================================================

/**
 * Schema for batch CSV file input.
 */
export const batchCsvFileInputSchema = z.object({
   /** Filename for tracking */
   filename: z.string(),
   /** Already decoded string content */
   content: z.string(),
});

/**
 * Schema for batch streaming events.
 */
export const batchCsvStreamEventSchema = z.discriminatedUnion("type", [
   z.object({
      type: z.literal("file_start"),
      fileIndex: z.number().int().min(0),
      filename: z.string(),
   }),
   z.object({
      type: z.literal("headers"),
      fileIndex: z.number().int().min(0),
      data: z.array(z.string()),
   }),
   z.object({
      type: z.literal("row"),
      fileIndex: z.number().int().min(0),
      data: parsedRowSchema,
   }),
   z.object({
      type: z.literal("file_complete"),
      fileIndex: z.number().int().min(0),
      filename: z.string(),
      rowCount: z.number().int().min(0),
      delimiter: z.string(),
   }),
   z.object({
      type: z.literal("file_error"),
      fileIndex: z.number().int().min(0),
      filename: z.string(),
      error: z.string(),
   }),
   z.object({
      type: z.literal("batch_complete"),
      totalFiles: z.number().int().min(0),
      totalRows: z.number().int().min(0),
      errorCount: z.number().int().min(0),
   }),
]);

/**
 * Schema for batch parsed CSV file result.
 */
export const batchParsedCsvFileSchema = z.object({
   fileIndex: z.number().int().min(0),
   filename: z.string(),
   headers: z.array(z.string()).optional(),
   rows: z.array(parsedRowSchema),
   delimiter: z.string(),
   totalRows: z.number().int().min(0),
   error: z.string().optional(),
});

// =============================================================================
// Inferred Types - Use these instead of hand-defining interfaces
// =============================================================================

/** Options for parsing CSV content */
export type ParseOptions = z.infer<typeof parseOptionsSchema>;

/** Options for generating CSV content */
export type GenerateOptions = z.infer<typeof generateOptionsSchema>;

/** Options for streaming CSV parser */
export type StreamOptions = z.infer<typeof streamOptionsSchema>;

/** A parsed row with metadata */
export type ParsedRow = z.infer<typeof parsedRowSchema>;

/** Complete parsed CSV document */
export type CSVDocument = z.infer<typeof csvDocumentSchema>;

/** Events emitted by the streaming parser */
export type StreamEvent = z.infer<typeof streamEventSchema>;

/** Input for batch CSV processing */
export type BatchCsvFileInput = z.infer<typeof batchCsvFileInputSchema>;

/** Events emitted by the batch streaming parser */
export type BatchCsvStreamEvent = z.infer<typeof batchCsvStreamEventSchema>;

/** Result of batch CSV parsing */
export type BatchParsedCsvFile = z.infer<typeof batchParsedCsvFileSchema>;

// =============================================================================
// Legacy type aliases for backwards compatibility
// =============================================================================

/** @deprecated Use ParseOptions instead */
export type ParseOptionsSchema = ParseOptions;

/** @deprecated Use ParsedRow instead */
export type ParsedRowSchema = ParsedRow;

/** @deprecated Use CSVDocument instead */
export type CSVDocumentSchema = CSVDocument;

/** @deprecated Use GenerateOptions instead */
export type GenerateOptionsSchema = GenerateOptions;

/** @deprecated Use StreamOptions instead */
export type StreamOptionsSchema = StreamOptions;
