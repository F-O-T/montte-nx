import { z } from "zod";

/**
 * Schema for parse options validation.
 */
export const parseOptionsSchema = z.object({
   delimiter: z.string().length(1).optional(),
   skipRows: z.number().int().min(0).optional(),
   hasHeaders: z.boolean().optional(),
   trimFields: z.boolean().optional(),
   columns: z.array(z.string()).optional(),
});

/**
 * Schema for a parsed row.
 */
export const parsedRowSchema = z.object({
   rowIndex: z.number().int().min(0),
   fields: z.array(z.string()),
   record: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for a complete CSV document.
 */
export const csvDocumentSchema = z.object({
   headers: z.array(z.string()).optional(),
   rows: z.array(parsedRowSchema),
   delimiter: z.string().length(1),
   totalRows: z.number().int().min(0),
});

/**
 * Schema for generate options validation.
 */
export const generateOptionsSchema = z.object({
   delimiter: z.string().length(1).optional(),
   lineEnding: z.enum(["\n", "\r\n"]).optional(),
   includeHeaders: z.boolean().optional(),
   alwaysQuote: z.boolean().optional(),
});

/**
 * Schema for stream options validation.
 */
export const streamOptionsSchema = parseOptionsSchema.extend({
   chunkSize: z.number().int().positive().optional(),
});

export type ParseOptionsSchema = z.infer<typeof parseOptionsSchema>;
export type ParsedRowSchema = z.infer<typeof parsedRowSchema>;
export type CSVDocumentSchema = z.infer<typeof csvDocumentSchema>;
export type GenerateOptionsSchema = z.infer<typeof generateOptionsSchema>;
export type StreamOptionsSchema = z.infer<typeof streamOptionsSchema>;
