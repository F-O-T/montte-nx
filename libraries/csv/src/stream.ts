import type {
	CSVDocument,
	ParsedRow,
	ParserState,
	StreamEvent,
	StreamOptions,
} from "./types.ts";
import { decodeBuffer, detectDelimiter } from "./utils.ts";

/**
 * Internal streaming parser state.
 */
interface StreamingParserState {
	state: ParserState;
	currentField: string;
	currentRow: string[];
	buffer: string;
	delimiter: string;
	delimiterDetected: boolean;
	headers: string[] | undefined;
	headersEmitted: boolean;
	rowIndex: number;
	hasHeaders: boolean;
	trimFields: boolean;
	skipRows: number;
	skippedRows: number;
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
 * Processes a chunk of CSV data and yields complete rows.
 * Maintains state between chunks to handle rows split across chunks.
 */
function* processChunk(
	chunk: string,
	parserState: StreamingParserState,
): Generator<StreamEvent> {
	parserState.buffer += chunk;

	// Detect delimiter from first chunk if not already done
	if (!parserState.delimiterDetected && parserState.buffer.length > 0) {
		parserState.delimiter = detectDelimiter(parserState.buffer);
		parserState.delimiterDetected = true;
	}

	const input = parserState.buffer;
	let processedUpTo = 0;

	for (let i = 0; i < input.length; i++) {
		const char = input[i] as string;
		const nextChar = input[i + 1];

		switch (parserState.state) {
			case "FIELD_START":
				if (char === '"') {
					parserState.state = "QUOTED_FIELD";
				} else if (char === parserState.delimiter) {
					parserState.currentRow.push(parserState.currentField);
					parserState.currentField = "";
				} else if (char === "\r" && nextChar === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					processedUpTo = i + 2;
					i++; // Skip \n
				} else if (char === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					processedUpTo = i + 1;
				} else {
					parserState.currentField += char;
					parserState.state = "UNQUOTED_FIELD";
				}
				break;

			case "UNQUOTED_FIELD":
				if (char === parserState.delimiter) {
					parserState.currentRow.push(parserState.currentField);
					parserState.currentField = "";
					parserState.state = "FIELD_START";
				} else if (char === "\r" && nextChar === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					parserState.state = "FIELD_START";
					processedUpTo = i + 2;
					i++; // Skip \n
				} else if (char === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					parserState.state = "FIELD_START";
					processedUpTo = i + 1;
				} else {
					parserState.currentField += char;
				}
				break;

			case "QUOTED_FIELD":
				if (char === '"') {
					parserState.state = "QUOTE_IN_QUOTED";
				} else {
					parserState.currentField += char;
				}
				break;

			case "QUOTE_IN_QUOTED":
				if (char === '"') {
					parserState.currentField += '"';
					parserState.state = "QUOTED_FIELD";
				} else if (char === parserState.delimiter) {
					parserState.currentRow.push(parserState.currentField);
					parserState.currentField = "";
					parserState.state = "FIELD_START";
				} else if (char === "\r" && nextChar === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					parserState.state = "FIELD_START";
					processedUpTo = i + 2;
					i++; // Skip \n
				} else if (char === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					parserState.state = "FIELD_START";
					processedUpTo = i + 1;
				} else {
					parserState.state = "FIELD_END";
				}
				break;

			case "FIELD_END":
				if (char === parserState.delimiter) {
					parserState.currentRow.push(parserState.currentField);
					parserState.currentField = "";
					parserState.state = "FIELD_START";
				} else if (char === "\r" && nextChar === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					parserState.state = "FIELD_START";
					processedUpTo = i + 2;
					i++; // Skip \n
				} else if (char === "\n") {
					parserState.currentRow.push(parserState.currentField);
					yield* emitRow(parserState);
					parserState.currentRow = [];
					parserState.currentField = "";
					parserState.state = "FIELD_START";
					processedUpTo = i + 1;
				}
				break;
		}
	}

	// Keep unprocessed data in buffer for next chunk
	// Only keep data that's part of an incomplete row
	if (parserState.state === "QUOTED_FIELD") {
		// We're in a quoted field, need to keep everything from start of current field
		// For simplicity, keep entire buffer minus processed complete rows
		parserState.buffer = input.slice(processedUpTo);
	} else {
		parserState.buffer = input.slice(processedUpTo);
	}
}

/**
 * Emits a row event, handling headers and skip logic.
 */
function* emitRow(parserState: StreamingParserState): Generator<StreamEvent> {
	// Skip initial rows if requested
	if (parserState.skippedRows < parserState.skipRows) {
		parserState.skippedRows++;
		return;
	}

	// Handle headers
	if (parserState.hasHeaders && !parserState.headersEmitted) {
		parserState.headers = parserState.trimFields
			? parserState.currentRow.map((h) => h.trim())
			: [...parserState.currentRow];
		parserState.headersEmitted = true;
		yield { type: "headers", data: parserState.headers };
		return;
	}

	// Skip empty rows
	if (
		parserState.currentRow.length === 1 &&
		parserState.currentRow[0] === ""
	) {
		return;
	}

	// Emit data row
	const row = createParsedRow(
		parserState.currentRow,
		parserState.rowIndex,
		parserState.headers,
		parserState.trimFields,
	);
	parserState.rowIndex++;
	yield { type: "row", data: row };
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
	const parserState: StreamingParserState = {
		state: "FIELD_START",
		currentField: "",
		currentRow: [],
		buffer: "",
		delimiter: options?.delimiter ?? ",",
		delimiterDetected: !!options?.delimiter,
		headers: undefined,
		headersEmitted: false,
		rowIndex: 0,
		hasHeaders: options?.hasHeaders ?? false,
		trimFields: options?.trimFields ?? false,
		skipRows: options?.skipRows ?? 0,
		skippedRows: 0,
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
	if (
		parserState.buffer.length > 0 ||
		parserState.currentField !== "" ||
		parserState.currentRow.length > 0
	) {
		// Add final field to current row
		if (parserState.currentField !== "" || parserState.currentRow.length > 0) {
			parserState.currentRow.push(parserState.currentField);
			yield* emitRow(parserState);
		}
	}

	// Emit completion event
	yield { type: "complete", rowCount: parserState.rowIndex };
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
				// Done
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
