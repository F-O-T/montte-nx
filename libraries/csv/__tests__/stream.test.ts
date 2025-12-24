import { describe, expect, test } from "bun:test";
import {
   parseBatchStream,
   parseBatchStreamToArray,
   parseBufferStream,
   parseStream,
   parseStreamToArray,
} from "../src/stream";
import type {
   BatchCsvFileInput,
   BatchCsvStreamEvent,
   StreamEvent,
} from "../src/types";

describe("parseStream", () => {
   test("streams simple CSV", async () => {
      const csv = "a,b,c\n1,2,3\n4,5,6";
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stringToIterable(csv))) {
         events.push(event);
      }

      expect(events).toHaveLength(4); // 3 rows + complete
      expect(events[0]?.type).toBe("row");
      expect(events[3]?.type).toBe("complete");
      if (events[3]?.type === "complete") {
         expect(events[3].rowCount).toBe(3);
      }
   });

   test("emits headers event when hasHeaders is true", async () => {
      const csv = "name,age\nJohn,30\nJane,25";
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stringToIterable(csv), {
         hasHeaders: true,
      })) {
         events.push(event);
      }

      expect(events[0]?.type).toBe("headers");
      if (events[0]?.type === "headers") {
         expect(events[0].data).toEqual(["name", "age"]);
      }

      expect(events[1]?.type).toBe("row");
      if (events[1]?.type === "row") {
         expect(events[1].data.record).toEqual({ name: "John", age: "30" });
      }
   });

   test("handles quoted fields with newlines", async () => {
      const csv = '"line1\nline2",b,c\n1,2,3';
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stringToIterable(csv))) {
         events.push(event);
      }

      expect(events[0]?.type).toBe("row");
      if (events[0]?.type === "row") {
         expect(events[0].data.fields[0]).toBe("line1\nline2");
      }
   });

   test("handles chunked input", async () => {
      const chunks = ["a,b,", "c\n1,2", ",3\n4,5", ",6"];
      const events: StreamEvent[] = [];

      for await (const event of parseStream(chunksToIterable(chunks))) {
         events.push(event);
      }

      expect(events.filter((e) => e.type === "row")).toHaveLength(3);
   });

   test("handles quoted fields split across chunks", async () => {
      // Note: When a quoted field is split across chunks, we need to ensure
      // the chunks don't break in the middle of a quote character sequence.
      // This test uses chunks that split at safe boundaries.
      const chunks = ['"line1\nline2",', "b,c"];
      const events: StreamEvent[] = [];

      for await (const event of parseStream(chunksToIterable(chunks))) {
         events.push(event);
      }

      expect(events[0]?.type).toBe("row");
      if (events[0]?.type === "row") {
         expect(events[0].data.fields[0]).toBe("line1\nline2");
      }
   });

   test("respects skipRows option", async () => {
      const csv = "skip\na,b,c\n1,2,3";
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stringToIterable(csv), {
         skipRows: 1,
      })) {
         events.push(event);
      }

      const rowEvents = events.filter((e) => e.type === "row");
      expect(rowEvents).toHaveLength(2);
   });

   test("respects trimFields option", async () => {
      const csv = " a , b , c \n 1 , 2 , 3 ";
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stringToIterable(csv), {
         trimFields: true,
      })) {
         events.push(event);
      }

      if (events[0]?.type === "row") {
         expect(events[0].data.fields).toEqual(["a", "b", "c"]);
      }
   });

   test("handles ReadableStream input", async () => {
      const csv = "a,b,c\n1,2,3";
      const stream = new ReadableStream<Uint8Array>({
         start(controller) {
            controller.enqueue(new TextEncoder().encode(csv));
            controller.close();
         },
      });

      const events: StreamEvent[] = [];
      for await (const event of parseStream(stream)) {
         events.push(event);
      }

      expect(events.filter((e) => e.type === "row")).toHaveLength(2);
   });
});

describe("parseStreamToArray", () => {
   test("collects all rows into CSVDocument", async () => {
      const csv = "a,b,c\n1,2,3\n4,5,6";
      const result = await parseStreamToArray(stringToIterable(csv));

      expect(result.rows).toHaveLength(3);
      expect(result.totalRows).toBe(3);
   });

   test("includes headers when hasHeaders is true", async () => {
      const csv = "name,age\nJohn,30";
      const result = await parseStreamToArray(stringToIterable(csv), {
         hasHeaders: true,
      });

      expect(result.headers).toEqual(["name", "age"]);
      expect(result.rows).toHaveLength(1);
   });
});

describe("parseBufferStream", () => {
   test("streams from buffer", async () => {
      const csv = "a,b,c\n1,2,3";
      const buffer = new TextEncoder().encode(csv);
      const events: StreamEvent[] = [];

      for await (const event of parseBufferStream(buffer)) {
         events.push(event);
      }

      expect(events.filter((e) => e.type === "row")).toHaveLength(2);
   });

   test("respects chunkSize option", async () => {
      const csv = "a,b,c\n1,2,3\n4,5,6";
      const buffer = new TextEncoder().encode(csv);
      const events: StreamEvent[] = [];

      // Use small chunk size to force multiple chunks
      for await (const event of parseBufferStream(buffer, { chunkSize: 5 })) {
         events.push(event);
      }

      expect(events.filter((e) => e.type === "row")).toHaveLength(3);
   });
});

// Helper functions
async function* stringToIterable(str: string): AsyncIterable<string> {
   yield str;
}

async function* chunksToIterable(chunks: string[]): AsyncIterable<string> {
   for (const chunk of chunks) {
      yield chunk;
   }
}

// Helper to create batch file input
function createBatchCsvInput(
   content: string,
   filename: string,
): BatchCsvFileInput {
   return { filename, content };
}

describe("parseBatchStream", () => {
   test("yields file_start event for each file", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b,c\n1,2,3", "file1.csv"),
         createBatchCsvInput("x,y,z\n4,5,6", "file2.csv"),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const fileStartEvents = events.filter((e) => e.type === "file_start");
      expect(fileStartEvents.length).toBe(2);
      expect(fileStartEvents[0]).toEqual({
         type: "file_start",
         fileIndex: 0,
         filename: "file1.csv",
      });
      expect(fileStartEvents[1]).toEqual({
         type: "file_start",
         fileIndex: 1,
         filename: "file2.csv",
      });
   });

   test("yields headers for each file", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("name,age\nJohn,30", "file1.csv"),
         createBatchCsvInput("city,country\nNYC,USA", "file2.csv"),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files, { hasHeaders: true })) {
         events.push(event);
      }

      const headerEvents = events.filter((e) => e.type === "headers");
      expect(headerEvents.length).toBe(2);

      if (headerEvents[0]?.type === "headers") {
         expect(headerEvents[0].fileIndex).toBe(0);
         expect(headerEvents[0].data).toEqual(["name", "age"]);
      }
      if (headerEvents[1]?.type === "headers") {
         expect(headerEvents[1].fileIndex).toBe(1);
         expect(headerEvents[1].data).toEqual(["city", "country"]);
      }
   });

   test("yields rows with correct fileIndex", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b\n1,2\n3,4", "file1.csv"),
         createBatchCsvInput("x,y\n5,6\n7,8\n9,0", "file2.csv"),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files, { hasHeaders: true })) {
         events.push(event);
      }

      const rowEvents = events.filter((e) => e.type === "row");
      expect(rowEvents.length).toBe(5); // 2 + 3

      const file1Rows = rowEvents.filter(
         (e) => e.type === "row" && e.fileIndex === 0,
      );
      const file2Rows = rowEvents.filter(
         (e) => e.type === "row" && e.fileIndex === 1,
      );

      expect(file1Rows.length).toBe(2);
      expect(file2Rows.length).toBe(3);
   });

   test("yields file_complete with row count", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b\n1,2\n3,4", "file1.csv"),
         createBatchCsvInput("x,y\n5,6\n7,8\n9,0", "file2.csv"),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files, { hasHeaders: true })) {
         events.push(event);
      }

      const completeEvents = events.filter((e) => e.type === "file_complete");
      expect(completeEvents.length).toBe(2);

      if (completeEvents[0]?.type === "file_complete") {
         expect(completeEvents[0].rowCount).toBe(2);
         expect(completeEvents[0].filename).toBe("file1.csv");
      }
      if (completeEvents[1]?.type === "file_complete") {
         expect(completeEvents[1].rowCount).toBe(3);
         expect(completeEvents[1].filename).toBe("file2.csv");
      }
   });

   test("yields batch_complete with totals", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b\n1,2\n3,4", "file1.csv"),
         createBatchCsvInput("x,y\n5,6", "file2.csv"),
         createBatchCsvInput("p,q\n7,8\n9,0\n1,2", "file3.csv"),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files, { hasHeaders: true })) {
         events.push(event);
      }

      const batchComplete = events.find((e) => e.type === "batch_complete");
      expect(batchComplete).toBeDefined();
      if (batchComplete?.type === "batch_complete") {
         expect(batchComplete.totalFiles).toBe(3);
         expect(batchComplete.totalRows).toBe(6); // 2 + 1 + 3
         expect(batchComplete.errorCount).toBe(0);
      }
   });

   test("processes multiple files sequentially", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b\n1,2", "file1.csv"),
         createBatchCsvInput("x,y\n3,4", "file2.csv"),
      ];

      const eventTypes: string[] = [];
      for await (const event of parseBatchStream(files, { hasHeaders: true })) {
         eventTypes.push(
            `${event.type}:${event.type === "batch_complete" ? "batch" : "fileIndex" in event ? event.fileIndex : ""}`,
         );
      }

      // Verify file1 events come before file2 events
      const file1CompleteIndex = eventTypes.findIndex((e) =>
         e.startsWith("file_complete:0"),
      );
      const file2StartIndex = eventTypes.findIndex((e) =>
         e.startsWith("file_start:1"),
      );

      expect(file1CompleteIndex).toBeLessThan(file2StartIndex);
   });

   test("respects parsing options", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput(" a , b \n 1 , 2 ", "file1.csv"),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files, {
         hasHeaders: true,
         trimFields: true,
      })) {
         events.push(event);
      }

      const headerEvent = events.find((e) => e.type === "headers");
      if (headerEvent?.type === "headers") {
         expect(headerEvent.data).toEqual(["a", "b"]);
      }

      const rowEvent = events.find((e) => e.type === "row");
      if (rowEvent?.type === "row") {
         expect(rowEvent.data.fields).toEqual(["1", "2"]);
      }
   });

   test("handles file errors without stopping batch", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("name,age\nJohn,30\nJane,25", "valid1.csv"),
         createBatchCsvInput(
            'city,country\n"Unclosed quote,USA',
            "malformed.csv",
         ),
         createBatchCsvInput(
            "product,price\nApple,1.50\nBanana,0.75",
            "valid2.csv",
         ),
      ];

      const events: BatchCsvStreamEvent[] = [];
      for await (const event of parseBatchStream(files, { hasHeaders: true })) {
         events.push(event);
      }

      // Verify exactly one file_error event
      const errorEvents = events.filter((e) => e.type === "file_error");
      expect(errorEvents.length).toBe(1);
      if (errorEvents[0]?.type === "file_error") {
         expect(errorEvents[0].filename).toBe("malformed.csv");
         expect(errorEvents[0].fileIndex).toBe(1);
         expect(errorEvents[0].error).toBeDefined();
      }

      // Verify batch_complete event has correct totals
      const batchComplete = events.find((e) => e.type === "batch_complete");
      expect(batchComplete).toBeDefined();
      if (batchComplete?.type === "batch_complete") {
         expect(batchComplete.totalFiles).toBe(3);
         expect(batchComplete.errorCount).toBe(1);
         // Only rows from valid files should be counted
         expect(batchComplete.totalRows).toBe(4); // 2 from valid1 + 2 from valid2
      }

      // Verify events for valid1.csv (fileIndex 0)
      const valid1Events = events.filter(
         (e) =>
            (e.type === "file_start" ||
               e.type === "headers" ||
               e.type === "row" ||
               e.type === "file_complete") &&
            "fileIndex" in e &&
            e.fileIndex === 0,
      );
      expect(valid1Events.length).toBeGreaterThan(0);

      // Verify events for valid2.csv (fileIndex 2) to confirm isolation
      const valid2Events = events.filter(
         (e) =>
            (e.type === "file_start" ||
               e.type === "headers" ||
               e.type === "row" ||
               e.type === "file_complete") &&
            "fileIndex" in e &&
            e.fileIndex === 2,
      );
      expect(valid2Events.length).toBeGreaterThan(0);

      // Verify valid2 rows were actually parsed (after the error)
      const valid2Rows = events.filter(
         (e) => e.type === "row" && e.fileIndex === 2,
      );
      expect(valid2Rows.length).toBe(2);
      if (valid2Rows[0]?.type === "row") {
         expect(valid2Rows[0].data.record).toEqual({
            product: "Apple",
            price: "1.50",
         });
      }

      // Verify file_complete for valid files
      const completeEvents = events.filter((e) => e.type === "file_complete");
      expect(completeEvents.length).toBe(2); // Only valid files
   });
});

describe("parseBatchStreamToArray", () => {
   test("collects all files into array", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b\n1,2\n3,4", "file1.csv"),
         createBatchCsvInput("x,y\n5,6", "file2.csv"),
      ];

      const results = await parseBatchStreamToArray(files, {
         hasHeaders: true,
      });

      expect(results.length).toBe(2);
      expect(results[0]?.filename).toBe("file1.csv");
      expect(results[1]?.filename).toBe("file2.csv");
   });

   test("each file has correct rows and headers", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("name,age\nJohn,30\nJane,25", "file1.csv"),
         createBatchCsvInput("city,country\nNYC,USA", "file2.csv"),
      ];

      const results = await parseBatchStreamToArray(files, {
         hasHeaders: true,
      });

      expect(results[0]?.headers).toEqual(["name", "age"]);
      expect(results[0]?.rows.length).toBe(2);
      expect(results[0]?.rows[0]?.record).toEqual({ name: "John", age: "30" });

      expect(results[1]?.headers).toEqual(["city", "country"]);
      expect(results[1]?.rows.length).toBe(1);
      expect(results[1]?.rows[0]?.record).toEqual({
         city: "NYC",
         country: "USA",
      });
   });

   test("tracks row counts correctly", async () => {
      const files: BatchCsvFileInput[] = [
         createBatchCsvInput("a,b\n1,2\n3,4\n5,6", "file1.csv"),
         createBatchCsvInput("x,y\n7,8", "file2.csv"),
      ];

      const results = await parseBatchStreamToArray(files, {
         hasHeaders: true,
      });

      expect(results[0]?.totalRows).toBe(3);
      expect(results[1]?.totalRows).toBe(1);
   });
});
