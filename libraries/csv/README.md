# @f-o-t/csv

RFC 4180 compliant CSV parser with streaming support for JavaScript/TypeScript.

## Features

- RFC 4180 compliant parsing (handles quoted fields, multiline values, escaped quotes)
- Streaming API for memory-efficient processing of large files
- Automatic delimiter detection
- Automatic encoding detection (UTF-8, UTF-16, Windows-1252, ISO-8859-1)
- CSV generation with proper escaping
- **Security hardened** - protected against prototype pollution and memory exhaustion attacks
- **Zod validation** - runtime validation of all options with exported schemas
- Full TypeScript support with Zod-inferred types
- Works in Bun, Node.js, and browsers

## Installation

```bash
bun add @f-o-t/csv
# or
npm install @f-o-t/csv
```

## Quick Start

### Parsing CSV

```typescript
import { parseOrThrow, parse } from "@f-o-t/csv";

// Parse with error throwing
const doc = parseOrThrow(csvContent, {
  hasHeaders: true,
  trimFields: true,
});

console.log(doc.headers);    // ["name", "age", "city"]
console.log(doc.rows[0]);    // { rowIndex: 0, fields: ["John", "30", "NYC"], record: { name: "John", age: "30", city: "NYC" } }
console.log(doc.totalRows);  // number of data rows

// Safe parsing (returns Result type)
const result = parse(csvContent);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Streaming Parser

For large files, use the streaming API to process rows as they're parsed:

```typescript
import { parseStream } from "@f-o-t/csv";

async function processLargeFile(content: string) {
  const chunks = async function* () {
    yield content;
  };

  for await (const event of parseStream(chunks(), { hasHeaders: true })) {
    switch (event.type) {
      case "headers":
        console.log("Headers:", event.data);
        break;
      case "row":
        console.log("Row:", event.data.rowIndex, event.data.fields);
        break;
      case "complete":
        console.log("Total rows:", event.rowCount);
        break;
    }
  }
}
```

### Generating CSV

```typescript
import { generate, generateFromObjects } from "@f-o-t/csv";

// From array of arrays
const csv = generate({
  headers: ["name", "age", "city"],
  rows: [
    ["John", "30", "NYC"],
    ["Jane", "25", "LA"],
  ],
});

// From array of objects
const csvFromObjects = generateFromObjects(
  [
    { name: "John", age: 30, city: "NYC" },
    { name: "Jane", age: 25, city: "LA" },
  ],
  { delimiter: "," }
);
```

## API Reference

### Parsing Functions

#### `parse(content, options?)`
Parses CSV content, returning a `ParseResult<CSVDocument>`.

#### `parseOrThrow(content, options?)`
Parses CSV content, throwing on error.

#### `parseBuffer(buffer, options?)`
Parses a binary buffer with automatic encoding detection.

#### `parseBufferOrThrow(buffer, options?)`
Parses a binary buffer, throwing on error.

#### `parseToArray(content, options?)`
Parses and returns just the data as a 2D array.

### Streaming Functions

#### `parseStream(chunks, options?)`
Returns an async generator yielding `StreamEvent` objects.

#### `parseBufferStream(buffer, options?)`
Streams parsing from a binary buffer.

#### `parseStreamToArray(chunks, options?)`
Streams parsing and collects all rows into an array.

### Batch Streaming Functions

For processing multiple CSV files in a single operation with progress tracking.

#### `parseBatchStream(files, options?)`

Parses multiple CSV files sequentially, yielding events as they are parsed. Ideal for importing multiple spreadsheets at once.

```typescript
import { parseBatchStream, type BatchCsvFileInput } from "@f-o-t/csv";
import { readFileSync } from "node:fs";

const files: BatchCsvFileInput[] = [
  { filename: "january.csv", content: readFileSync("january.csv", "utf-8") },
  { filename: "february.csv", content: readFileSync("february.csv", "utf-8") },
  { filename: "march.csv", content: readFileSync("march.csv", "utf-8") },
];

for await (const event of parseBatchStream(files, { hasHeaders: true })) {
  switch (event.type) {
    case "file_start":
      console.log(`Processing: ${event.filename}`);
      break;
    case "headers":
      console.log(`File ${event.fileIndex} headers:`, event.data);
      break;
    case "row":
      console.log(`File ${event.fileIndex}, Row ${event.data.rowIndex}:`, event.data.fields);
      break;
    case "file_complete":
      console.log(`Completed ${event.filename}: ${event.rowCount} rows`);
      break;
    case "file_error":
      console.error(`Error in ${event.filename}: ${event.error}`);
      break;
    case "batch_complete":
      console.log(`Batch done: ${event.totalRows} rows from ${event.totalFiles} files`);
      break;
  }
}
```

#### `parseBatchStreamToArray(files, options?)`

Collects all batch results into an array for easier processing.

```typescript
import { parseBatchStreamToArray } from "@f-o-t/csv";

const results = await parseBatchStreamToArray(files, { hasHeaders: true });

for (const file of results) {
  console.log(`${file.filename}: ${file.rows.length} rows`);
  if (file.headers) {
    console.log(`  Headers: ${file.headers.join(", ")}`);
  }
  if (file.error) {
    console.error(`  Error: ${file.error}`);
  }
}
```

### Generation Functions

#### `generate(options)`
Generates CSV string from headers and row arrays.

#### `generateFromObjects(objects, options?)`
Generates CSV from an array of objects.

#### `generateRow(fields, options?)`
Generates a single CSV row.

#### `createGenerator(options?)`
Creates a generator instance for incremental CSV building.

### Utility Functions

#### `detectDelimiter(content)`
Auto-detects the delimiter used in CSV content.

#### `detectEncoding(buffer)`
Detects the encoding of a binary buffer.

#### `decodeBuffer(buffer, encoding?)`
Decodes a buffer to string with specified or auto-detected encoding.

#### `escapeField(field, options?)`
Properly escapes a field value for CSV output.

#### `needsQuoting(field, delimiter?)`
Checks if a field needs to be quoted.

## Security

This library is hardened against common CSV-based attacks:

### Prototype Pollution Prevention

Malicious CSV files with headers like `__proto__`, `constructor`, or `prototype` cannot pollute object prototypes. The `record` object in parsed rows uses `Object.create(null)` and dangerous property names are filtered.

```typescript
// Safe - malicious headers are ignored
const csv = "__proto__,constructor,name\nmalicious,evil,safe";
const doc = parseOrThrow(csv, { hasHeaders: true });
// doc.rows[0].record = { name: "safe" } - dangerous headers excluded
```

### Memory Exhaustion Protection

The streaming parser includes a configurable buffer size limit to prevent denial-of-service attacks via malformed CSV files with unclosed quoted fields.

```typescript
// Default limit is 10MB
import { DEFAULT_MAX_BUFFER_SIZE } from "@f-o-t/csv";

// Custom limit for large fields
for await (const event of parseStream(chunks, {
  maxBufferSize: 50 * 1024 * 1024, // 50MB
})) {
  // ...
}
```

## Types

All types are derived from Zod schemas and can be used for runtime validation.

```typescript
import {
  parseOptionsSchema,
  streamOptionsSchema,
  generateOptionsSchema,
  type ParseOptions,
  type StreamOptions,
} from "@f-o-t/csv";

// Validate options at runtime
const options = parseOptionsSchema.parse(userInput);
```

### Core Types

```typescript
interface ParseOptions {
  delimiter?: string;      // Field delimiter (default: auto-detect)
  skipRows?: number;       // Skip first N rows (default: 0)
  hasHeaders?: boolean;    // Treat first row as headers (default: false)
  trimFields?: boolean;    // Trim whitespace from fields (default: false)
  columns?: string[];      // Column names if hasHeaders is false
}

interface StreamOptions extends ParseOptions {
  chunkSize?: number;      // Chunk size for processing (default: 64KB)
  maxBufferSize?: number;  // Max buffer size in bytes (default: 10MB)
}

interface CSVDocument {
  headers?: string[];      // Header row if hasHeaders was true
  rows: ParsedRow[];       // Parsed rows
  delimiter: string;       // Detected or specified delimiter
  totalRows: number;       // Total row count (excluding headers)
}

interface ParsedRow {
  rowIndex: number;                    // 0-indexed row number
  fields: string[];                    // Field values as array
  record?: Record<string, string>;     // Keyed object if headers enabled
}

type StreamEvent =
  | { type: "headers"; data: string[] }
  | { type: "row"; data: ParsedRow }
  | { type: "complete"; rowCount: number };

interface GenerateOptions {
  delimiter?: string;                  // Field delimiter (default: ',')
  lineEnding?: "\n" | "\r\n";          // Line ending (default: '\n')
  includeHeaders?: boolean;            // Include headers row
  alwaysQuote?: boolean;               // Always quote all fields
}

// Batch streaming types
interface BatchCsvFileInput {
  filename: string;                    // File name for tracking
  content: string;                     // CSV content as string
}

type BatchCsvStreamEvent =
  | { type: "file_start"; fileIndex: number; filename: string }
  | { type: "headers"; fileIndex: number; data: string[] }
  | { type: "row"; fileIndex: number; data: ParsedRow }
  | { type: "file_complete"; fileIndex: number; filename: string; rowCount: number }
  | { type: "file_error"; fileIndex: number; filename: string; error: string }
  | { type: "batch_complete"; totalFiles: number; totalRows: number; errorCount: number };

interface BatchParsedCsvFile {
  filename: string;                    // Original filename
  headers?: string[];                  // Headers if hasHeaders was true
  rows: ParsedRow[];                   // All parsed rows
  error?: string;                      // Error message if parsing failed
}
```

### Available Zod Schemas

All schemas are exported for runtime validation:

```typescript
import {
  // Option schemas
  parseOptionsSchema,
  streamOptionsSchema,
  generateOptionsSchema,

  // Data schemas
  parsedRowSchema,
  csvDocumentSchema,

  // Event schemas
  streamEventSchema,
  batchCsvFileInputSchema,
  batchCsvStreamEventSchema,
  batchParsedCsvFileSchema,

  // Constants
  DEFAULT_MAX_BUFFER_SIZE,
} from "@f-o-t/csv";
```

## RFC 4180 Compliance

This parser fully implements RFC 4180:

- Fields containing line breaks, commas, or double quotes are enclosed in double-quotes
- Double quotes within fields are escaped by doubling them (`""`)
- Handles CRLF and LF line endings
- Properly handles multiline fields within quotes

## License

MIT
