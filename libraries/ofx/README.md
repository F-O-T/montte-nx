# @fot/ofx

Type-safe OFX (Open Financial Exchange) parser with Zod schema validation.

## Installation

```bash
bun add @fot/ofx
```

## Quick Start

```typescript
import { parse, parseBuffer, getTransactions, getBalance } from "@fot/ofx";
import { readFileSync } from "node:fs";

// For files with known UTF-8 encoding
const ofxContent = readFileSync("statement.ofx", "utf-8");
const result = parse(ofxContent);

// For files with unknown encoding (recommended for Brazilian banks)
const buffer = readFileSync("statement.ofx");
const result = parseBuffer(new Uint8Array(buffer));

if (result.success) {
  const transactions = getTransactions(result.data);
  const balances = getBalance(result.data);

  for (const txn of transactions) {
    console.log(`${txn.DTPOSTED.toDate()} - ${txn.NAME}: ${txn.TRNAMT}`);
  }
}
```

## API Reference

### Parsing Functions

#### `parse(content: string): ParseResult<OFXDocument>`

Parses an OFX file content and returns a result object.

```typescript
const result = parse(ofxContent);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### `parseOrThrow(content: string): OFXDocument`

Parses an OFX file content and throws on validation errors.

```typescript
try {
  const doc = parseOrThrow(ofxContent);
} catch (error) {
  // ZodError
}
```

#### `parseBuffer(buffer: Uint8Array): ParseResult<OFXDocument>`

Parses an OFX file from binary data with automatic encoding detection. This is the recommended method for files from Brazilian banks or any file with non-UTF-8 encoding.

```typescript
import { readFileSync } from "node:fs";

const buffer = readFileSync("extrato.ofx");
const result = parseBuffer(new Uint8Array(buffer));

if (result.success) {
  // Portuguese characters like "Cartão" are correctly preserved
  console.log(result.data);
}
```

#### `parseBufferOrThrow(buffer: Uint8Array): OFXDocument`

Parses an OFX file from binary data and throws on validation errors.

```typescript
const buffer = readFileSync("extrato.ofx");
const doc = parseBufferOrThrow(new Uint8Array(buffer));
```

### Extraction Functions

#### `getTransactions(document: OFXDocument): OFXTransaction[]`

Extracts all transactions from bank and credit card statements.

```typescript
const transactions = getTransactions(doc);

for (const txn of transactions) {
  console.log({
    type: txn.TRNTYPE,
    amount: txn.TRNAMT,
    date: txn.DTPOSTED.toDate(),
    name: txn.NAME,
    memo: txn.MEMO,
  });
}
```

#### `getAccountInfo(document: OFXDocument): (OFXBankAccount | OFXCreditCardAccount)[]`

Extracts account information from the document.

```typescript
const accounts = getAccountInfo(doc);

for (const account of accounts) {
  console.log({
    accountId: account.ACCTID,
    bankId: "BANKID" in account ? account.BANKID : undefined,
    type: "ACCTTYPE" in account ? account.ACCTTYPE : "CREDIT_CARD",
  });
}
```

#### `getBalance(document: OFXDocument): BalanceInfo[]`

Extracts balance information (ledger and available).

```typescript
const balances = getBalance(doc);

for (const balance of balances) {
  console.log({
    ledger: balance.ledger?.BALAMT,
    available: balance.available?.BALAMT,
    asOf: balance.ledger?.DTASOF.toDate(),
  });
}
```

#### `getSignOnInfo(document: OFXDocument): OFXSignOnResponse`

Extracts sign-on response information.

```typescript
const signOn = getSignOnInfo(doc);

console.log({
  status: signOn.STATUS.CODE,
  serverDate: signOn.DTSERVER.toDate(),
  language: signOn.LANGUAGE,
  institution: signOn.FI?.ORG,
});
```

### Generation Functions

#### `generateBankStatement(options: GenerateBankStatementOptions): string`

Generates a complete OFX bank statement file.

```typescript
import { generateBankStatement } from "@fot/ofx";

const statement = generateBankStatement({
  bankId: "123456",
  accountId: "987654321",
  accountType: "CHECKING",
  currency: "USD",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
  transactions: [
    {
      type: "CREDIT",
      datePosted: new Date(),
      amount: 1000,
      fitId: "1",
      name: "Deposit",
    },
  ],
});

console.log(statement);
```

#### `generateCreditCardStatement(options: GenerateCreditCardStatementOptions): string`

Generates a complete OFX credit card statement file.

```typescript
import { generateCreditCardStatement } from "@fot/ofx";

const statement = generateCreditCardStatement({
  accountId: "123456789",
  currency: "USD",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
  transactions: [
    {
      type: "DEBIT",
      datePosted: new Date(),
      amount: -75.5,
      fitId: "2",
      name: "Purchase at a store",
    },
  ],
});

console.log(statement);
```

### Streaming Functions

For processing large OFX files with low memory footprint.

#### `parseStream(input): AsyncGenerator<StreamEvent>`

Parses an OFX file as a stream, yielding events as they are parsed.

```typescript
import { parseStream } from "@fot/ofx";

// From a ReadableStream (e.g., fetch response)
const response = await fetch("https://example.com/statement.ofx");
for await (const event of parseStream(response.body)) {
  switch (event.type) {
    case "header":
      console.log("OFX Version:", event.data.VERSION);
      break;
    case "account":
      console.log("Account:", event.data.ACCTID);
      break;
    case "transaction":
      console.log("Transaction:", event.data.NAME, event.data.TRNAMT);
      break;
    case "balance":
      console.log("Ledger Balance:", event.data.ledger?.BALAMT);
      break;
    case "complete":
      console.log("Total transactions:", event.transactionCount);
      break;
  }
}
```

#### `parseStreamToArray(input): Promise<StreamResult>`

Collects all stream events into arrays for easier processing.

```typescript
import { parseStreamToArray } from "@fot/ofx";

const response = await fetch("https://example.com/statement.ofx");
const result = await parseStreamToArray(response.body);

console.log("Header:", result.header);
console.log("Transactions:", result.transactions.length);
console.log("Accounts:", result.accounts);
console.log("Balances:", result.balances);
```

### Batch Streaming Functions

For processing multiple OFX files in a single operation with progress tracking.

#### `parseBatchStream(files): AsyncGenerator<BatchStreamEvent>`

Parses multiple OFX files sequentially, yielding events as they are parsed. Ideal for importing multiple bank statements at once.

```typescript
import { parseBatchStream, type BatchFileInput } from "@fot/ofx";
import { readFileSync } from "node:fs";

const files: BatchFileInput[] = [
  { filename: "january.ofx", buffer: new Uint8Array(readFileSync("january.ofx")) },
  { filename: "february.ofx", buffer: new Uint8Array(readFileSync("february.ofx")) },
  { filename: "march.ofx", buffer: new Uint8Array(readFileSync("march.ofx")) },
];

for await (const event of parseBatchStream(files)) {
  switch (event.type) {
    case "file_start":
      console.log(`Processing: ${event.filename}`);
      break;
    case "transaction":
      console.log(`File ${event.fileIndex}: ${event.data.NAME} - ${event.data.TRNAMT}`);
      break;
    case "file_complete":
      console.log(`Completed ${event.filename}: ${event.transactionCount} transactions`);
      break;
    case "file_error":
      console.error(`Error in ${event.filename}: ${event.error}`);
      break;
    case "batch_complete":
      console.log(`Batch done: ${event.totalTransactions} transactions from ${event.totalFiles} files`);
      break;
  }
}
```

#### `parseBatchStreamToArray(files): Promise<BatchParsedFile[]>`

Collects all batch results into an array for easier processing.

```typescript
import { parseBatchStreamToArray } from "@fot/ofx";

const results = await parseBatchStreamToArray(files);

for (const file of results) {
  console.log(`${file.filename}: ${file.transactions.length} transactions`);
  if (file.error) {
    console.error(`  Error: ${file.error}`);
  }
}
```

## Encoding Support

The library automatically detects and handles various character encodings commonly used in OFX files, especially from Brazilian banks.

### Supported Charsets

| OFX CHARSET Value | Encoding Used |
| ----------------- | ------------- |
| `1252`, `WINDOWS-1252`, `CP1252` | windows-1252 |
| `8859-1`, `ISO-8859-1`, `LATIN1`, `LATIN-1` | iso-8859-1 |
| `UTF-8`, `UTF8`, `NONE`, (empty) | utf-8 |

### UTF-8 Auto-Detection

Some OFX files declare `CHARSET:1252` but are actually encoded as UTF-8. The library automatically detects this and uses UTF-8 when appropriate, ensuring characters like `Transação` are correctly preserved.

### Best Practices

For files from Brazilian banks or any file with unknown encoding, use `parseBuffer()` instead of `parse()`:

```typescript
import { parseBuffer } from "@fot/ofx";
import { readFileSync } from "node:fs";

// Correct: Read as binary, let the library detect encoding
const buffer = readFileSync("extrato.ofx");
const result = parseBuffer(new Uint8Array(buffer));

// Avoid: Reading as UTF-8 string may corrupt Windows-1252 characters
// const content = readFileSync("extrato.ofx", "utf-8");
// const result = parse(content);
```

## Types

### OFXTransaction

```typescript
interface OFXTransaction {
  TRNTYPE: OFXTransactionType;
  DTPOSTED: OFXDate;
  TRNAMT: number;
  FITID?: string; // Optional, auto-generated if missing
  NAME?: string;
  MEMO?: string;
  CHECKNUM?: string;
  REFNUM?: string;
  DTUSER?: OFXDate;
  DTAVAIL?: OFXDate;
  CORRECTFITID?: string;
  CORRECTACTION?: "DELETE" | "REPLACE";
  SRVRTID?: string;
  SIC?: string;
  PAYEEID?: string;
  CURRENCY?: string;
}
```

### OFXTransactionType

```typescript
type OFXTransactionType =
  | "CREDIT"
  | "DEBIT"
  | "INT"
  | "DIV"
  | "FEE"
  | "SRVCHG"
  | "DEP"
  | "ATM"
  | "POS"
  | "XFER"
  | "CHECK"
  | "PAYMENT"
  | "CASH"
  | "DIRECTDEP"
  | "DIRECTDEBIT"
  | "REPEATPMT"
  | "HOLD"
  | "OTHER";
```

### OFXDate

```typescript
interface OFXDate {
  raw: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: { offset: number; name: string };
  toDate(): Date;
}
```

### OFXBankAccount

```typescript
interface OFXBankAccount {
  ACCTID: string;
  BANKID: string;
  ACCTTYPE: "CHECKING" | "SAVINGS" | "MONEYMRKT" | "CREDITLINE" | "CD";
  BRANCHID?: string;
  ACCTKEY?: string;
}
```

### OFXCreditCardAccount

```typescript
interface OFXCreditCardAccount {
  ACCTID: string;
  ACCTKEY?: string;
}
```

### OFXBalance

```typescript
interface OFXBalance {
  BALAMT: number;
  DTASOF: OFXDate;
}
```

### BalanceInfo

```typescript
interface BalanceInfo {
  ledger?: OFXBalance;
  available?: OFXBalance;
}
```

### StreamEvent

```typescript
type StreamEvent =
  | { type: "header"; data: OFXHeader }
  | { type: "transaction"; data: OFXTransaction }
  | { type: "account"; data: OFXBankAccount | OFXCreditCardAccount }
  | { type: "balance"; data: { ledger?: OFXBalance; available?: OFXBalance } }
  | { type: "complete"; transactionCount: number };
```

## Validation & Schemas

All parsing and generation functions use Zod schemas for runtime validation, ensuring type safety and data integrity.

### Input Validation for Generation

When generating OFX files, you can validate your inputs using the exported schemas:

```typescript
import {
  generateBankStatement,
  generateBankStatementOptionsSchema,
  type GenerateBankStatementOptions,
} from "@fot/ofx";

// Validate options before generating
const options: GenerateBankStatementOptions = {
  bankId: "123456",
  accountId: "987654321",
  accountType: "CHECKING",
  currency: "USD",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
  transactions: [],
};

// Runtime validation
const validatedOptions = generateBankStatementOptionsSchema.parse(options);
const statement = generateBankStatement(validatedOptions);
```

### Available Schemas

All Zod schemas are exported for custom validation and extension:

```typescript
import {
  transactionSchema,
  bankAccountSchema,
  ofxDocumentSchema,
} from "@fot/ofx";

// Extend schemas for custom validation
const customTransactionSchema = transactionSchema.extend({
  customField: z.string(),
});
```

**Parsing Schemas:**
- `ofxDocumentSchema` - Complete OFX document
- `ofxHeaderSchema` - OFX file header
- `ofxResponseSchema` - OFX response body
- `transactionSchema` - Individual transaction
- `transactionTypeSchema` - Transaction type enum
- `transactionListSchema` - List of transactions
- `bankAccountSchema` - Bank account information
- `creditCardAccountSchema` - Credit card account information
- `accountTypeSchema` - Account type enum
- `balanceSchema` - Balance information
- `statusSchema` - Status response
- `financialInstitutionSchema` - Financial institution info
- `signOnResponseSchema` - Sign-on response
- `ofxDateSchema` - OFX date with timezone

**Generation Schemas:**
- `generateHeaderOptionsSchema` - OFX header generation options
- `generateTransactionInputSchema` - Transaction input for generation
- `generateBankStatementOptionsSchema` - Bank statement generation options
- `generateCreditCardStatementOptionsSchema` - Credit card statement generation options

## Security

This library includes several security features to protect against malicious OFX files:

### Prototype Pollution Protection

The SGML parser is protected against prototype pollution attacks. Malicious OFX files attempting to inject `__proto__`, `constructor`, or `prototype` tags are safely ignored, preventing potential remote code execution.

### Input Validation

All parsing functions validate input data against strict Zod schemas, rejecting malformed or invalid OFX data before processing. This prevents:
- Type confusion attacks
- Invalid date/number formats
- Missing required fields
- Unexpected data structures

### Safe Entity Decoding

HTML entities in OFX text fields are decoded using a whitelist approach, preventing XSS-style attacks through crafted entity sequences

## Performance

Tested on realistic business statement sizes:

| Transactions | File Size | Parse Time |
| ------------ | --------- | ---------- |
| ~5,000       | 1.2 MB    | ~37ms      |
| ~10,000      | 2.5 MB    | ~108ms     |
| ~25,000      | 5.4 MB    | ~230ms     |
| ~50,000      | 10.4 MB   | ~450ms     |

Extraction operations (`getTransactions`, `getBalance`, etc.) are sub-millisecond even on large datasets.

### Streaming Performance

The streaming API achieves ~55,000-66,000 transactions/sec throughput with minimal memory overhead, making it ideal for processing very large files or network streams.

## License

MIT
