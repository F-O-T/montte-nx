# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-12-10

### Added

- **Plugin System**: Full support for custom operators via a functional API
  - `createOperator()` - Define custom operators with type inference
  - `createEvaluator()` - Create evaluator instances with custom operators
  - `CustomOperatorConfig` type for defining operator configuration
  - `OperatorMap` and `EvaluatorConfig` types for type-safe plugin registration
  - Custom operators support value schema validation via Zod
  - Custom reason generators for operator-specific error messages
- **CustomCondition**: New condition type (`type: "custom"`) for plugin-based evaluation
- Export new types: `PluginCustomCondition`, `ConditionType`, `InferOperatorNames`

## [1.3.0] - 2025-12-10

### Added

- **Weighted Scoring System**: Conditions and groups can now have weights for flexible scoring
  - `weight` option on all condition types and groups
  - `scoringMode`: Choose between `"binary"` (default) or `"weighted"` evaluation
  - `threshold`: Minimum score required for weighted groups to pass
  - New result fields: `totalScore`, `maxPossibleScore`, `scorePercentage`
- Groups can now aggregate scores across conditions for fuzzy matching scenarios

## [1.2.0] - 2025-12-10

### Added

- **Diagnostics & Explainability**: Enhanced evaluation results with debugging information
  - `reason`: Human-readable explanation of why a condition passed or failed
  - `metadata`: Evaluation metadata including `valueSource` ("static" | "reference") and `resolvedRef`
  - `diff`: Diff analysis for numeric and date comparisons
    - Numeric: `numericDistance`, `proximity`
    - Date: `milliseconds`, `humanReadable` (e.g., "3 days after")
- **Dependency Extraction**: Static analysis of condition dependencies
  - `extractDependencies()` - Extract all field paths and references from conditions/groups
  - Returns `DependencyInfo`: `fields`, `references`, `allPaths`, `nested`, `maxDepth`
- Export new types: `EvaluationMetadata`, `DiffAnalysis`, `DependencyInfo`

## [1.1.0] - 2025-12-10

### Added

- **Dynamic Value References**: Compare fields against other fields using `valueRef`
  - All condition types now support optional `valueRef` property
  - When `valueRef` is set, the comparison uses the referenced field's value instead of a static `value`
  - Example: `{ field: "price", operator: "gt", valueRef: "minPrice" }`
- **New String Operators**:
  - `one_of` - Alias for `in` with clearer semantics (value is one of the given array)
  - `not_one_of` - Alias for `not_in` (value is not one of the given array)
  - `contains_any` - Returns true if string contains ANY substring from array
  - `contains_all` - Returns true if string contains ALL substrings from array
  - `ilike` - SQL LIKE pattern matching with `%` (any chars) and `_` (single char) wildcards, case-insensitive
  - `not_ilike` - Negation of ilike

### Changed

- `evaluateConditionValue()` now accepts an optional third parameter for resolved expected values

## [1.0.1] - 2025-12-09

### Fixed

- Remove `.ts` extensions from imports to fix TypeScript compilation in CI environments

## [1.0.0] - 2025-12-07

### Added

- Initial release of the condition evaluator library
- Type-safe condition evaluation with Zod schema validation
- Support for 5 condition types:
  - **String**: eq, neq, contains, not_contains, starts_with, ends_with, matches, is_empty, is_not_empty, in, not_in
  - **Number**: eq, neq, gt, gte, lt, lte, between, not_between
  - **Boolean**: eq, neq, is_true, is_false
  - **Date**: eq, neq, before, after, between, not_between, is_weekend, is_weekday, day_of_week, day_of_month
  - **Array**: contains, not_contains, contains_all, contains_any, is_empty, is_not_empty, length_eq, length_gt, length_lt
- Condition groups with AND/OR logical operators
- Nested condition group support for complex logic
- Nested field access with dot notation (e.g., `user.profile.name`)
- Options support: `caseSensitive`, `trim`, `negate`
- All types inferred from Zod schemas (single source of truth)
- Comprehensive test suite (91 tests)
