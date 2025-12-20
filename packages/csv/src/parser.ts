import {
	parseOrThrow,
	parseStream,
	type CSVDocument,
	type ParsedRow,
	type StreamEvent,
	type StreamOptions,
} from "@f-o-t/csv";
import { AppError } from "@packages/utils/errors";
import { normalizeText } from "@packages/utils/text";
import {
	detectBankFormat,
	detectDelimiter,
	suggestColumnMapping,
} from "./bank-formats";
import type {
	CsvColumnMapping,
	CsvParseError,
	CsvParseOptions,
	CsvParseResult,
	ParsedCsvRow,
} from "./types";

// Re-export library types for consumers
export type { CSVDocument, ParsedRow, StreamEvent, StreamOptions };

// Progress callback types
export type CsvProgressEvent =
	| { type: "headers"; headers: string[] }
	| { type: "progress"; parsed: number; total?: number }
	| { type: "complete"; totalParsed: number; errors: CsvParseError[] };

export type CsvProgressCallback = (event: CsvProgressEvent) => void;

export interface CsvParseOptionsWithProgress extends CsvParseOptions {
	onProgress?: CsvProgressCallback;
}

export function parseAmount(
	value: string,
	format: "decimal-comma" | "decimal-dot",
): number {
	if (!value || value.trim() === "") {
		return 0;
	}

	let normalized = value.trim();

	normalized = normalized.replace(/[R$\s]/g, "");

	if (format === "decimal-comma") {
		normalized = normalized.replace(/\./g, "").replace(",", ".");
	} else {
		normalized = normalized.replace(/,/g, "");
	}

	const parsed = Number.parseFloat(normalized);

	if (Number.isNaN(parsed)) {
		return 0;
	}

	return parsed;
}

export function parseDate(value: string, format: string): Date | null {
	if (!value || value.trim() === "") {
		return null;
	}

	// Strip time suffix (e.g., "às 17:16:03" from Nubank format)
	let trimmed = value
		.trim()
		.replace(/\s+às\s+\d{1,2}:\d{2}(:\d{2})?/i, "")
		.trim();
	// Also strip generic time patterns
	trimmed = trimmed.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, "").trim();

	if (format === "DD/MM/YYYY" || format === "dd/mm/yyyy") {
		// Try 4-digit year first
		const match4 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (match4?.[1] && match4[2] && match4[3]) {
			const day = Number.parseInt(match4[1], 10);
			const month = Number.parseInt(match4[2], 10) - 1;
			const year = Number.parseInt(match4[3], 10);
			const date = new Date(year, month, day);
			if (!Number.isNaN(date.getTime())) {
				return date;
			}
		}

		// Try 2-digit year (DD/MM/YY) - assume 2000s
		const match2 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
		if (match2?.[1] && match2[2] && match2[3]) {
			const day = Number.parseInt(match2[1], 10);
			const month = Number.parseInt(match2[2], 10) - 1;
			let year = Number.parseInt(match2[3], 10);
			// Convert 2-digit year to 4-digit (00-99 -> 2000-2099)
			year = year + 2000;
			const date = new Date(year, month, day);
			if (!Number.isNaN(date.getTime())) {
				return date;
			}
		}
	}

	if (format === "YYYY-MM-DD" || format === "yyyy-mm-dd") {
		const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
		if (match?.[1] && match[2] && match[3]) {
			const year = Number.parseInt(match[1], 10);
			const month = Number.parseInt(match[2], 10) - 1;
			const day = Number.parseInt(match[3], 10);
			const date = new Date(year, month, day);
			if (!Number.isNaN(date.getTime())) {
				return date;
			}
		}
	}

	if (format === "MM/DD/YYYY" || format === "mm/dd/yyyy") {
		const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (match?.[1] && match[2] && match[3]) {
			const month = Number.parseInt(match[1], 10) - 1;
			const day = Number.parseInt(match[2], 10);
			const year = Number.parseInt(match[3], 10);
			const date = new Date(year, month, day);
			if (!Number.isNaN(date.getTime())) {
				return date;
			}
		}
	}

	const genericDate = new Date(trimmed);
	if (!Number.isNaN(genericDate.getTime())) {
		return genericDate;
	}

	return null;
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
 * Processes a single row from the CSV stream.
 */
function processRow(
	rowIndex: number,
	values: string[],
	mapping: CsvColumnMapping,
	dateFormat: string,
	amountFormat: "decimal-comma" | "decimal-dot",
	errors: CsvParseError[],
): ParsedCsvRow | null {
	const dateValue = values[mapping.date] ?? "";
	const amountValue = values[mapping.amount] ?? "";
	const descriptionValue = values[mapping.description] ?? "";

	const date = parseDate(dateValue, dateFormat);
	if (!date) {
		errors.push({
			row: rowIndex,
			column: mapping.date,
			message: `Invalid date: "${dateValue}"`,
		});
		return null;
	}

	const amount = parseAmount(amountValue, amountFormat);
	if (amount === 0 && amountValue?.trim() !== "0") {
		errors.push({
			row: rowIndex,
			column: mapping.amount,
			message: `Invalid amount: "${amountValue}"`,
		});
		return null;
	}

	const description = normalizeText(descriptionValue || "Sem descrição");

	let type: "income" | "expense" = amount >= 0 ? "income" : "expense";

	if (mapping.type !== undefined) {
		const typeValue = values[mapping.type]?.toLowerCase();
		if (
			typeValue?.includes("credit") ||
			typeValue?.includes("credito") ||
			typeValue?.includes("crédito") ||
			typeValue?.includes("entrada")
		) {
			type = "income";
		} else if (
			typeValue?.includes("debit") ||
			typeValue?.includes("debito") ||
			typeValue?.includes("débito") ||
			typeValue?.includes("saida") ||
			typeValue?.includes("saída")
		) {
			type = "expense";
		}
	}

	return {
		rowIndex,
		date,
		amount: Math.abs(amount),
		description,
		type,
		raw: values,
	};
}

/**
 * Parses CSV content using streaming for better performance.
 * Supports progress callbacks for UI updates.
 */
export async function parseCsvContent(
	content: string,
	options?: CsvParseOptionsWithProgress,
): Promise<CsvParseResult> {
	const delimiter = options?.delimiter ?? detectDelimiter(content);
	const skipRows = options?.skipRows ?? 1;
	const onProgress = options?.onProgress;

	let headers: string[] = [];
	let detectedFormat: ReturnType<typeof detectBankFormat> = null;
	let columnMapping = options?.columnMapping;
	const rows: ParsedCsvRow[] = [];
	const errors: CsvParseError[] = [];
	let rowCount = 0;
	let processedRowCount = 0;

	// Number of data rows to skip after header (skipRows=1 means just header, skipRows=2 means header + 1 data row)
	const dataRowsToSkip = skipRows > 1 ? skipRows - 1 : 0;

	// Create async iterable from content
	const chunkIterable = createChunkIterable(content);

	// Stream parse the CSV
	for await (const event of parseStream(chunkIterable, {
		delimiter,
		hasHeaders: true,
		trimFields: true,
	})) {
		switch (event.type) {
			case "headers":
				headers = event.data;
				detectedFormat = detectBankFormat(headers);

				if (!columnMapping && detectedFormat) {
					columnMapping = detectedFormat.columnMapping;
				} else if (!columnMapping) {
					const suggested = suggestColumnMapping(headers);
					if (
						suggested.date !== null &&
						suggested.amount !== null &&
						suggested.description !== null
					) {
						columnMapping = {
							date: suggested.date,
							amount: suggested.amount,
							description: suggested.description,
						};
					}
				}

				onProgress?.({ type: "headers", headers });
				break;

			case "row": {
				rowCount++;

				// Skip data rows if needed (manual handling since library may not support skipRows in streaming)
				if (rowCount <= dataRowsToSkip) {
					continue;
				}

				// Calculate 1-indexed row number for the API (matches pre-streaming behavior)
				const displayRowIndex = rowCount;

				if (!columnMapping) {
					errors.push({
						row: displayRowIndex,
						message: "Column mapping not defined",
					});
					continue;
				}

				const dateFormat =
					options?.dateFormat ?? detectedFormat?.dateFormat ?? "DD/MM/YYYY";
				const amountFormat =
					options?.amountFormat ??
					detectedFormat?.amountFormat ??
					"decimal-comma";

				const parsedRow = processRow(
					displayRowIndex,
					event.data.fields,
					columnMapping,
					dateFormat,
					amountFormat,
					errors,
				);

				if (parsedRow) {
					if (
						!options?.selectedRows ||
						options.selectedRows.includes(displayRowIndex)
					) {
						rows.push(parsedRow);
					}
				}

				processedRowCount++;
				// Report progress every 100 rows
				if (processedRowCount % 100 === 0) {
					onProgress?.({ type: "progress", parsed: processedRowCount });
				}
				break;
			}

			case "complete":
				onProgress?.({
					type: "complete",
					totalParsed: rows.length,
					errors,
				});
				break;
		}
	}

	if (rowCount === 0 && headers.length === 0) {
		throw AppError.validation("CSV file is empty");
	}

	return {
		headers,
		rows,
		detectedFormat,
		errors,
		totalRows: rowCount,
	};
}

export function previewCsv(
	content: string,
	options?: { delimiter?: string; maxRows?: number },
): {
	headers: string[];
	sampleRows: string[][];
	detectedFormat: { id: string; name: string } | null;
	suggestedMapping: {
		date: number | null;
		amount: number | null;
		description: number | null;
	};
	totalRows: number;
	delimiter: string;
} {
	const delimiter = options?.delimiter ?? detectDelimiter(content);

	const csvDoc = parseOrThrow(content, {
		delimiter,
		hasHeaders: true,
		trimFields: true,
	});

	if (csvDoc.totalRows === 0 && !csvDoc.headers?.length) {
		throw AppError.validation("CSV file is empty");
	}

	const headers = csvDoc.headers ?? [];
	const detectedFormat = detectBankFormat(headers);
	const suggestedMapping = suggestColumnMapping(headers);

	const maxRows = options?.maxRows ?? 5;
	const sampleRows: string[][] = csvDoc.rows
		.slice(0, maxRows)
		.map((row) => row.fields);

	return {
		headers,
		sampleRows,
		detectedFormat: detectedFormat
			? { id: detectedFormat.id, name: detectedFormat.name }
			: null,
		suggestedMapping,
		totalRows: csvDoc.totalRows,
		delimiter,
	};
}
