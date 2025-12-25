import {
   createStateMachineContext,
   hasPendingData,
   processChar,
   type StateMachineContext,
} from "./csv-state-machine";
import { DEFAULT_MAX_BUFFER_SIZE, streamOptionsSchema } from "./schemas";
import type {
   BatchCsvFileInput,
   BatchCsvStreamEvent,
   BatchParsedCsvFile,
   CSVDocument,
   ParsedRow,
   StreamEvent,
   StreamOptions,
} from "./types";
import { createParsedRow, decodeBuffer, detectDelimiter } from "./utils";

/**
 * Internal streaming parser state.
 */
interface StreamingParserState {
   ctx: StateMachineContext;
   buffer: string;
   delimiterDetected: boolean;
   headers: string[] | undefined;
   headersEmitted: boolean;
   rowIndex: number;
   hasHeaders: boolean;
   trimFields: boolean;
   skipRows: number;
   skippedRows: number;
   maxBufferSize: number;
}

/**
 * Processes a chunk of CSV data and yields complete rows.
 * Maintains state between chunks to handle rows split across chunks.
 */
function* processChunk(
   chunk: string,
   parserState: StreamingParserState,
): Generator<StreamEvent> {
   parserState.buffer += chunk;

   // Check buffer size to prevent memory exhaustion attacks
   if (parserState.buffer.length > parserState.maxBufferSize) {
      throw new Error(
         `Buffer size exceeded maximum of ${parserState.maxBufferSize} bytes. ` +
            "This may indicate a malformed CSV with an unclosed quoted field. " +
            "Increase maxBufferSize option if processing legitimate large fields.",
      );
   }

   // Detect delimiter from first chunk if not already done
   if (!parserState.delimiterDetected && parserState.buffer.length > 0) {
      parserState.ctx.delimiter = detectDelimiter(parserState.buffer);
      parserState.delimiterDetected = true;
   }

   const input = parserState.buffer;
   let processedUpTo = 0;

   // Collect events to yield after processing
   const events: StreamEvent[] = [];

   const onRowComplete = (row: string[]) => {
      // Copy the row since the state machine reuses the array
      const completedRow = [...row];
      const rowEvents = emitRowSync(parserState, completedRow);
      events.push(...rowEvents);
   };

   for (let i = 0; i < input.length; i++) {
      const char = input[i] as string;
      const nextChar = input[i + 1];

      const skip = processChar(parserState.ctx, char, nextChar, onRowComplete);

      // Track processed position when a row is completed
      // A row was completed if we transitioned back to FIELD_START from a newline
      if (
         parserState.ctx.state === "FIELD_START" &&
         (char === "\n" || (char === "\r" && nextChar === "\n"))
      ) {
         if (char === "\r" && nextChar === "\n") {
            processedUpTo = i + 2;
         } else {
            processedUpTo = i + 1;
         }
      }

      i += skip;
   }

   // Yield collected events
   for (const event of events) {
      yield event;
   }

   // Keep unprocessed data in buffer for next chunk
   parserState.buffer = input.slice(processedUpTo);
}

/**
 * Emits a row event synchronously, handling headers and skip logic.
 * Returns an array of events to be yielded.
 */
function emitRowSync(
   parserState: StreamingParserState,
   completedRow: string[],
): StreamEvent[] {
   const events: StreamEvent[] = [];

   // Skip initial rows if requested
   if (parserState.skippedRows < parserState.skipRows) {
      parserState.skippedRows++;
      return events;
   }

   // Handle headers
   if (parserState.hasHeaders && !parserState.headersEmitted) {
      parserState.headers = parserState.trimFields
         ? completedRow.map((h) => h.trim())
         : completedRow;
      parserState.headersEmitted = true;
      events.push({ type: "headers", data: parserState.headers });
      return events;
   }

   // Skip empty rows
   if (completedRow.length === 1 && completedRow[0] === "") {
      return events;
   }

   // Emit data row
   const row = createParsedRow(
      completedRow,
      parserState.rowIndex,
      parserState.headers,
      parserState.trimFields,
   );
   parserState.rowIndex++;
   events.push({ type: "row", data: row });

   return events;
}

/**
 * Parses CSV content from a stream, yielding events for headers and each row.
 *
 * @param input - A ReadableStream of Uint8Array or AsyncIterable of strings
 * @param options - Parsing options
 * @yields StreamEvent for headers and each row
 */
export async function* parseStream(
   input: ReadableStream<Uint8Array> | AsyncIterable<string>,
   options?: StreamOptions,
): AsyncGenerator<StreamEvent> {
   // Validate options if provided
   if (options !== undefined) {
      streamOptionsSchema.parse(options);
   }

   const delimiter = options?.delimiter ?? ",";
   const parserState: StreamingParserState = {
      ctx: createStateMachineContext(delimiter),
      buffer: "",
      delimiterDetected: !!options?.delimiter,
      headers: undefined,
      headersEmitted: false,
      rowIndex: 0,
      hasHeaders: options?.hasHeaders ?? false,
      trimFields: options?.trimFields ?? false,
      skipRows: options?.skipRows ?? 0,
      skippedRows: 0,
      maxBufferSize: options?.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE,
   };

   // Convert ReadableStream to AsyncIterable if needed
   let iterable: AsyncIterable<string>;

   if (input instanceof ReadableStream) {
      const reader = input.getReader();
      const decoder = new TextDecoder();

      iterable = {
         async *[Symbol.asyncIterator]() {
            while (true) {
               const { done, value } = await reader.read();
               if (done) break;
               yield decoder.decode(value, { stream: true });
            }
            // Flush any remaining bytes
            const final = decoder.decode();
            if (final) yield final;
         },
      };
   } else {
      iterable = input;
   }

   // Process each chunk
   for await (const chunk of iterable) {
      yield* processChunk(chunk, parserState);
   }

   // Process any remaining data in buffer
   if (parserState.buffer.length > 0 || hasPendingData(parserState.ctx)) {
      // Check for unclosed quoted field - this is a parse error
      if (parserState.ctx.state === "QUOTED_FIELD") {
         throw new Error("Unclosed quoted field at end of file");
      }

      // Add final field to current row and emit
      if (hasPendingData(parserState.ctx)) {
         parserState.ctx.currentRow.push(parserState.ctx.currentField);
         const events = emitRowSync(parserState, [
            ...parserState.ctx.currentRow,
         ]);
         for (const event of events) {
            yield event;
         }
      }
   }

   // Emit completion event with the detected delimiter
   yield {
      type: "complete",
      rowCount: parserState.rowIndex,
      delimiter: parserState.ctx.delimiter,
   };
}

/**
 * Parses CSV content from a stream and collects all rows into a CSVDocument.
 *
 * @param input - A ReadableStream of Uint8Array or AsyncIterable of strings
 * @param options - Parsing options
 * @returns A promise that resolves to the complete CSVDocument
 */
export async function parseStreamToArray(
   input: ReadableStream<Uint8Array> | AsyncIterable<string>,
   options?: StreamOptions,
): Promise<CSVDocument> {
   const rows: ParsedRow[] = [];
   let headers: string[] | undefined;
   let delimiter = options?.delimiter ?? ",";

   for await (const event of parseStream(input, options)) {
      switch (event.type) {
         case "headers":
            headers = event.data;
            break;
         case "row":
            rows.push(event.data);
            break;
         case "complete":
            // Capture the detected delimiter from the parser
            delimiter = event.delimiter;
            break;
      }
   }

   return {
      headers,
      rows,
      delimiter,
      totalRows: rows.length,
   };
}

/**
 * Creates a streaming parser from a buffer.
 * Useful when you have a buffer but want to use the streaming API.
 *
 * **Memory Warning**: This function decodes the entire buffer into a string
 * before chunking it for streaming. For very large files (e.g., >100MB),
 * consider using parseStream with a true streaming source instead.
 *
 * @param buffer - The buffer containing CSV data
 * @param options - Parsing options
 * @yields StreamEvent for headers and each row
 */
export async function* parseBufferStream(
   buffer: Uint8Array,
   options?: StreamOptions,
): AsyncGenerator<StreamEvent> {
   const content = decodeBuffer(buffer);
   const chunkSize = options?.chunkSize ?? 65536; // 64KB default

   // Create an async iterable that yields chunks
   async function* chunkGenerator(): AsyncGenerator<string> {
      for (let i = 0; i < content.length; i += chunkSize) {
         yield content.slice(i, i + chunkSize);
      }
   }

   yield* parseStream(chunkGenerator(), options);
}

/**
 * Creates an async iterable that yields chunks of the content string.
 * Yields to the main thread between chunks for UI responsiveness.
 */
async function* createChunkIterable(
   content: string,
   chunkSize = 65536,
): AsyncGenerator<string> {
   for (let i = 0; i < content.length; i += chunkSize) {
      yield content.slice(i, i + chunkSize);
      // Yield to main thread between chunks for UI responsiveness
      await new Promise((resolve) => setTimeout(resolve, 0));
   }
}

/**
 * Streaming batch parser - processes files sequentially, yielding events.
 * Yields control between files for UI responsiveness.
 *
 * @param files - Array of files with filename and content
 * @param options - Stream options
 * @yields BatchCsvStreamEvent for each file start, row, completion, or error
 */
export async function* parseBatchStream(
   files: BatchCsvFileInput[],
   options?: StreamOptions,
): AsyncGenerator<BatchCsvStreamEvent> {
   let totalRows = 0;
   let errorCount = 0;

   for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      yield { type: "file_start", fileIndex: i, filename: file.filename };

      try {
         let fileRowCount = 0;
         let fileDelimiter = options?.delimiter ?? ",";

         // Create chunked async iterable
         const chunkIterable = createChunkIterable(file.content);

         for await (const event of parseStream(chunkIterable, options)) {
            switch (event.type) {
               case "headers":
                  yield { type: "headers", fileIndex: i, data: event.data };
                  break;
               case "row":
                  yield { type: "row", fileIndex: i, data: event.data };
                  fileRowCount++;
                  break;
               case "complete":
                  fileDelimiter = event.delimiter;
                  break;
            }
         }

         totalRows += fileRowCount;
         yield {
            type: "file_complete",
            fileIndex: i,
            filename: file.filename,
            rowCount: fileRowCount,
            delimiter: fileDelimiter,
         };
      } catch (err) {
         errorCount++;
         yield {
            type: "file_error",
            fileIndex: i,
            filename: file.filename,
            error: err instanceof Error ? err.message : String(err),
         };
      }

      // Yield control between files for UI responsiveness
      await new Promise((resolve) => setTimeout(resolve, 0));
   }

   yield {
      type: "batch_complete",
      totalFiles: files.length,
      totalRows,
      errorCount,
   };
}

/**
 * Convenience function that collects streaming batch results into arrays.
 *
 * @param files - Array of files with filename and content
 * @param options - Stream options
 * @returns Array of parsed file results
 */
export async function parseBatchStreamToArray(
   files: BatchCsvFileInput[],
   options?: StreamOptions,
): Promise<BatchParsedCsvFile[]> {
   const results: BatchParsedCsvFile[] = files.map((file, index) => ({
      fileIndex: index,
      filename: file.filename,
      rows: [],
      delimiter: options?.delimiter ?? ",",
      totalRows: 0,
   }));

   for await (const event of parseBatchStream(files, options)) {
      switch (event.type) {
         case "headers": {
            const result = results[event.fileIndex];
            if (result) result.headers = event.data;
            break;
         }
         case "row": {
            const result = results[event.fileIndex];
            if (result) result.rows.push(event.data);
            break;
         }
         case "file_complete": {
            const result = results[event.fileIndex];
            if (result) {
               result.totalRows = event.rowCount;
               result.delimiter = event.delimiter;
            }
            break;
         }
         case "file_error": {
            const result = results[event.fileIndex];
            if (result) result.error = event.error;
            break;
         }
      }
   }

   return results;
}
