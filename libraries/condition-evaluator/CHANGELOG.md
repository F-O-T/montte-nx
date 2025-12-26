# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-24

### Breaking Changes

- **Removed type exports**: `ConditionGroupInput` and `GroupEvaluationResultInput` are no longer exported
  - Use `ConditionGroup` and `GroupEvaluationResult` (Zod-inferred types) instead
- All evaluation functions now accept an optional `EvaluationOptions` parameter

### Added

- **Performance Options**: New `EvaluationOptions` interface with:
  - `skipValidation`: Skip Zod schema validation for pre-validated conditions (up to 78% faster)
  - `maxDepth`: Configure maximum nesting depth (default: 10) to prevent stack overflow
- **New Zod Schema Exports**:
  - `EvaluationOptionsSchema` - Schema for evaluation options
  - `DependencyInfoSchema` - Schema for dependency extraction results
  - `ConditionTypeSchema` - Schema for condition types
  - `CustomOperatorConfigDataSchema` - Schema for custom operator config data
  - `PluginCustomConditionSchema` - Schema for plugin custom conditions
  - `EvaluatorConfigSchema` - Schema for evaluator configuration
- **Shared Utility Exports**: `getNestedValue`, `formatValue`, `generateReason`, `calculateDiff`, `getWeight`
- **Comprehensive Test Coverage**: 345 tests (up from 195)
  - New `date.test.ts` with 47 tests for all date operators
  - New `array.test.ts` with 55 tests for all array operators
  - New `performance.test.ts` with benchmark tests
  - Edge case tests for Infinity, MAX_SAFE_INTEGER, NaN handling

### Fixed

- **Circular Reference Bug**: `deepEquals` in array operators now handles circular references without infinite loops
- **Recursion Depth Limit**: Prevents stack overflow with deeply nested condition groups (throws at maxDepth)

### Changed

- **Types Fully Zod-Based**: All types are now derived from Zod schemas (no hand-defined duplicates)
- **Internal Refactor**: Extracted shared utilities to `src/utils.ts`, reducing code duplication
- **Plugin Types**: Added Zod schemas for plugin system types while preserving TypeScript generics

### Performance

- Single condition evaluation: ~0.007ms average
- 100 conditions: ~0.5ms average
- 1000 conditions: ~2.9ms average
- `skipValidation` option provides up to 78% speedup

## [1.4.1] - 2025-12-10

### Changed

- **Internal refactor**: Removed internal barrel files (`src/operators/index.ts`, `src/plugins/index.ts`)
- Moved `evaluateConditionValue` function to `src/evaluator.ts`
- All imports now use direct file paths instead of barrel re-exports
- No public API changes - only internal module structure improvements

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
