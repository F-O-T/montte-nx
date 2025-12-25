# @f-o-t/rules-engine

A fully type-safe, functional, rules orchestration engine for TypeScript. Built on top of `@f-o-t/condition-evaluator` for condition evaluation.

## Features

- **Type-Safe**: Full TypeScript support with autocomplete for consequences
- **Functional**: Pure functions, immutable data structures, composable APIs
- **Fluent Builders**: Chainable rule and condition builders
- **Caching**: Built-in TTL-based caching with configurable eviction
- **Validation**: Rule schema validation, conflict detection, integrity checks
- **Versioning**: Track rule changes with rollback support
- **Simulation**: Test rules without side effects, compare rule sets
- **Indexing**: Fast rule lookups by field, tag, category, priority
- **Analysis**: Rule complexity analysis, usage statistics

## Installation

```bash
bun add @f-o-t/rules-engine
```

## Quick Start

```typescript
import { createEngine, rule, all, num, str } from "@f-o-t/rules-engine";

// Create an engine
const engine = createEngine();

// Add rules using the fluent builder
engine.addRule(
   rule()
      .named("Premium Discount")
      .when(
         all(
            num("orderTotal", "gt", 100),
            str("customerType", "eq", "premium")
         )
      )
      .then("apply_discount", { percentage: 15 })
      .withPriority(100)
      .tagged("pricing", "discount")
      .build()
);

// Evaluate against context
const result = await engine.evaluate({
   orderTotal: 150,
   customerType: "premium",
});

console.log(result.matchedRules);    // Rules that matched
console.log(result.consequences);    // Actions to execute
```

## Building Conditions

### Shorthand Helpers

```typescript
import { num, str, bool, date, arr, all, any } from "@f-o-t/rules-engine";

// Number conditions
num("amount", "gt", 100)      // amount > 100
num("count", "lte", 10)       // count <= 10
num("price", "eq", 50)        // price === 50

// String conditions
str("status", "eq", "active")
str("name", "contains", "test")
str("email", "ends_with", "@example.com")
str("role", "in", ["admin", "moderator"])

// Boolean conditions
bool("isActive", "eq", true)

// Date conditions
date("createdAt", "gt", "2024-01-01")
date("expiresAt", "between", ["2024-01-01", "2024-12-31"])

// Array conditions
arr("tags", "contains", "urgent")
arr("items", "is_not_empty", undefined)

// Combine with AND/OR
all(num("amount", "gt", 100), str("status", "eq", "approved"))
any(bool("isVip", "eq", true), num("orders", "gt", 10))
```

### Fluent Condition Builder

```typescript
import { and, or, conditions } from "@f-o-t/rules-engine";

// Using and/or with builder function
const complexCondition = and((c) =>
   c.number("amount", "gt", 100)
    .string("status", "eq", "active")
    .or((nested) =>
       nested.boolean("isVip", "eq", true)
             .number("loyaltyPoints", "gt", 1000)
    )
);
```

## Building Rules

```typescript
import { rule } from "@f-o-t/rules-engine";

const myRule = rule()
   .id("rule-001")                              // Optional custom ID
   .named("My Rule")                            // Required name
   .describedAs("Rule description")             // Optional description
   .when(conditions)                            // Required conditions
   .then("action_type", { payload: "data" })    // Required consequence(s)
   .then("another_action", {})                  // Multiple consequences
   .withPriority(100)                           // Higher = evaluated first
   .enabled()                                   // Enabled by default
   .stopOnMatch()                               // Stop evaluation on match
   .tagged("tag1", "tag2")                      // Categorization tags
   .inCategory("pricing")                       // Single category
   .withMetadata({ custom: "data" })            // Custom metadata
   .build();
```

## Engine API

### Rule Management

```typescript
const engine = createEngine();

// Add rules
const addedRule = engine.addRule(ruleInput);
const addedRules = engine.addRules([rule1, rule2]);

// Get rules
const singleRule = engine.getRule("rule-id");
const allRules = engine.getRules();
const filteredRules = engine.getRules({
   enabled: true,
   tags: ["pricing"],
   category: "discounts",
});

// Update rules
engine.updateRule("rule-id", { priority: 200 });
engine.enableRule("rule-id");
engine.disableRule("rule-id");

// Remove rules
engine.removeRule("rule-id");
engine.clearRules();
```

### Evaluation

```typescript
const result = await engine.evaluate(context, {
   skipDisabled: true,        // Skip disabled rules (default: true)
   bypassCache: false,        // Bypass cache (default: false)
   maxRules: 100,             // Limit rules evaluated
   tags: ["pricing"],         // Filter by tags
   category: "discounts",     // Filter by category
   ruleSetId: "set-001",      // Use specific rule set
   conflictResolution: "all", // "all" | "first-match" | "highest-priority"
});

// Result structure
result.matchedRules        // Rules that matched
result.consequences        // Aggregated consequences
result.totalRulesEvaluated // Count of rules evaluated
result.totalRulesMatched   // Count of matches
result.executionTimeMs     // Execution time
result.cacheHit            // Whether result was cached
```

### Rule Sets

```typescript
// Group rules into sets
engine.addRuleSet({
   name: "Holiday Promotions",
   ruleIds: ["rule-1", "rule-2", "rule-3"],
});

// Evaluate only rules in a set
await engine.evaluate(context, { ruleSetId: "set-id" });
```

## Engine Configuration

```typescript
import { createEngine } from "@f-o-t/rules-engine";
import { z } from "zod";

const engine = createEngine({
   // Type-safe consequence definitions
   consequences: {
      apply_discount: z.object({ percentage: z.number() }),
      send_email: z.object({ template: z.string(), to: z.string() }),
   },

   // Cache configuration
   cache: {
      enabled: true,
      ttl: 60000,      // 1 minute
      maxSize: 1000,
   },

   // Conflict resolution
   conflictResolution: "all", // "all" | "first-match" | "highest-priority"

   // Error handling
   continueOnError: true,

   // Performance monitoring
   slowRuleThresholdMs: 100,

   // Hook timeout (prevents slow hooks from blocking)
   hookTimeoutMs: 5000, // 5 second timeout

   // Lifecycle hooks
   hooks: {
      beforeEvaluation: async (context, rules) => {},
      afterEvaluation: async (result) => {},
      onRuleMatch: async (rule, context) => {},
      onRuleError: async (rule, error) => {},
      onCacheHit: async (key, result) => {},
      onSlowRule: async (rule, timeMs, threshold) => {},
      // Error handler for hook failures
      onHookError: (hookName, error) => {
         console.error(`Hook ${hookName} failed:`, error);
      },
   },
});
```

## Zod Schemas

All configuration types are built from Zod schemas, enabling runtime validation and type inference:

```typescript
import {
   // Config schemas
   CacheConfigSchema,
   ValidationConfigSchema,
   VersioningConfigSchema,
   LogLevelSchema,

   // Evaluation schemas
   ConflictResolutionStrategySchema,
   EvaluateOptionsSchema,

   // State schemas
   RuleStatsSchema,
   CacheStatsSchema,
   EngineStatsSchema,

   // Validation schemas
   ValidationErrorSchema,
   ValidationResultSchema,
   ValidationOptionsSchema,

   // Helper functions
   getDefaultCacheConfig,
   getDefaultValidationConfig,
   parseCacheConfig,
} from "@f-o-t/rules-engine";

// Parse and validate config with defaults
const cacheConfig = parseCacheConfig({ ttl: 30000 });
// Result: { enabled: true, ttl: 30000, maxSize: 1000 }

// Get default config
const defaults = getDefaultCacheConfig();
// Result: { enabled: true, ttl: 60000, maxSize: 1000 }

// Use schemas for custom validation
const result = CacheConfigSchema.safeParse(userInput);
if (!result.success) {
   console.error(result.error.issues);
}
```

## Validation

```typescript
import {
   validateRule,
   detectConflicts,
   checkIntegrity,
} from "@f-o-t/rules-engine";

// Validate single rule
const validation = validateRule(rule);
if (!validation.valid) {
   console.log(validation.errors);
}

// Detect conflicts between rules
const conflicts = detectConflicts(rules);
// Types: DUPLICATE_ID, DUPLICATE_CONDITIONS, OVERLAPPING_CONDITIONS,
//        PRIORITY_COLLISION, UNREACHABLE_RULE

// Check rule set integrity
const integrity = checkIntegrity(rules);
// Checks: negative priority, missing fields, invalid operators
```

## Simulation

```typescript
import { simulate, whatIf, batchSimulate } from "@f-o-t/rules-engine";

// Simulate without side effects
const result = simulate(rules, { data: context });

// Compare two rule sets
const comparison = whatIf(originalRules, modifiedRules, { data: context });
console.log(comparison.differences.newMatches);
console.log(comparison.differences.lostMatches);
console.log(comparison.differences.consequenceChanges);

// Test multiple contexts
const batchResults = batchSimulate(rules, [
   { data: { amount: 50 } },
   { data: { amount: 150 } },
   { data: { amount: 500 } },
]);
```

## Versioning

```typescript
import {
   createVersionStore,
   addVersion,
   getHistory,
   rollbackToVersion,
} from "@f-o-t/rules-engine";

let store = createVersionStore();

// Track changes
store = addVersion(store, rule, "create", { comment: "Initial version" });
store = addVersion(store, updatedRule, "update", { comment: "Increased priority" });

// Get history
const history = getHistory(store, rule.id);

// Rollback
const { store: newStore, rule: restoredRule } = rollbackToVersion(
   store,
   rule.id,
   1 // version number
);
```

## Indexing & Optimization

```typescript
import {
   buildIndex,
   getRulesByField,
   getRulesByTag,
   analyzeOptimizations,
} from "@f-o-t/rules-engine";

// Build index for fast lookups
const index = buildIndex(rules);

// Query by field
const amountRules = getRulesByField(index, "amount");

// Query by tag
const pricingRules = getRulesByTag(index, "pricing");

// Get optimization suggestions
const suggestions = analyzeOptimizations(rules);
```

## Analysis

```typescript
import {
   analyzeRuleSet,
   analyzeRuleComplexity,
   findMostComplexRules,
} from "@f-o-t/rules-engine";

// Analyze entire rule set
const analysis = analyzeRuleSet(rules);
console.log(analysis.ruleCount);
console.log(analysis.uniqueFields);
console.log(analysis.uniqueCategories);
console.log(analysis.fieldUsage);
console.log(analysis.operatorUsage);

// Find complex rules
const complexRules = findMostComplexRules(rules, 5);
```

## Serialization

```typescript
import {
   exportToJson,
   importFromJson,
   cloneRule,
   mergeRuleSets,
   diffRuleSets,
} from "@f-o-t/rules-engine";

// Export/Import
const json = exportToJson(rules, ruleSets);
const result = importFromJson(json, {
   generateNewIds: true, // Generate new IDs on import
});

if (result.success) {
   console.log("Imported rules:", result.rules);
   console.log("Imported ruleSets:", result.ruleSets);
}

// Check for orphaned references (ruleSets referencing missing rules)
if (result.orphanedReferences.length > 0) {
   for (const orphan of result.orphanedReferences) {
      console.warn(
         `RuleSet "${orphan.ruleSetName}" references missing rules:`,
         orphan.missingRuleIds
      );
   }
}

// Clone rule
const cloned = cloneRule(rule, { generateNewId: true });

// Merge rule sets
const merged = mergeRuleSets(rulesA, rulesB, {
   onConflict: "keep-first", // "keep-first" | "keep-second" | "keep-both"
});

// Diff rule sets
const diff = diffRuleSets(rulesA, rulesB);
console.log(diff.added);
console.log(diff.removed);
console.log(diff.modified);
```

## Filtering, Sorting & Grouping

```typescript
import {
   filterRules,
   filterByTags,
   filterByCategory,
   filterByEnabled,
   sortRules,
   sortByPriority,
   sortByName,
   sortByCreatedAt,
   groupRules,
   groupByCategory,
   groupByPriority,
   groupByEnabled,
} from "@f-o-t/rules-engine";

// Filter rules
const activeRules = filterByEnabled(rules, true);
const pricingRules = filterByTags(rules, ["pricing"]);
const discountRules = filterByCategory(rules, "discounts");

// Combined filters
const filtered = filterRules(rules, {
   enabled: true,
   tags: ["pricing"],
   category: "discounts",
});

// Sort rules
const byPriority = sortByPriority(rules, "desc"); // Highest first
const byName = sortByName(rules, "asc");
const byDate = sortByCreatedAt(rules, "desc");

// Custom sort
const sorted = sortRules(rules, { field: "priority", direction: "desc" });

// Group rules
const byCategory = groupByCategory(rules);
const byPriorityLevel = groupByPriority(rules);
const byStatus = groupByEnabled(rules);
```

## Utilities

```typescript
import {
   generateId,
   hashContext,
   hashRules,
   measureTime,
   measureTimeAsync,
   withTimeout,
} from "@f-o-t/rules-engine";

// Generate unique IDs
const id = generateId();

// Hash context for caching
const hash = hashContext({ amount: 100 });

// Measure execution time
const { result, durationMs } = measureTime(() => expensiveOperation());

// Async timing
const { result: asyncResult, durationMs: asyncTime } = await measureTimeAsync(
   () => fetchData()
);

// Timeout wrapper
const resultWithTimeout = await withTimeout(
   slowOperationPromise,
   5000, // 5 second timeout
   "Operation timed out" // optional error message
);
```

## State Management (Functional API)

For functional programming without the engine wrapper:

```typescript
import {
   createInitialState,
   addRule,
   addRules,
   updateRule,
   removeRule,
   getRule,
   getRules,
   enableRule,
   disableRule,
   cloneState,
} from "@f-o-t/rules-engine";

// Create initial state
let state = createInitialState();

// Add rules (returns new state)
state = addRule(state, ruleInput);
state = addRules(state, [rule1, rule2]);

// Query rules
const rule = getRule(state, "rule-id");
const allRules = getRules(state);

// Update rules
state = updateRule(state, "rule-id", { priority: 200 });
state = enableRule(state, "rule-id");
state = disableRule(state, "rule-id");

// Clone state for comparison
const clonedState = cloneState(state);
```

## License

MIT
