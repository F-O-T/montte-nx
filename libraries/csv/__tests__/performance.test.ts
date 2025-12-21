import { expect, setDefaultTimeout, test } from "bun:test";

setDefaultTimeout(120000);

import {
   generate,
   generateFromObjects,
   parse,
   parseOrThrow,
   parseStream,
   parseStreamToArray,
} from "../src";

function generateRow(index: number): string[] {
   const statuses = ["active", "pending", "completed"];
   const status = statuses[index % statuses.length] as string;
   const value = (Math.random() * 5000).toFixed(2);
   const day = String((index % 28) + 1).padStart(2, "0");
   const month = String((index % 12) + 1).padStart(2, "0");

   return [
      `2024-${month}-${day}`,
      `Record ${index}`,
      value,
      status,
      `Group ${index % 20}`,
      `Description for record ${index} with additional details`,
   ];
}

function generateCSV(rowCount: number): string {
   const headers = ["date", "name", "value", "status", "group", "description"];
   const rows = [headers];

   for (let i = 0; i < rowCount; i++) {
      rows.push(generateRow(i));
   }

   return generate(rows);
}

function generateComplexCSV(rowCount: number): string {
   const headers = ["date", "name", "value", "status", "notes"];
   const rows = [headers];

   for (let i = 0; i < rowCount; i++) {
      const hasQuotes = i % 10 === 0;
      const hasNewlines = i % 20 === 0;
      const hasCommas = i % 5 === 0;

      let name = `Record ${i}`;
      if (hasQuotes) name = `Record "special" ${i}`;
      if (hasCommas) name = `Record, with, commas ${i}`;

      let notes = `Note ${i}`;
      if (hasNewlines) notes = `Line 1\nLine 2\nLine 3 for record ${i}`;

      rows.push([
         `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
         name,
         (Math.random() * 1000).toFixed(2),
         i % 2 === 0 ? "inactive" : "active",
         notes,
      ]);
   }

   return generate(rows);
}

interface BenchmarkResult {
   name: string;
   iterations: number;
   totalMs: number;
   avgMs: number;
   minMs: number;
   maxMs: number;
   opsPerSec: number;
}

function benchmark(
   name: string,
   fn: () => void,
   iterations = 100,
): BenchmarkResult {
   const times: number[] = [];

   // Warmup
   for (let i = 0; i < 5; i++) {
      fn();
   }

   for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
   }

   const totalMs = times.reduce((a, b) => a + b, 0);
   const avgMs = totalMs / iterations;
   const minMs = Math.min(...times);
   const maxMs = Math.max(...times);
   const opsPerSec = 1000 / avgMs;

   return { avgMs, iterations, maxMs, minMs, name, opsPerSec, totalMs };
}

function formatResult(result: BenchmarkResult): string {
   return `${result.name}: avg=${result.avgMs.toFixed(3)}ms, min=${result.minMs.toFixed(3)}ms, max=${result.maxMs.toFixed(3)}ms, ops/s=${result.opsPerSec.toFixed(2)}`;
}

function formatBytes(bytes: number): string {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n: number): string {
   return n.toLocaleString("en-US");
}

test("performance: parse small CSV (100 rows)", () => {
   const csv = generateCSV(100);
   const result = benchmark("parse-100-rows", () => parse(csv), 100);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(10);
});

test("performance: parse medium CSV (1000 rows)", () => {
   const csv = generateCSV(1000);
   const result = benchmark("parse-1000-rows", () => parse(csv), 50);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(50);
});

test("performance: parse large CSV (10000 rows)", () => {
   const csv = generateCSV(10000);
   const result = benchmark("parse-10000-rows", () => parse(csv), 20);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(200);
});

test("performance: parse very large CSV (50000 rows)", () => {
   const csv = generateCSV(50000);
   const result = benchmark("parse-50000-rows", () => parse(csv), 10);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(1000);
});

test("performance: parse complex CSV with quotes/newlines (10000 rows)", () => {
   const csv = generateComplexCSV(10000);
   const result = benchmark("parse-complex-10000-rows", () => parse(csv), 20);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(300);
});

test("performance: generate small CSV (100 rows)", () => {
   const data = Array.from({ length: 100 }, (_, i) => generateRow(i));
   const result = benchmark("generate-100-rows", () => generate(data), 100);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(5);
});

test("performance: generate large CSV (10000 rows)", () => {
   const data = Array.from({ length: 10000 }, (_, i) => generateRow(i));
   const result = benchmark("generate-10000-rows", () => generate(data), 20);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(50);
});

test("performance: generateFromObjects (10000 rows)", () => {
   const data = Array.from({ length: 10000 }, (_, i) => ({
      date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
      name: `Record ${i}`,
      value: (Math.random() * 1000).toFixed(2),
      status: i % 2 === 0 ? "inactive" : "active",
   }));

   const result = benchmark(
      "generateFromObjects-10000-rows",
      () => generateFromObjects(data),
      20,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(100);
});

test("performance: roundtrip parse+generate (10000 rows)", () => {
   const csv = generateCSV(10000);

   const result = benchmark(
      "roundtrip-10000-rows",
      () => {
         const doc = parseOrThrow(csv, { hasHeaders: true });
         const rows = [doc.headers ?? []].concat(doc.rows.map((r) => r.fields));
         generate(rows);
      },
      20,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(300);
});

test("performance: streaming parse (50000 rows)", async () => {
   const csv = generateCSV(50000);
   const encoder = new TextEncoder();
   const buffer = encoder.encode(csv);

   async function* bufferToStream() {
      const chunkSize = 65536; // 64KB chunks
      for (let i = 0; i < buffer.length; i += chunkSize) {
         yield new TextDecoder().decode(buffer.slice(i, i + chunkSize));
      }
   }

   const start = performance.now();
   let rowCount = 0;

   for await (const event of parseStream(bufferToStream(), {
      hasHeaders: true,
   })) {
      if (event.type === "row") rowCount++;
   }

   const duration = performance.now() - start;

   console.log(
      `Streaming parse 50000 rows: ${duration.toFixed(2)}ms, ${formatNumber(Math.round(rowCount / (duration / 1000)))} rows/sec`,
   );

   expect(rowCount).toBe(50000);
   expect(duration).toBeLessThan(2000);
});

test("performance: streaming vs full parse (10000 rows)", async () => {
   const csv = generateCSV(10000);

   // Full parse
   const fullStart = performance.now();
   const fullResult = parseOrThrow(csv, { hasHeaders: true });
   const fullDuration = performance.now() - fullStart;

   // Streaming parse
   async function* stringToStream(str: string) {
      yield str;
   }

   const streamStart = performance.now();
   const streamResult = await parseStreamToArray(stringToStream(csv), {
      hasHeaders: true,
   });
   const streamDuration = performance.now() - streamStart;

   console.log(`Full parse: ${fullDuration.toFixed(2)}ms`);
   console.log(`Stream parse: ${streamDuration.toFixed(2)}ms`);
   console.log(`Ratio: ${(streamDuration / fullDuration).toFixed(2)}x`);

   expect(fullResult.rows.length).toBe(10000);
   expect(streamResult.rows.length).toBe(10000);
});

test("performance: memory efficiency with large dataset", () => {
   const rowCounts = [1000, 5000, 10000, 25000];
   const results: { count: number; parseTime: number; memoryMB: number }[] = [];

   for (const count of rowCounts) {
      const csv = generateCSV(count);

      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();

      const doc = parseOrThrow(csv, { hasHeaders: true });

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      results.push({
         count,
         memoryMB: (endMemory - startMemory) / (1024 * 1024),
         parseTime: endTime - startTime,
      });

      expect(doc.rows.length).toBe(count);
   }

   console.log("\nMemory Scaling:");
   for (const r of results) {
      console.log(
         `  ${r.count} rows: ${r.parseTime.toFixed(2)}ms, ~${r.memoryMB.toFixed(2)}MB`,
      );
   }

   // Check linear scaling
   const ratio =
      (results[results.length - 1]?.parseTime ?? 0) /
      (results[0]?.parseTime ?? 1);
   const countRatio =
      (results[results.length - 1]?.count ?? 0) / (results[0]?.count ?? 1);
   expect(ratio).toBeLessThan(countRatio * 2);
});

test("performance: concurrent parsing", async () => {
   const csv = generateCSV(2000);
   const concurrency = 10;

   const start = performance.now();
   const promises = Array.from({ length: concurrency }, () =>
      Promise.resolve(parse(csv)),
   );
   const results = await Promise.all(promises);
   const end = performance.now();

   const totalTime = end - start;
   const avgTimePerParse = totalTime / concurrency;

   console.log(
      `Concurrent parsing (${concurrency}x): total=${totalTime.toFixed(2)}ms, avg=${avgTimePerParse.toFixed(2)}ms`,
   );

   expect(results.every((r) => r.success)).toBe(true);
   expect(totalTime).toBeLessThan(1000);
});

test("performance: file size impact", () => {
   const sizes = [100, 500, 1000, 2500, 5000, 10000];
   const results: { size: number; fileKB: number; parseMs: number }[] = [];

   for (const size of sizes) {
      const csv = generateCSV(size);
      const fileKB = new Blob([csv]).size / 1024;

      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
         const start = performance.now();
         parse(csv);
         times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      results.push({ fileKB, parseMs: avgTime, size });
   }

   console.log("\nFile Size Impact:");
   for (const r of results) {
      const throughput = r.fileKB / r.parseMs;
      console.log(
         `  ${r.size} rows (${r.fileKB.toFixed(1)}KB): ${r.parseMs.toFixed(2)}ms (${throughput.toFixed(2)} KB/ms)`,
      );
   }

   for (const r of results) {
      expect(r.parseMs).toBeLessThan(r.size * 0.5);
   }
});

test("performance: medium dataset (~25k rows)", () => {
   console.log("\n========== MEDIUM DATASET (~25K ROWS) ==========");

   const csv = generateCSV(25000);
   const fileSize = new Blob([csv]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const parseResult = benchmark("parse-medium-25k", () => parse(csv), 5);
   console.log(formatResult(parseResult));

   const doc = parseOrThrow(csv, { hasHeaders: true });
   console.log(`Rows parsed: ${formatNumber(doc.rows.length)}`);
   console.log(
      `Throughput: ${formatNumber(Math.round(doc.rows.length / (parseResult.avgMs / 1000)))} rows/sec`,
   );

   expect(parseResult.avgMs).toBeLessThan(1000);
   expect(doc.rows.length).toBe(25000);
});

test("performance: large dataset (~50k rows)", () => {
   console.log("\n========== LARGE DATASET (~50K ROWS) ==========");

   const csv = generateCSV(50000);
   const fileSize = new Blob([csv]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const parseResult = benchmark("parse-large-50k", () => parse(csv), 3);
   console.log(formatResult(parseResult));

   const doc = parseOrThrow(csv, { hasHeaders: true });
   console.log(`Rows parsed: ${formatNumber(doc.rows.length)}`);
   console.log(
      `Throughput: ${formatNumber(Math.round(doc.rows.length / (parseResult.avgMs / 1000)))} rows/sec`,
   );

   expect(parseResult.avgMs).toBeLessThan(2000);
   expect(doc.rows.length).toBe(50000);
});

test("performance: very large dataset (~100k rows)", () => {
   console.log("\n========== VERY LARGE DATASET (~100K ROWS) ==========");

   const csv = generateCSV(100000);
   const fileSize = new Blob([csv]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const startMem = process.memoryUsage();
   const startTime = performance.now();

   const result = parse(csv);
   expect(result.success).toBe(true);
   if (!result.success) return;

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage();

   const doc = result.data;
   const heapUsedMB = (endMem.heapUsed - startMem.heapUsed) / (1024 * 1024);
   const rssUsedMB = (endMem.rss - startMem.rss) / (1024 * 1024);

   console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Rows: ${formatNumber(doc.totalRows)}`);
   console.log(`Heap memory delta: ${heapUsedMB.toFixed(2)} MB`);
   console.log(`RSS memory delta: ${rssUsedMB.toFixed(2)} MB`);
   console.log(
      `Throughput: ${(fileSize / (1024 * 1024) / (parseTime / 1000)).toFixed(2)} MB/s`,
   );
   console.log(
      `Rows/sec: ${formatNumber(Math.round(doc.totalRows / (parseTime / 1000)))}`,
   );

   expect(parseTime).toBeLessThan(5000);
   expect(doc.totalRows).toBeGreaterThan(99000);
});

test("performance: complex CSV with many edge cases (~20k rows)", () => {
   console.log(
      "\n========== COMPLEX CSV WITH EDGE CASES (~20K ROWS) ==========",
   );

   const csv = generateComplexCSV(20000);
   const fileSize = new Blob([csv]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const parseResult = benchmark("parse-complex-20k", () => parse(csv), 5);
   console.log(formatResult(parseResult));

   const doc = parseOrThrow(csv, { hasHeaders: true });

   // Check that edge cases were handled correctly
   const hasNewlineFields = doc.rows.some((r) =>
      r.fields.some((f) => f.includes("\n")),
   );
   const hasCommaFields = doc.rows.some((r) =>
      r.fields.some((f) => f.includes(",")),
   );

   // The CSV contains fields that needed quoting due to special characters
   const csvContainsQuotedFields = csv.includes('",') || csv.includes(',"');

   console.log(`CSV contains quoted fields: ${csvContainsQuotedFields}`);
   console.log(`Contains newline fields: ${hasNewlineFields}`);
   console.log(`Contains comma fields: ${hasCommaFields}`);

   expect(csvContainsQuotedFields).toBe(true);
   expect(hasNewlineFields).toBe(true);
   expect(hasCommaFields).toBe(true);
   expect(parseResult.avgMs).toBeLessThan(1000);
});

test("performance: memory pressure with multiple large files", () => {
   console.log("\n========== MEMORY PRESSURE TEST ==========");

   const fileCount = 5;
   const docs: ReturnType<typeof parseOrThrow>[] = [];

   const startMem = process.memoryUsage().heapUsed;
   const startTime = performance.now();

   for (let i = 0; i < fileCount; i++) {
      const csv = generateCSV(15000);
      docs.push(parseOrThrow(csv, { hasHeaders: true }));
      console.log(`Parsed file ${i + 1}/${fileCount}`);
   }

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage().heapUsed;
   const memUsedMB = (endMem - startMem) / (1024 * 1024);

   let totalRows = 0;
   for (const doc of docs) {
      totalRows += doc.totalRows;
   }

   console.log(`Total files: ${fileCount}`);
   console.log(`Total rows: ${formatNumber(totalRows)}`);
   console.log(`Total parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Memory used: ${memUsedMB.toFixed(2)} MB`);
   console.log(`Avg memory per file: ${(memUsedMB / fileCount).toFixed(2)} MB`);

   expect(totalRows).toBeGreaterThan(70000);
   expect(parseTime).toBeLessThan(10000);
});

test("performance: worst case - maximum field complexity", () => {
   console.log("\n========== WORST CASE - MAX FIELD COMPLEXITY ==========");

   function generateComplexRow(index: number): string[] {
      // Create fields with all edge cases
      const quotedField = `"Quote ${index}" and more "quotes"`;
      const newlineField = `Line 1\nLine 2\nLine 3\nLine 4 for ${index}`;
      const commaField = `First, Second, Third, Fourth part ${index}`;
      const mixedField = `"Mixed" with\nnewlines, and, commas for ${index}`;
      const longField = `${"This is a very long field with lots of text ".repeat(5)}${index}`;

      return [
         `2024-01-${String((index % 28) + 1).padStart(2, "0")}`,
         quotedField,
         commaField,
         newlineField,
         mixedField,
         longField,
      ];
   }

   const rowCount = 10000;
   const rows = [
      ["date", "quoted", "commas", "newlines", "mixed", "long"],
      ...Array.from({ length: rowCount }, (_, i) => generateComplexRow(i)),
   ];

   const csv = generate(rows);
   const fileSize = new Blob([csv]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);
   console.log(`Rows: ${formatNumber(rowCount)}`);
   console.log(`Avg bytes/row: ${Math.round(fileSize / rowCount)}`);

   const result = benchmark("parse-worst-case-10k", () => parse(csv), 5);
   console.log(formatResult(result));

   const doc = parseOrThrow(csv, { hasHeaders: true });

   expect(doc.rows.length).toBe(rowCount);
   expect(result.avgMs).toBeLessThan(2000);
});
