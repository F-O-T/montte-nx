import { describe, expect, test } from "bun:test";
import spectrum from "csv-spectrum";
import { parseOrThrow } from "../src/parser.ts";

interface SpectrumTest {
	name: string;
	csv: Buffer;
	json: Buffer;
}

/**
 * Loads csv-spectrum test data.
 */
function loadSpectrumTests(): Promise<SpectrumTest[]> {
	return new Promise((resolve, reject) => {
		spectrum((err: Error | null, data: SpectrumTest[]) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
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
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("empty - handles empty files", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "empty");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("empty_crlf - handles empty files with CRLF", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "empty_crlf");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("escaped_quotes - handles escaped quotes", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "escaped_quotes");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("json - handles JSON in fields", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "json");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("newlines - handles newlines in quoted fields", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "newlines");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("newlines_crlf - handles CRLF newlines in quoted fields", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "newlines_crlf");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("quotes_and_newlines - handles quotes and newlines combined", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "quotes_and_newlines");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("simple - handles simple CSV", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "simple");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("simple_crlf - handles simple CSV with CRLF", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "simple_crlf");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

	test("utf8 - handles UTF-8 characters", async () => {
		const tests = await loadSpectrumTests();
		const testCase = tests.find((t) => t.name === "utf8");
		expect(testCase).toBeDefined();

		const csvContent = testCase!.csv.toString("utf-8");
		const expectedJson = JSON.parse(testCase!.json.toString("utf-8"));

		const result = parseOrThrow(csvContent, { hasHeaders: true });
		const actualRows = result.rows.map((row) => row.record);

		expect(actualRows).toEqual(expectedJson);
	});

});
