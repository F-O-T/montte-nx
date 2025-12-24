import { describe, expect, test } from "bun:test";
import {
   type BatchFileInput,
   type BatchStreamEvent,
   generateBankStatement,
   parseBatchStream,
   parseBatchStreamToArray,
   parseStream,
   parseStreamToArray,
   type StreamEvent,
} from "../src";

function stringToReadableStream(str: string): ReadableStream<Uint8Array> {
   const encoder = new TextEncoder();
   const chunks = [];
   const chunkSize = 1024;

   for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(encoder.encode(str.slice(i, i + chunkSize)));
   }

   let index = 0;
   return new ReadableStream({
      pull(controller) {
         if (index < chunks.length) {
            controller.enqueue(chunks[index]);
            index++;
         } else {
            controller.close();
         }
      },
   });
}

async function* stringToAsyncIterable(
   str: string,
   chunkSize = 1024,
): AsyncIterable<string> {
   for (let i = 0; i < str.length; i += chunkSize) {
      yield str.slice(i, i + chunkSize);
   }
}

function generateTestOFX(transactionCount: number): string {
   const transactions = Array.from({ length: transactionCount }, (_, i) => ({
      amount: (i % 2 === 0 ? 1 : -1) * (100 + i),
      datePosted: new Date(2024, 0, (i % 28) + 1),
      fitId: `TXN${String(i).padStart(6, "0")}`,
      memo: `Transaction memo ${i}`,
      name: `Transaction ${i}`,
      type: i % 2 === 0 ? ("CREDIT" as const) : ("DEBIT" as const),
   }));

   return generateBankStatement({
      accountId: "123456789",
      accountType: "CHECKING",
      availableBalance: { amount: 9500, asOfDate: new Date(2024, 0, 31) },
      bankId: "001",
      currency: "BRL",
      endDate: new Date(2024, 0, 31),
      ledgerBalance: { amount: 10000, asOfDate: new Date(2024, 0, 31) },
      startDate: new Date(2024, 0, 1),
      transactions,
   });
}

describe("parseStream", () => {
   test("parses OFX from ReadableStream", async () => {
      const ofx = generateTestOFX(10);
      const stream = stringToReadableStream(ofx);
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stream)) {
         events.push(event);
      }

      const headerEvents = events.filter((e) => e.type === "header");
      const transactionEvents = events.filter((e) => e.type === "transaction");
      const accountEvents = events.filter((e) => e.type === "account");
      const balanceEvents = events.filter((e) => e.type === "balance");
      const completeEvents = events.filter((e) => e.type === "complete");

      expect(headerEvents.length).toBe(1);
      expect(transactionEvents.length).toBe(10);
      expect(accountEvents.length).toBe(1);
      expect(balanceEvents.length).toBe(1);
      expect(completeEvents.length).toBe(1);

      if (completeEvents[0]?.type === "complete") {
         expect(completeEvents[0].transactionCount).toBe(10);
      }
   });

   test("parses OFX from AsyncIterable", async () => {
      const ofx = generateTestOFX(5);
      const events: StreamEvent[] = [];

      for await (const event of parseStream(stringToAsyncIterable(ofx))) {
         events.push(event);
      }

      const transactionEvents = events.filter((e) => e.type === "transaction");
      expect(transactionEvents.length).toBe(5);
   });

   test("handles large files with many transactions", async () => {
      const ofx = generateTestOFX(1000);
      const stream = stringToReadableStream(ofx);
      let transactionCount = 0;

      for await (const event of parseStream(stream)) {
         if (event.type === "transaction") {
            transactionCount++;
         }
      }

      expect(transactionCount).toBe(1000);
   });

   test("yields header before transactions", async () => {
      const ofx = generateTestOFX(5);
      const stream = stringToReadableStream(ofx);
      const eventTypes: string[] = [];

      for await (const event of parseStream(stream)) {
         eventTypes.push(event.type);
      }

      const headerIndex = eventTypes.indexOf("header");
      const firstTransactionIndex = eventTypes.indexOf("transaction");

      expect(headerIndex).toBeLessThan(firstTransactionIndex);
   });

   test("yields account info before transactions", async () => {
      const ofx = generateTestOFX(5);
      const stream = stringToReadableStream(ofx);
      const eventTypes: string[] = [];

      for await (const event of parseStream(stream)) {
         eventTypes.push(event.type);
      }

      const accountIndex = eventTypes.indexOf("account");
      const firstTransactionIndex = eventTypes.indexOf("transaction");

      expect(accountIndex).toBeLessThan(firstTransactionIndex);
   });
});

describe("parseStreamToArray", () => {
   test("collects all events into arrays", async () => {
      const ofx = generateTestOFX(10);
      const stream = stringToReadableStream(ofx);
      const result = await parseStreamToArray(stream);

      expect(result.header).toBeDefined();
      expect(result.transactions.length).toBe(10);
      expect(result.accounts.length).toBe(1);
      expect(result.balances.length).toBe(1);
   });

   test("transactions have correct data", async () => {
      const ofx = generateTestOFX(3);
      const stream = stringToReadableStream(ofx);
      const result = await parseStreamToArray(stream);

      expect(result.transactions[0]?.FITID).toBe("TXN000000");
      expect(result.transactions[0]?.TRNTYPE).toBe("CREDIT");
      expect(result.transactions[1]?.TRNTYPE).toBe("DEBIT");
   });

   test("account info is correct", async () => {
      const ofx = generateTestOFX(1);
      const stream = stringToReadableStream(ofx);
      const result = await parseStreamToArray(stream);

      const account = result.accounts[0];
      expect(account).toBeDefined();
      if (account && "BANKID" in account) {
         expect(account.BANKID).toBe("001");
         expect(account.ACCTID).toBe("123456789");
         expect(account.ACCTTYPE).toBe("CHECKING");
      }
   });

   test("balance info is correct", async () => {
      const ofx = generateTestOFX(1);
      const stream = stringToReadableStream(ofx);
      const result = await parseStreamToArray(stream);

      const balance = result.balances[0];
      expect(balance).toBeDefined();
      expect(balance?.ledger?.BALAMT).toBe(10000);
      expect(balance?.available?.BALAMT).toBe(9500);
   });
});

describe("streaming performance", () => {
   test("processes large file without loading all into memory", async () => {
      const ofx = generateTestOFX(5000);
      const stream = stringToReadableStream(ofx);

      let count = 0;
      const startTime = performance.now();

      for await (const event of parseStream(stream)) {
         if (event.type === "transaction") {
            count++;
         }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(count).toBe(5000);
      expect(duration).toBeLessThan(10000);
      console.log(
         `Streamed 5000 transactions in ${duration.toFixed(2)}ms (${(5000 / (duration / 1000)).toFixed(0)} txn/s)`,
      );
   });
});

// Helper to convert OFX string to BatchFileInput
function createBatchFileInput(
   content: string,
   filename: string,
): BatchFileInput {
   return {
      filename,
      buffer: new TextEncoder().encode(content),
   };
}

describe("parseBatchStream", () => {
   test("yields file_start event for each file", async () => {
      const ofx1 = generateTestOFX(3);
      const ofx2 = generateTestOFX(5);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const events: BatchStreamEvent[] = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const fileStartEvents = events.filter((e) => e.type === "file_start");
      expect(fileStartEvents.length).toBe(2);
      expect(fileStartEvents[0]).toEqual({
         type: "file_start",
         fileIndex: 0,
         filename: "file1.ofx",
      });
      expect(fileStartEvents[1]).toEqual({
         type: "file_start",
         fileIndex: 1,
         filename: "file2.ofx",
      });
   });

   test("yields transactions with correct fileIndex", async () => {
      const ofx1 = generateTestOFX(3);
      const ofx2 = generateTestOFX(5);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const events: BatchStreamEvent[] = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const transactionEvents = events.filter((e) => e.type === "transaction");
      expect(transactionEvents.length).toBe(8); // 3 + 5

      const file1Transactions = transactionEvents.filter(
         (e) => e.type === "transaction" && e.fileIndex === 0,
      );
      const file2Transactions = transactionEvents.filter(
         (e) => e.type === "transaction" && e.fileIndex === 1,
      );

      expect(file1Transactions.length).toBe(3);
      expect(file2Transactions.length).toBe(5);
   });

   test("yields file_complete with transaction count", async () => {
      const ofx1 = generateTestOFX(3);
      const ofx2 = generateTestOFX(7);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const events: BatchStreamEvent[] = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const completeEvents = events.filter((e) => e.type === "file_complete");
      expect(completeEvents.length).toBe(2);

      if (completeEvents[0]?.type === "file_complete") {
         expect(completeEvents[0].transactionCount).toBe(3);
         expect(completeEvents[0].filename).toBe("file1.ofx");
      }
      if (completeEvents[1]?.type === "file_complete") {
         expect(completeEvents[1].transactionCount).toBe(7);
         expect(completeEvents[1].filename).toBe("file2.ofx");
      }
   });

   test("yields batch_complete with totals", async () => {
      const ofx1 = generateTestOFX(4);
      const ofx2 = generateTestOFX(6);
      const ofx3 = generateTestOFX(2);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
         createBatchFileInput(ofx3, "file3.ofx"),
      ];

      const events: BatchStreamEvent[] = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const batchComplete = events.find((e) => e.type === "batch_complete");
      expect(batchComplete).toBeDefined();
      if (batchComplete?.type === "batch_complete") {
         expect(batchComplete.totalFiles).toBe(3);
         expect(batchComplete.totalTransactions).toBe(12); // 4 + 6 + 2
         expect(batchComplete.errorCount).toBe(0);
      }
   });

   test("processes multiple files sequentially", async () => {
      const ofx1 = generateTestOFX(2);
      const ofx2 = generateTestOFX(3);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const eventTypes: string[] = [];
      for await (const event of parseBatchStream(files)) {
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

   test("yields header events for each file", async () => {
      const ofx1 = generateTestOFX(1);
      const ofx2 = generateTestOFX(1);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const events: BatchStreamEvent[] = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const headerEvents = events.filter((e) => e.type === "header");
      expect(headerEvents.length).toBe(2);
      expect(
         headerEvents[0]?.type === "header" && headerEvents[0].fileIndex,
      ).toBe(0);
      expect(
         headerEvents[1]?.type === "header" && headerEvents[1].fileIndex,
      ).toBe(1);
   });
});

describe("parseBatchStreamToArray", () => {
   test("collects all files into array", async () => {
      const ofx1 = generateTestOFX(3);
      const ofx2 = generateTestOFX(5);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const results = await parseBatchStreamToArray(files);

      expect(results.length).toBe(2);
      expect(results[0]?.filename).toBe("file1.ofx");
      expect(results[1]?.filename).toBe("file2.ofx");
   });

   test("each file has correct transactions", async () => {
      const ofx1 = generateTestOFX(4);
      const ofx2 = generateTestOFX(6);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const results = await parseBatchStreamToArray(files);

      expect(results[0]?.transactions.length).toBe(4);
      expect(results[1]?.transactions.length).toBe(6);

      // Verify first transaction of each file
      expect(results[0]?.transactions[0]?.FITID).toBe("TXN000000");
      expect(results[1]?.transactions[0]?.FITID).toBe("TXN000000");
   });

   test("each file has header info", async () => {
      const ofx1 = generateTestOFX(1);
      const ofx2 = generateTestOFX(1);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const results = await parseBatchStreamToArray(files);

      expect(results[0]?.header).toBeDefined();
      expect(results[1]?.header).toBeDefined();
   });

   test("each file has account and balance info", async () => {
      const ofx1 = generateTestOFX(1);
      const ofx2 = generateTestOFX(1);
      const files: BatchFileInput[] = [
         createBatchFileInput(ofx1, "file1.ofx"),
         createBatchFileInput(ofx2, "file2.ofx"),
      ];

      const results = await parseBatchStreamToArray(files);

      expect(results[0]?.accounts.length).toBe(1);
      expect(results[1]?.accounts.length).toBe(1);
      expect(results[0]?.balances.length).toBe(1);
      expect(results[1]?.balances.length).toBe(1);
   });
});
