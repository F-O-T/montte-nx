# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-25

### Added

#### Rounding Mode Support
- `ofRounded()` - New factory function that rounds excess decimal places using banker's rounding
- `RoundingMode` type - `"truncate" | "round"` for controlling decimal handling
- Optional third parameter for `of()` to specify rounding mode: `of("10.999", "USD", "round")`

#### Precision-Safe Conversion
- `toMajorUnitsString()` - Convert Money to major units as a string without precision loss
- Safe formatting for very large amounts (>15 significant digits) that would lose precision with float conversion

#### Scale Validation
- `ScaleMismatchError` - New error thrown when operating on Money values with inconsistent scales
- `assertSameCurrency()` now validates both currency AND scale consistency
- `assertAllSameCurrency()` now validates scale consistency across all values

### Changed

#### Banker's Rounding Fix
- Fixed banker's rounding algorithm for odd divisors
- Previously used truncated half comparison which could produce incorrect results
- Now uses `remainder * 2 === divisor` for accurate halfway detection

#### Allocation Precision
- Improved ratio precision in `allocate()` by using string-based parsing instead of `Math.round`
- Eliminates floating-point errors for extreme ratio values (very small or very large)

#### Parse Validation
- `parse()` now throws `InvalidAmountError` on malformed input with multiple decimal separators
- Previously would silently accept invalid formats like "1.234.56"

#### Input Precision Warnings
- `of()` now warns when passed a number with likely floating-point precision issues
- Detects patterns like `0.1 + 0.2` that produce imprecise results
- Encourages use of string amounts for precision-critical values

### Deprecated

- `toMajorUnits()` - Use `toMajorUnitsString()` for precision-safe conversion
  - Still works but logs a warning for amounts exceeding safe integer range

### Fixed

- Banker's rounding for odd divisors now correctly rounds to even
- Large amount formatting no longer loses precision due to float conversion
- Allocation with extreme ratios now preserves full precision

---

## [1.0.0] - 2024-12-24

### Added

#### Core Features
- BigInt-based money representation for exact precision arithmetic
- Immutable `Money` type with `amount` (BigInt), `currency` (string), and `scale` (number) properties
- Support for all ISO 4217 currencies with correct decimal places
- Type-safe operations with full TypeScript support

#### Factory Functions
- `of()` - Create Money from major units (dollars, euros, etc.) as string or number
- `fromMajorUnits()` - Alias for `of()` for semantic clarity
- `fromMinorUnits()` - Create Money from minor units (cents, pence, etc.)
- `zero()` - Create zero-value Money for a given currency

#### Arithmetic Operations
- `add()` - Add two Money values (throws on currency mismatch)
- `subtract()` - Subtract Money values
- `multiply()` - Multiply Money by scalar (number or string for precision)
- `divide()` - Divide Money by scalar using banker's rounding
- `percentage()` - Calculate percentage of Money value
- `negate()` - Negate Money value
- `absolute()` - Get absolute value of Money

#### Comparison Operations
- `equals()` - Check equality
- `greaterThan()`, `greaterThanOrEqual()` - Greater than comparisons
- `lessThan()`, `lessThanOrEqual()` - Less than comparisons
- `isPositive()`, `isNegative()`, `isZero()` - Value state checks
- `compare()` - Three-way comparison (-1, 0, 1)

#### Allocation
- `allocate()` - Distribute Money by ratios using largest remainder method
- `split()` - Split Money evenly into N parts with fair remainder distribution
- Guarantees sum of allocated parts equals original amount

#### Aggregation
- `sum()` - Sum array of Money values
- `sumOrZero()` - Sum with safe handling of empty arrays
- `min()`, `max()` - Find minimum/maximum values
- `average()` - Calculate average with banker's rounding
- `median()` - Calculate median value

#### Formatting
- `format()` - Format Money with locale support (Intl.NumberFormat)
- `formatCompact()` - Format with compact notation for large amounts
- `formatAmount()` - Format amount only without currency symbol
- `toDecimal()` - Convert to plain decimal string
- Support for locale-specific formatting (en-US, pt-BR, ja-JP, etc.)
- Configurable format options (notation, sign display, currency display, etc.)

#### Parsing
- `parse()` - Parse formatted strings to Money values
- Support for multiple locale formats
- Handle negative amounts (both parentheses and minus sign notation)
- Automatic removal of currency symbols and thousands separators

#### Serialization
- `toJSON()`, `fromJSON()` - JSON serialization with `{ amount: string, currency: string }` format
- `toDatabase()`, `fromDatabase()` - Database storage (alias for JSON methods)
- `serialize()`, `deserialize()` - String serialization with "amount currency" format
- `toMinorUnits()` - Convert to number (throws on overflow)
- `toMinorUnitsBigInt()` - Convert to BigInt
- `toMajorUnits()` - Convert to decimal number
- `toMinorUnitsString()` - Convert to string representation

#### Currency Registry
- `getCurrency()` - Get currency metadata (symbol, decimal places, name)
- `hasCurrency()` - Check if currency exists
- `registerCurrency()` - Register custom currencies
- `getAllCurrencies()` - Get all registered currencies
- `clearCustomCurrencies()` - Clear custom currencies (useful for testing)
- `ISO_4217_CURRENCIES` - Complete ISO 4217 currency data
- Case-insensitive currency code handling

#### Validation
- Zod schemas for all types:
  - `MoneySchema` - JSON representation validation
  - `MoneyInputSchema` - User input validation (accepts string or number)
  - `MoneyInternalSchema` - Internal Money representation
  - `CurrencyCodeSchema` - ISO 4217 currency code validation
  - `CurrencySchema` - Currency definition validation
  - `DatabaseMoneySchema` - Database storage validation
  - `AllocationRatiosSchema` - Allocation ratios validation
  - `FormatOptionsSchema` - Format options validation

#### Error Handling
- `MoneyError` - Base error class
- `CurrencyMismatchError` - Thrown when operating on different currencies
- `InvalidAmountError` - Thrown for invalid amount values
- `DivisionByZeroError` - Thrown when dividing by zero
- `UnknownCurrencyError` - Thrown for unregistered currencies
- `OverflowError` - Thrown when converting BigInt to unsafe number

#### Condition Evaluator Integration
- `@f-o-t/money/operators` export for condition evaluator integration
- Money operators:
  - `money_eq`, `money_neq` - Equality checks
  - `money_gt`, `money_gte`, `money_lt`, `money_lte` - Comparisons
  - `money_between` - Range checks
  - `money_positive`, `money_negative`, `money_zero` - State checks
- Seamless integration with `@f-o-t/condition-evaluator` package

#### Low-Level Utilities
- `bankersRound()` - Banker's rounding (round half to even)
- `createMoney()` - Direct Money creation (bypasses validation)
- `parseDecimalToMinorUnits()` - Parse decimal string to BigInt
- `minorUnitsToDecimal()` - Convert BigInt to decimal string
- `assertSameCurrency()` - Assert two Money values have same currency
- `assertAllSameCurrency()` - Assert all Money values in array have same currency
- Constants: `EXTENDED_PRECISION`, `PRECISION_FACTOR`

#### Developer Experience
- Zero runtime dependencies (only Zod for validation)
- Full TypeScript type safety
- Immutable data structures (frozen objects)
- Comprehensive test suite with 100% coverage
- Performance benchmarks included
- JSDoc comments for all public APIs

### Technical Details

#### Precision
- Uses BigInt for all internal calculations
- Extended precision for intermediate calculations (6 decimal places)
- Banker's rounding (IEEE 754) for division and averaging
- Guarantees exact results for all arithmetic operations

#### Currency Handling
- Automatic decimal place handling based on ISO 4217
- Support for 0-decimal currencies (JPY, KRW)
- Support for 3-decimal currencies (KWD, BHD, OMR)
- Support for 4-decimal currencies (CLF)
- Case-insensitive currency code input (normalized to uppercase)

#### Performance
- Optimized for high-frequency operations
- Formatter caching for repeated format operations
- Minimal object allocations
- Benchmarks included in test suite:
  - 10,000 Money creations: < 500ms
  - 10,000 additions: < 200ms
  - 10,000 comparisons: < 100ms

#### Package Exports
- Main export: `@f-o-t/money` - All core functionality
- Operators export: `@f-o-t/money/operators` - Condition evaluator operators
- Package.json export: `@f-o-t/money/package.json`

### Dependencies

- `zod` (^4.1.13) - Schema validation
- `@f-o-t/condition-evaluator` (workspace) - Operator integration

### Peer Dependencies

- `typescript` (>=4.5.0) - Optional for type checking

[0.1.0]: https://github.com/F-O-T/montte-nx/releases/tag/@f-o-t/money@0.1.0
