import { describe, expect, test } from "bun:test";
import { generate, parseOrThrow, parseStream } from "../src";
import { DEFAULT_MAX_BUFFER_SIZE } from "../src/schemas";

describe("Security", () => {
   describe("Prototype Pollution Prevention", () => {
      test("prevents __proto__ header from polluting prototype", () => {
         const csv = "__proto__,value\nmalicious,data";
         const result = parseOrThrow(csv, { hasHeaders: true });

         // The __proto__ header should be skipped
         expect(result.rows[0]?.record).toBeDefined();
         expect(result.rows[0]?.record?.__proto__).toBeUndefined();

         // Original object prototype should be unaffected
         const testObj = {};
         // biome-ignore lint/suspicious/noExplicitAny: Testing prototype pollution
         expect((testObj as any).malicious).toBeUndefined();
      });

      test("prevents constructor header from polluting prototype", () => {
         const csv = "constructor,value\nmalicious,data";
         const result = parseOrThrow(csv, { hasHeaders: true });

         expect(result.rows[0]?.record).toBeDefined();
         expect(result.rows[0]?.record?.constructor).toBeUndefined();
      });

      test("prevents prototype header from polluting prototype", () => {
         const csv = "prototype,value\nmalicious,data";
         const result = parseOrThrow(csv, { hasHeaders: true });

         expect(result.rows[0]?.record).toBeDefined();
         expect(result.rows[0]?.record?.prototype).toBeUndefined();
      });

      test("allows safe header names", () => {
         const csv = "name,email,age\nJohn,john@example.com,30";
         const result = parseOrThrow(csv, { hasHeaders: true });

         expect(result.rows[0]?.record).toEqual({
            name: "John",
            email: "john@example.com",
            age: "30",
         });
      });

      test("record object has no inherited properties", () => {
         const csv = "name,value\ntest,123";
         const result = parseOrThrow(csv, { hasHeaders: true });
         const record = result.rows[0]?.record;

         // Object.create(null) objects have no prototype chain
         expect(Object.getPrototypeOf(record)).toBeNull();
         expect(record?.hasOwnProperty).toBeUndefined();
         expect(record?.toString).toBeUndefined();
      });
   });

   describe("Unclosed Quote Detection", () => {
      test("throws on unclosed quoted field in parseOrThrow", () => {
         const csv = 'name,description\nJohn,"This quote is never closed';

         expect(() => parseOrThrow(csv, { hasHeaders: true })).toThrow(
            /Unclosed quoted field/,
         );
      });

      test("includes partial content in error message", () => {
         const csv = 'name,description\nJohn,"This is the start of a long';

         try {
            parseOrThrow(csv, { hasHeaders: true });
            expect(true).toBe(false); // Should not reach here
         } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain("Partial content:");
         }
      });

      test("properly parses valid quoted fields", () => {
         const csv =
            'name,description\nJohn,"This quote is properly closed"\nJane,"Another quoted field"';
         const result = parseOrThrow(csv, { hasHeaders: true });

         expect(result.rows).toHaveLength(2);
         expect(result.rows[0]?.record?.description).toBe(
            "This quote is properly closed",
         );
      });
   });

   describe("Buffer Size Limit (Streaming)", () => {
      test("DEFAULT_MAX_BUFFER_SIZE is 10MB", () => {
         expect(DEFAULT_MAX_BUFFER_SIZE).toBe(10 * 1024 * 1024);
      });

      test("throws when buffer exceeds maxBufferSize", async () => {
         // Create a stream that simulates a very large quoted field
         const chunks = [
            '"Start of very long field that never closes',
            "more content ".repeat(1000), // Add more content
         ];

         async function* createMaliciousStream(): AsyncGenerator<string> {
            for (const chunk of chunks) {
               yield chunk;
            }
         }

         // Use a very small buffer size for testing
         const smallBufferSize = 100;

         await expect(async () => {
            const events: unknown[] = [];
            for await (const event of parseStream(createMaliciousStream(), {
               maxBufferSize: smallBufferSize,
            })) {
               events.push(event);
            }
         }).toThrow(/Buffer size exceeded/);
      });

      test("does not throw when buffer is within limits", async () => {
         const csv = "name,value\ntest,123\nfoo,bar";

         async function* createStream(): AsyncGenerator<string> {
            yield csv;
         }

         const events: unknown[] = [];
         for await (const event of parseStream(createStream(), {
            hasHeaders: true,
            maxBufferSize: 1024, // 1KB is plenty for this small CSV
         })) {
            events.push(event);
         }

         expect(events).toHaveLength(4); // headers + 2 rows + complete
      });
   });

   describe("Input Validation", () => {
      test("throws on invalid delimiter length", () => {
         expect(() => parseOrThrow("a,b,c", { delimiter: "ab" })).toThrow();
      });

      test("throws on negative skipRows", () => {
         expect(() => parseOrThrow("a,b,c", { skipRows: -1 })).toThrow();
      });

      test("throws on invalid generate options", () => {
         expect(() => generate([["a", "b"]], { delimiter: "ab" })).toThrow();
      });

      test("accepts valid options", () => {
         const result = parseOrThrow("a,b,c\n1,2,3", {
            delimiter: ",",
            skipRows: 0,
            hasHeaders: true,
            trimFields: true,
         });

         expect(result.rows).toHaveLength(1);
      });
   });
});
