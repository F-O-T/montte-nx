# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-10

### Added

- Initial release of the rules engine library
- **Engine**: Stateful rule management with `createEngine()`
  - Add, update, remove, enable/disable rules
  - Rule sets for grouping related rules
  - Configurable caching with TTL and max size
  - Lifecycle hooks (onBeforeEvaluation, onAfterEvaluation, onRuleMatch, onRuleError, onCacheHit)
  - Conflict resolution strategies: "all", "first-match", "highest-priority"
- **Fluent Builders**: Chainable APIs for building rules and conditions
  - `rule()` builder with full configuration options
  - Shorthand condition helpers: `num()`, `str()`, `bool()`, `date()`, `arr()`
  - Logical operators: `all()`, `any()`, `and()`, `or()`
- **Core Evaluation**: Built on `@f-o-t/condition-evaluator`
  - `evaluateRule()` and `evaluateRules()` functions
  - Filter rules by tags, category, enabled status
  - Sort rules by priority, name, created/updated date
  - Group rules by category, priority, enabled status, or custom function
- **Validation**: Comprehensive rule validation
  - Schema validation with Zod
  - Conflict detection (duplicate IDs, overlapping conditions, priority collisions, unreachable rules)
  - Integrity checks (negative priority, missing fields, invalid operators)
- **Simulation**: Test rules without side effects
  - `simulate()` for single context testing
  - `batchSimulate()` for multiple contexts
  - `whatIf()` for comparing rule set changes
- **Versioning**: Track rule changes with rollback support
  - Version store with full history
  - Rollback to any previous version
  - Prune old versions
- **Indexing & Optimization**: Fast rule lookups
  - Build indexes by field, tag, category, priority
  - Optimization suggestions for rule sets
- **Analysis**: Rule set analytics
  - Complexity analysis per rule
  - Field, operator, and consequence usage statistics
  - Find most complex rules
- **Serialization**: Import/export capabilities
  - JSON export/import with optional ID regeneration
  - Clone rules
  - Merge and diff rule sets
- **Utilities**: Functional programming helpers
  - `pipe()`, `compose()`, `identity()`, `always()`, `tap()`
  - `measureTime()`, `measureTimeAsync()`, `withTimeout()`, `delay()`
  - `generateId()`, `hashContext()`, `hashRules()`

### Changed

- **Internal refactor**: Removed 12 internal barrel files
  - All imports now use direct file paths instead of barrel re-exports
  - No public API changes - only internal module structure improvements
