# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2025-12-05

### Added

- OFX file generation capabilities for bank and credit card statements.
- `generateHeader()` for creating OFX headers.
- `formatOfxDate()` for consistent OFX date formatting.
- `escapeOfxText()` for proper text escaping within OFX tags.
- `generateTransaction()` for creating individual OFX transaction entries.
- `generateBankStatement()` for creating complete OFX bank statements.
- `generateCreditCardStatement()` for creating complete OFX credit card statements.

## [1.2.0] - 2025-11-27

### Fixed

- Fixed parsing of mixed XML/SGML format OFX files (files with both `<TAG>value</TAG>` and `<TAG>value` styles)
- Closing tags now correctly find their matching opening tag instead of popping the wrong element from the stack

### Changed

- Optimized `addToContent` to mutate arrays in place instead of using spread operator
- Optimized `sgmlToObject` to use `Map` for O(1) tag stack lookups instead of `findIndex` O(n)

### Performance

- ~38% faster parsing on real-world files
- ~6.5x faster on 5K transactions (241ms → 37ms)
- ~7x faster on 10K transactions (832ms → 113ms)
- ~10x faster on 50K transactions (4255ms → 442ms)

## [1.1.1] - 2025-11-27

### Changed

- Updated package exports to point to dist files for proper module resolution

## [1.1.0] - 2025-11-27

### Changed

- Reordered object properties in `parseDateComponents` and `parseTimezone` for consistency (alphabetical order)

## [1.0.0] - 2025-11-26

### Added

- Full OFX/SGML parsing with Zod schema validation
- Support for bank statements (`BANKMSGSRSV1`) and credit card statements (`CREDITCARDMSGSRSV1`)
- Transaction extraction with `getTransactions()`
- Account info extraction with `getAccountInfo()`
- Balance extraction with `getBalance()`
- Sign-on info extraction with `getSignOnInfo()`
- Date parsing with timezone support and `toDate()` conversion
- All 18 OFX transaction types supported
- Type-safe parsing with `parse()` (returns `ParseResult`) and `parseOrThrow()`
- Exported schemas for custom validation

### Performance

- Handles ~10K transactions (typical annual business statement) in ~800ms
- Handles ~25K transactions in ~1.3s
- Handles ~50K transactions in ~4.3s
- Extraction operations remain sub-millisecond even on large datasets
