import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseOrThrow } from "../src/parser";

interface SpectrumTest {
   name: string;
   csv: Buffer;
   json: Buffer;
}

/**
 * Loads csv-spectrum test data from local fixtures.
 * This avoids the csv-spectrum package which has a bug where fs.readdir
 * returns files in non-deterministic order, causing CSV/JSON mismatches.
 */
async function loadSpectrumTests(): Promise<SpectrumTest[]> {
   const fixturesDir = path.join(import.meta.dir, "fixtures");
   const files = await readdir(fixturesDir);
   const csvFiles = files.filter((f) => f.endsWith(".csv"));

   return Promise.all(
      csvFiles.map(async (csvFile) => {
         const name = path.basename(csvFile, ".csv");
         const jsonFile = `${name}.json`;

         return {
            name,
            csv: await readFile(path.join(fixturesDir, csvFile)),
            json: await readFile(path.join(fixturesDir, jsonFile)),
         };
      }),
   );
}

describe("csv-spectrum compliance", () => {
   test("passes all csv-spectrum tests", async () => {
      const tests = await loadSpectrumTests();

      for (const testCase of tests) {
         const csvContent = testCase.csv.toString("utf-8");
         const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

         // Parse with headers (csv-spectrum expects object output)
         const result = parseOrThrow(csvContent, { hasHeaders: true });

         // Transform to csv-spectrum's expected format (array of objects)
         const actualRows = result.rows.map((row) => row.record);

         // Compare
         expect(actualRows).toEqual(expectedJson);
      }
   });

   // Individual test cases for better error reporting
   test("comma_in_quotes - handles commas within quoted fields", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "comma_in_quotes");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("empty - handles empty files", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "empty");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("empty_crlf - handles empty files with CRLF", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "empty_crlf");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("escaped_quotes - handles escaped quotes", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "escaped_quotes");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("json - handles JSON in fields", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "json");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("newlines - handles newlines in quoted fields", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "newlines");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("newlines_crlf - handles CRLF newlines in quoted fields", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "newlines_crlf");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("quotes_and_newlines - handles quotes and newlines combined", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "quotes_and_newlines");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("simple - handles simple CSV", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "simple");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("simple_crlf - handles simple CSV with CRLF", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "simple_crlf");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });

   test("utf8 - handles UTF-8 characters", async () => {
      const tests = await loadSpectrumTests();
      const testCase = tests.find((t) => t.name === "utf8");
      if (!testCase) throw new Error("Test case not found");

      const csvContent = testCase.csv.toString("utf-8");
      const expectedJson = JSON.parse(testCase.json.toString("utf-8"));

      const result = parseOrThrow(csvContent, { hasHeaders: true });
      const actualRows = result.rows.map((row) => row.record);

      expect(actualRows).toEqual(expectedJson);
   });
});
