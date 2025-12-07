# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
