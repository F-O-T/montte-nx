import type {
	CSVDocument,
	ParseOptions,
	ParseResult,
	ParsedRow,
	ParserState,
} from "./types.ts";
import { decodeBuffer, detectDelimiter } from "./utils.ts";

/**
 * Parses raw CSV content into a 2D array of strings using a state machine.
 * Handles RFC 4180 edge cases including:
 * - Quoted fields with embedded delimiters
 * - Escaped quotes (doubled quotes)
 * - Newlines within quoted fields (both LF and CRLF)
 * - Mixed line endings
 *
 * @param input - The CSV string to parse
 * @param delimiter - The field delimiter to use
 * @returns A 2D array of field values
 */
function parseRawCSV(input: string, delimiter: string): string[][] {
	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentField = "";
	let state: ParserState = "FIELD_START";

	for (let i = 0; i < input.length; i++) {
		const char = input[i] as string;
		const nextChar = input[i + 1];

		switch (state) {
			case "FIELD_START":
				if (char === '"') {
					state = "QUOTED_FIELD";
				} else if (char === delimiter) {
					currentRow.push(currentField);
					currentField = "";
					// Stay in FIELD_START for next field
				} else if (char === "\r" && nextChar === "\n") {
					currentRow.push(currentField);
					if (currentRow.length > 0 || currentField !== "") {
						rows.push(currentRow);
					}
					currentRow = [];
					currentField = "";
					i++; // Skip \n
				} else if (char === "\n") {
					currentRow.push(currentField);
					if (currentRow.length > 0 || currentField !== "") {
						rows.push(currentRow);
					}
					currentRow = [];
					currentField = "";
				} else {
					currentField += char;
					state = "UNQUOTED_FIELD";
				}
				break;

			case "UNQUOTED_FIELD":
				if (char === delimiter) {
					currentRow.push(currentField);
					currentField = "";
					state = "FIELD_START";
				} else if (char === "\r" && nextChar === "\n") {
					currentRow.push(currentField);
					rows.push(currentRow);
					currentRow = [];
					currentField = "";
					state = "FIELD_START";
					i++; // Skip \n
				} else if (char === "\n") {
					currentRow.push(currentField);
					rows.push(currentRow);
					currentRow = [];
					currentField = "";
					state = "FIELD_START";
				} else {
					currentField += char;
				}
				break;

			case "QUOTED_FIELD":
				if (char === '"') {
					state = "QUOTE_IN_QUOTED";
				} else {
					// Newlines inside quotes are kept as-is (including \r\n)
					currentField += char;
				}
				break;

			case "QUOTE_IN_QUOTED":
				if (char === '"') {
					// Escaped quote ("" -> ")
					currentField += '"';
					state = "QUOTED_FIELD";
				} else if (char === delimiter) {
					// End of quoted field, followed by delimiter
					currentRow.push(currentField);
					currentField = "";
					state = "FIELD_START";
				} else if (char === "\r" && nextChar === "\n") {
					// End of quoted field, followed by CRLF
					currentRow.push(currentField);
					rows.push(currentRow);
					currentRow = [];
					currentField = "";
					state = "FIELD_START";
					i++; // Skip \n
				} else if (char === "\n") {
					// End of quoted field, followed by LF
					currentRow.push(currentField);
					rows.push(currentRow);
					currentRow = [];
					currentField = "";
					state = "FIELD_START";
				} else {
					// Characters after closing quote but before delimiter (non-strict)
					// Some parsers ignore these, we'll keep them for compatibility
					state = "FIELD_END";
				}
				break;

			case "FIELD_END":
				if (char === delimiter) {
					currentRow.push(currentField);
					currentField = "";
					state = "FIELD_START";
				} else if (char === "\r" && nextChar === "\n") {
					currentRow.push(currentField);
					rows.push(currentRow);
					currentRow = [];
					currentField = "";
					state = "FIELD_START";
					i++; // Skip \n
				} else if (char === "\n") {
					currentRow.push(currentField);
					rows.push(currentRow);
					currentRow = [];
					currentField = "";
					state = "FIELD_START";
				}
				// Ignore other characters after closing quote
				break;
		}
	}

	// Handle final field/row
	if (currentField !== "" || currentRow.length > 0) {
		currentRow.push(currentField);
		rows.push(currentRow);
	}

	return rows;
}

/**
 * Creates a ParsedRow from raw field values.
 */
function createParsedRow(
	fields: string[],
	rowIndex: number,
	headers: string[] | undefined,
	trimFields: boolean,
): ParsedRow {
	const processedFields = trimFields ? fields.map((f) => f.trim()) : fields;

	const row: ParsedRow = {
		rowIndex,
		fields: processedFields,
	};

	if (headers) {
		row.record = {};
		for (let i = 0; i < headers.length; i++) {
			const header = headers[i];
			if (header !== undefined) {
				row.record[header] = processedFields[i] ?? "";
			}
		}
	}

	return row;
}

/**
 * Parses CSV content and returns a result object.
 *
 * @param content - The CSV string to parse
 * @param options - Parsing options
 * @returns A ParseResult containing either the parsed document or an error
 */
export function parse(
	content: string,
	options?: ParseOptions,
): ParseResult<CSVDocument> {
	try {
		const data = parseOrThrow(content, options);
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Parses CSV content and throws on error.
 *
 * @param content - The CSV string to parse
 * @param options - Parsing options
 * @returns The parsed CSV document
 * @throws Error if parsing fails
 */
export function parseOrThrow(
	content: string,
	options?: ParseOptions,
): CSVDocument {
	const delimiter = options?.delimiter ?? detectDelimiter(content);
	const skipRows = options?.skipRows ?? 0;
	const hasHeaders = options?.hasHeaders ?? false;
	const trimFields = options?.trimFields ?? false;
	const customColumns = options?.columns;

	// Parse raw CSV
	const rawRows = parseRawCSV(content, delimiter);

	// Handle empty content
	if (rawRows.length === 0) {
		return {
			headers: hasHeaders ? [] : undefined,
			rows: [],
			delimiter,
			totalRows: 0,
		};
	}

	// Skip rows if requested
	const dataRows = rawRows.slice(skipRows);

	if (dataRows.length === 0) {
		return {
			headers: hasHeaders ? [] : undefined,
			rows: [],
			delimiter,
			totalRows: 0,
		};
	}

	// Extract headers
	let headers: string[] | undefined;
	let startIndex = 0;

	if (hasHeaders) {
		const headerRow = dataRows[0];
		if (headerRow) {
			headers = trimFields ? headerRow.map((h) => h.trim()) : headerRow;
			startIndex = 1;
		}
	} else if (customColumns) {
		headers = customColumns;
	}

	// Build parsed rows
	const parsedRows: ParsedRow[] = [];

	for (let i = startIndex; i < dataRows.length; i++) {
		const rawRow = dataRows[i];
		if (rawRow) {
			// Skip completely empty rows (single empty field)
			if (rawRow.length === 1 && rawRow[0] === "") {
				continue;
			}
			parsedRows.push(
				createParsedRow(rawRow, skipRows + i, headers, trimFields),
			);
		}
	}

	return {
		headers,
		rows: parsedRows,
		delimiter,
		totalRows: parsedRows.length,
	};
}

/**
 * Parses CSV from a buffer with automatic encoding detection.
 *
 * @param buffer - The buffer containing CSV data
 * @param options - Parsing options
 * @returns A ParseResult containing either the parsed document or an error
 */
export function parseBuffer(
	buffer: Uint8Array,
	options?: ParseOptions,
): ParseResult<CSVDocument> {
	try {
		const data = parseBufferOrThrow(buffer, options);
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Parses CSV from a buffer with automatic encoding detection.
 * Throws on error.
 *
 * @param buffer - The buffer containing CSV data
 * @param options - Parsing options
 * @returns The parsed CSV document
 * @throws Error if parsing fails
 */
export function parseBufferOrThrow(
	buffer: Uint8Array,
	options?: ParseOptions,
): CSVDocument {
	const content = decodeBuffer(buffer);
	return parseOrThrow(content, options);
}

/**
 * Parses CSV content and returns raw 2D array without metadata.
 * Useful for simple use cases that don't need the full document structure.
 *
 * @param content - The CSV string to parse
 * @param delimiter - The delimiter to use (default: auto-detect)
 * @returns A 2D array of field values
 */
export function parseToArray(content: string, delimiter?: string): string[][] {
	const effectiveDelimiter = delimiter ?? detectDelimiter(content);
	return parseRawCSV(content, effectiveDelimiter);
}
