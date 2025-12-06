# @fot/ofx

Type-safe OFX (Open Financial Exchange) parser with Zod schema validation.

## Installation

```bash
bun add @fot/ofx
```

## Quick Start

```typescript
import { parse, getTransactions, getBalance } from "@fot/ofx";

const ofxContent = fs.readFileSync("statement.ofx", "utf-8");
const result = parse(ofxContent);

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

## Types

### OFXTransaction

```typescript
interface OFXTransaction {
  TRNTYPE: OFXTransactionType;
  DTPOSTED: OFXDate;
  TRNAMT: number;
  FITID: string;
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

## Schemas

All Zod schemas are exported for custom validation:

```typescript
import { schemas } from "@fot/ofx";

const customTransactionSchema = schemas.transaction.extend({
  customField: z.string(),
});
```

Available schemas:

- `schemas.transaction`
- `schemas.transactionType`
- `schemas.transactionList`
- `schemas.bankAccount`
- `schemas.creditCardAccount`
- `schemas.accountType`
- `schemas.balance`
- `schemas.status`
- `schemas.financialInstitution`
- `schemas.signOnResponse`
- `schemas.bankStatementResponse`
- `schemas.creditCardStatementResponse`
- `schemas.ofxDocument`
- `schemas.ofxHeader`
- `schemas.ofxResponse`
- `schemas.ofxDate`

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
