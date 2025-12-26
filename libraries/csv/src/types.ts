/**
 * CSV Library Types
 *
 * Most types are derived from Zod schemas in schemas.ts.
 * This file contains only types that cannot be expressed as Zod schemas.
 */

// Re-export all types from schemas (these are Zod-inferred)
export type {
   BatchCsvFileInput,
   BatchCsvStreamEvent,
   BatchParsedCsvFile,
   CSVDocument,
   GenerateOptions,
   ParsedRow,
   ParseOptions,
   StreamEvent,
   StreamOptions,
} from "./schemas";

/**
 * Parser state for the state machine CSV parser.
 * Handles RFC 4180 compliant parsing including multiline quoted fields.
 *
 * @internal Used only by csv-state-machine.ts
 */
export type ParserState =
   | "FIELD_START"
   | "UNQUOTED_FIELD"
   | "QUOTED_FIELD"
   | "QUOTE_IN_QUOTED"
   | "FIELD_END";

/**
 * Result type for parse operations that may fail.
 * This is a generic type that cannot be expressed as a Zod schema.
 */
export type ParseResult<T> =
   | { success: true; data: T }
   | { success: false; error: Error };
