// Generator exports
export {
   createGenerator,
   generate,
   generateFromObjects,
   generateRow,
} from "./generator";

// Parser exports
export {
   parse,
   parseBuffer,
   parseBufferOrThrow,
   parseOrThrow,
   parseToArray,
} from "./parser";

// Schema exports
export {
   batchCsvFileInputSchema,
   batchCsvStreamEventSchema,
   batchParsedCsvFileSchema,
   csvDocumentSchema,
   DEFAULT_MAX_BUFFER_SIZE,
   generateOptionsSchema,
   parsedRowSchema,
   parseOptionsSchema,
   streamEventSchema,
   streamOptionsSchema,
} from "./schemas";

// Streaming exports
export {
   parseBatchStream,
   parseBatchStreamToArray,
   parseBufferStream,
   parseStream,
   parseStreamToArray,
} from "./stream";

// Type exports (all derived from Zod schemas, re-exported from types.ts)
export type {
   BatchCsvFileInput,
   BatchCsvStreamEvent,
   BatchParsedCsvFile,
   CSVDocument,
   GenerateOptions,
   ParsedRow,
   ParseOptions,
   ParseResult,
   StreamEvent,
   StreamOptions,
} from "./types";

// Utility exports
export {
   decodeBuffer,
   detectDelimiter,
   detectEncoding,
   detectLineEnding,
   escapeField,
   needsQuoting,
} from "./utils";
