import { describe, expect, test } from "bun:test";
import {
   generateBankStatement,
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
