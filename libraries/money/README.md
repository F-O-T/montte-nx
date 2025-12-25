# @f-o-t/money

Type-safe money handling library with BigInt precision and ISO 4217 currency support.

[![npm version](https://img.shields.io/npm/v/@f-o-t/money.svg)](https://www.npmjs.com/package/@f-o-t/money)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Precision-First**: Uses BigInt for exact arithmetic, eliminating floating-point errors
- **Type Safety**: Full TypeScript support with Zod schema validation
- **ISO 4217**: Built-in support for all standard currencies with correct decimal places
- **Immutable**: All operations return new instances, preventing accidental mutations
- **Framework Agnostic**: Works with any JavaScript/TypeScript project
- **Banker's Rounding**: IEEE 754 compliant rounding for fair financial calculations
- **Rich API**: Comprehensive operations for arithmetic, comparison, allocation, and aggregation
- **Locale Support**: Format and parse amounts in any locale
- **Extensible**: Register custom currencies for specialized use cases
- **Condition Evaluator**: Built-in operators for rule-based systems

## Installation

```bash
# npm
npm install @f-o-t/money

# bun
bun add @f-o-t/money

# yarn
yarn add @f-o-t/money

# pnpm
pnpm add @f-o-t/money
```

## Quick Start

```typescript
import { of, add, multiply, format } from "@f-o-t/money";

// Create money values
const price = of("19.99", "USD");
const quantity = 3;

// Calculate total
const subtotal = multiply(price, quantity);  // $59.97
const tax = multiply(subtotal, 0.08);        // $4.80
const total = add(subtotal, tax);            // $64.77

// Format for display
console.log(format(total, "en-US"));  // "$64.77"
```

## Core Concepts

### Money Object

The `Money` type represents a monetary value with three properties:

```typescript
type Money = {
  amount: bigint;    // Amount in minor units (e.g., cents)
  currency: string;  // ISO 4217 currency code
  scale: number;     // Number of decimal places
};
```

**Important**: Money objects are immutable. All operations return new instances.

### Precision

Uses BigInt internally to avoid floating-point errors:

```typescript
import { of, add, toDecimal } from "@f-o-t/money";

const a = of("0.1", "USD");
const b = of("0.2", "USD");
const result = add(a, b);

console.log(toDecimal(result));  // "0.30" ✓ (not 0.30000000000000004)
```

### Currency Support

All ISO 4217 currencies are supported with correct decimal places:

```typescript
import { of } from "@f-o-t/money";

const usd = of("10.50", "USD");    // 2 decimal places
const jpy = of("1050", "JPY");     // 0 decimal places
const kwd = of("10.500", "KWD");   // 3 decimal places
```

## API Reference

### Factory Functions

Create money values from various inputs:

```typescript
import { of, ofRounded, fromMinorUnits, fromMajorUnits, zero } from "@f-o-t/money";

// From major units (dollars, euros, etc.)
const money1 = of("123.45", "USD");
const money2 = of(123.45, "USD");        // Also accepts numbers
const money3 = fromMajorUnits("123.45", "USD");  // Alias for of()

// From minor units (cents, pence, etc.)
const money4 = fromMinorUnits(12345, "USD");     // $123.45
const money5 = fromMinorUnits(12345n, "USD");    // Also accepts BigInt

// Zero value
const money6 = zero("USD");  // $0.00

// Handle excess decimal places
const truncated = of("10.999", "USD");              // $10.99 (truncated)
const rounded = of("10.999", "USD", "round");       // $11.00 (rounded)
const rounded2 = ofRounded("10.999", "USD");        // $11.00 (convenience function)
```

### Arithmetic Operations

```typescript
import { add, subtract, multiply, divide, percentage, negate, absolute } from "@f-o-t/money";

const a = of("100.00", "USD");
const b = of("25.50", "USD");

add(a, b);           // $125.50
subtract(a, b);      // $74.50
multiply(a, 1.5);    // $150.00 - accepts numbers
multiply(a, "1.5");  // $150.00 - strings for precision
divide(a, 4);        // $25.00
percentage(a, 15);   // $15.00 - 15% of $100
negate(a);           // -$100.00
absolute(of("-50", "USD"));  // $50.00
```

**Note**: Division uses banker's rounding (round half to even) for fair distribution.

### Comparison Operations

```typescript
import {
  equals,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  isPositive,
  isNegative,
  isZero,
  compare
} from "@f-o-t/money";

const a = of("100.00", "USD");
const b = of("50.00", "USD");

equals(a, b);              // false
greaterThan(a, b);         // true
greaterThanOrEqual(a, a);  // true
lessThan(b, a);            // true
lessThanOrEqual(a, a);     // true

isPositive(a);             // true
isNegative(of("-10", "USD"));  // true
isZero(zero("USD"));       // true

compare(a, b);  // 1 (a > b)
compare(b, a);  // -1 (b < a)
compare(a, a);  // 0 (a === b)
```

**Note**: All comparison operations throw `CurrencyMismatchError` if currencies differ.

### Allocation

Distribute money amounts proportionally with exact precision:

```typescript
import { allocate, split } from "@f-o-t/money";

// Allocate by ratios (e.g., revenue sharing)
const revenue = of("100.00", "USD");
const shares = allocate(revenue, [60, 25, 15]);
// shares[0]: $60.00 (60%)
// shares[1]: $25.00 (25%)
// shares[2]: $15.00 (15%)

// Handle remainders fairly using largest remainder method
const amount = of("10.00", "USD");
const parts = allocate(amount, [1, 1, 1]);  // Split in thirds
// parts[0]: $3.34
// parts[1]: $3.33
// parts[2]: $3.33
// Total: $10.00 ✓

// Split evenly into N parts
const total = of("100.00", "USD");
const quarters = split(total, 4);
// Each part: $25.00
```

### Aggregation

Perform calculations on arrays of money values:

```typescript
import { sum, sumOrZero, min, max, average, median } from "@f-o-t/money";

const amounts = [
  of("10.00", "USD"),
  of("20.00", "USD"),
  of("30.00", "USD")
];

sum(amounts);       // $60.00
sumOrZero([], "USD");  // $0.00 - safe for empty arrays
min(amounts);       // $10.00
max(amounts);       // $30.00
average(amounts);   // $20.00
median(amounts);    // $20.00
```

### Formatting

Display money values in human-readable formats:

```typescript
import { format, formatCompact, formatAmount, toDecimal } from "@f-o-t/money";

const money = of("1234.56", "USD");

// Standard formatting
format(money, "en-US");     // "$1,234.56"
format(money, "pt-BR");     // "US$ 1.234,56"
format(money, "ja-JP");     // "$1,234.56"

// Compact notation (for large amounts)
const large = of("1234567.89", "USD");
formatCompact(large, "en-US");  // "$1.2M"

// Amount only (no currency symbol)
formatAmount(money, "en-US");   // "1,234.56"

// Hide currency symbol
format(money, "en-US", { hideSymbol: true });  // "1,234.56"

// Plain decimal string
toDecimal(money);  // "1234.56"
```

### Parsing

Parse formatted strings back into money values:

```typescript
import { parse } from "@f-o-t/money";

// US format
parse("$1,234.56", "en-US", "USD");

// Brazilian format
parse("R$ 1.234,56", "pt-BR", "BRL");

// Negative amounts (supports parentheses or minus)
parse("($1,234.56)", "en-US", "USD");  // -$1,234.56
parse("-$1,234.56", "en-US", "USD");   // -$1,234.56
```

### Serialization

Convert money to and from various formats:

```typescript
import {
  toJSON,
  fromJSON,
  toDatabase,
  fromDatabase,
  serialize,
  deserialize,
  toMinorUnits,
  toMinorUnitsBigInt,
  toMajorUnits,
  toMajorUnitsString,
  toMinorUnitsString
} from "@f-o-t/money";

const money = of("123.45", "USD");

// JSON (for APIs)
const json = toJSON(money);
// { amount: "123.45", currency: "USD" }
fromJSON(json);  // Recreates Money object

// Database storage (same as JSON)
const db = toDatabase(money);
// { amount: "123.45", currency: "USD" }
fromDatabase(db);

// String serialization
serialize(money);      // "123.45 USD"
deserialize("123.45 USD");  // Recreates Money object

// Unit conversions
toMinorUnits(money);        // 12345 (number)
toMinorUnitsBigInt(money);  // 12345n (BigInt)
toMajorUnitsString(money);  // "123.45" (string, precision-safe)
toMajorUnits(money);        // 123.45 (number, deprecated - may lose precision)
toMinorUnitsString(money);  // "12345" (string)
```

### Currency Registry

Access and manage currency information:

```typescript
import {
  getCurrency,
  registerCurrency,
  hasCurrency,
  getAllCurrencies,
  clearCustomCurrencies,
  ISO_4217_CURRENCIES
} from "@f-o-t/money";

// Get currency info
const usd = getCurrency("USD");
// {
//   code: "USD",
//   numericCode: 840,
//   name: "US Dollar",
//   decimalPlaces: 2,
//   symbol: "$"
// }

// Check if currency exists
hasCurrency("USD");  // true
hasCurrency("XXX");  // false

// Register custom currency
registerCurrency({
  code: "BTC",
  numericCode: 0,
  name: "Bitcoin",
  decimalPlaces: 8,
  symbol: "₿"
});

// Get all currencies
const all = getAllCurrencies();

// Clear custom currencies (useful for testing)
clearCustomCurrencies();

// Access raw ISO 4217 data
console.log(ISO_4217_CURRENCIES.USD);
```

### Zod Schemas

Validate money data with Zod schemas:

```typescript
import {
  MoneySchema,
  MoneyInputSchema,
  CurrencyCodeSchema,
  DatabaseMoneySchema,
  AllocationRatiosSchema,
  FormatOptionsSchema
} from "@f-o-t/money";

// Validate JSON input
const result = MoneySchema.safeParse({
  amount: "123.45",
  currency: "USD"
});

if (result.success) {
  const money = fromJSON(result.data);
}

// User input (accepts strings or numbers)
MoneyInputSchema.parse({
  amount: 123.45,      // number is OK
  currency: "USD"
});

// Currency code validation
CurrencyCodeSchema.parse("USD");  // ✓
CurrencyCodeSchema.parse("usd");  // ✗ - must be uppercase

// Allocation ratios
AllocationRatiosSchema.parse([60, 25, 15]);  // ✓
AllocationRatiosSchema.parse([]);            // ✗ - empty array
AllocationRatiosSchema.parse([-1, 1]);       // ✗ - negative values
```

### Error Handling

The library provides specific error types:

```typescript
import {
  MoneyError,
  CurrencyMismatchError,
  ScaleMismatchError,
  InvalidAmountError,
  DivisionByZeroError,
  UnknownCurrencyError,
  OverflowError
} from "@f-o-t/money";

try {
  add(of("10", "USD"), of("10", "EUR"));
} catch (error) {
  if (error instanceof CurrencyMismatchError) {
    console.log("Cannot add different currencies");
  }
}

// Scale mismatch (same currency with different decimal places)
try {
  const a = of("10.00", "USD");
  const b = { amount: 1000n, currency: "USD", scale: 4 }; // Invalid scale
  add(a, b);
} catch (error) {
  if (error instanceof ScaleMismatchError) {
    console.log("Scale mismatch:", error.scaleA, "vs", error.scaleB);
  }
}

// All error types extend MoneyError
try {
  divide(of("10", "USD"), 0);
} catch (error) {
  if (error instanceof MoneyError) {
    console.log("Money operation failed:", error.message);
  }
}
```

## Advanced Usage

### Condition Evaluator Integration

Use money operators with the `@f-o-t/condition-evaluator` package for rule-based systems:

```typescript
import { createEvaluator } from "@f-o-t/condition-evaluator";
import { moneyOperators } from "@f-o-t/money/operators";

const evaluator = createEvaluator({
  operators: moneyOperators
});

// Evaluate money conditions
const result = evaluator.evaluate(
  {
    type: "custom",
    field: "transactionAmount",
    operator: "money_gt",
    value: { amount: "100.00", currency: "USD" }
  },
  {
    data: {
      transactionAmount: { amount: "150.00", currency: "USD" }
    }
  }
);
// result: true

// Available operators:
// - money_eq, money_neq
// - money_gt, money_gte, money_lt, money_lte
// - money_between
// - money_positive, money_negative, money_zero
```

### Custom Currencies

Register currencies not in ISO 4217:

```typescript
import { registerCurrency, of } from "@f-o-t/money";

// Register cryptocurrency
registerCurrency({
  code: "BTC",
  numericCode: 0,
  name: "Bitcoin",
  decimalPlaces: 8,
  symbol: "₿",
  subunitName: "satoshi"
});

// Now you can use it
const bitcoin = of("0.00123456", "BTC");
```

### Assertions

Use assertions for type narrowing and validation:

```typescript
import { assertSameCurrency, assertAllSameCurrency } from "@f-o-t/money";

function addMany(amounts: Money[]): Money {
  assertAllSameCurrency(amounts);
  // TypeScript now knows all amounts have the same currency
  return sum(amounts);
}
```

### Low-Level Utilities

For advanced use cases:

```typescript
import {
  bankersRound,
  EXTENDED_PRECISION,
  PRECISION_FACTOR,
  createMoney,
  parseDecimalToMinorUnits,
  minorUnitsToDecimal
} from "@f-o-t/money";

// Banker's rounding
bankersRound(150n, 100n);  // 200n (rounds 1.5 to 2, even)
bankersRound(250n, 100n);  // 200n (rounds 2.5 to 2, even)

// Extended precision for intermediate calculations
console.log(EXTENDED_PRECISION);  // 1000000n
console.log(PRECISION_FACTOR);    // 100n

// Direct money creation (bypasses validation)
createMoney(12345n, "USD", 2);

// Low-level parsing
parseDecimalToMinorUnits("123.45", 2);  // 12345n
minorUnitsToDecimal(12345n, 2);         // "123.45"
```

## Best Practices

### 1. Always Use Strings for Precision

```typescript
// Good - exact representation
const price = of("19.99", "USD");
const result = multiply(price, "1.08");

// Avoid - floating point errors may occur
const price = of(19.99, "USD");
const result = multiply(price, 1.08);
```

### 2. Handle Currency Mismatches

```typescript
import { CurrencyMismatchError } from "@f-o-t/money";

function safeAdd(a: Money, b: Money): Money | null {
  try {
    return add(a, b);
  } catch (error) {
    if (error instanceof CurrencyMismatchError) {
      return null;  // Or handle conversion
    }
    throw error;
  }
}
```

### 3. Use Allocation for Fair Distribution

```typescript
// Don't use division for splitting money
const total = of("10.00", "USD");
const bad = divide(total, 3);  // Loses precision

// Use split instead
const good = split(total, 3);  // Ensures total is preserved
const sum = good.reduce((acc, m) => add(acc, m));
// sum equals total ✓
```

### 4. Store as Database-Friendly Format

```typescript
import { toDatabase, fromDatabase } from "@f-o-t/money";

// In your database model
interface Product {
  id: string;
  name: string;
  price: { amount: string; currency: string };
}

// When saving
const product: Product = {
  id: "123",
  name: "Widget",
  price: toDatabase(of("19.99", "USD"))
};

// When loading
const price = fromDatabase(product.price);
```

### 5. Validate API Input with Zod

```typescript
import { MoneyInputSchema, fromJSON } from "@f-o-t/money";
import { z } from "zod";

const CreateProductSchema = z.object({
  name: z.string(),
  price: MoneyInputSchema
});

function createProduct(input: unknown) {
  const validated = CreateProductSchema.parse(input);
  const price = fromJSON({
    amount: String(validated.price.amount),
    currency: validated.price.currency
  });
  // Use price...
}
```

## Performance

The library is optimized for high-performance financial calculations:

- **10,000 Money creations**: < 500ms
- **10,000 additions**: < 200ms
- **10,000 comparisons**: < 100ms
- **10,000 formats (with caching)**: < 500ms
- **1,000 allocations**: < 500ms

All tests run on modern hardware with Bun runtime.

## TypeScript

Full TypeScript support with strict types:

```typescript
import type { Money, MoneyJSON, Currency, FormatOptions } from "@f-o-t/money";

// Money is the core type
const money: Money = of("100", "USD");

// MoneyJSON for API contracts
const json: MoneyJSON = { amount: "100.00", currency: "USD" };

// Currency metadata
const currency: Currency = getCurrency("USD");

// Format configuration
const options: FormatOptions = {
  notation: "compact",
  hideSymbol: true
};
```

## Contributing

Contributions are welcome! Please check the repository for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Credits

Built by the Finance Tracker team as part of the Montte NX monorepo.

## Links

- [GitHub Repository](https://github.com/F-O-T/montte-nx)
- [Issue Tracker](https://github.com/F-O-T/montte-nx/issues)
- [NPM Package](https://www.npmjs.com/package/@f-o-t/money)
