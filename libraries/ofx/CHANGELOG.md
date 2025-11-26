# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
