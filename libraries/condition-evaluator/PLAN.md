# Implementation Plan: `@f-o-t/condition-evaluator` v1.1-1.4

## Overview

This plan covers 4 milestones that add advanced features to the condition evaluator library while maintaining full backward compatibility.

### Decisions Made

| Decision | Choice |
|----------|--------|
| Diff analysis | Minimal (numeric/date only, no Levenshtein) |
| Custom operator type | Generic with full type inference (functional approach) |
| `one_of`/`not_one_of` | Keep (clearer semantics) |
| Timing in metadata | Skip (users can measure externally) |
| Backward compatibility | Full (all existing tests pass unchanged) |

---

## File Changes Overview

| File | Action | Milestone |
|------|--------|-----------|
| `src/schemas.ts` | Modify | M1, M2, M3, M4 |
| `src/operators/string.ts` | Modify | M1 |
| `src/operators/index.ts` | Modify | M1 |
| `src/evaluator.ts` | Modify | M1, M2, M3 |
| `src/dependencies.ts` | **Create** | M2 |
| `src/plugins/types.ts` | **Create** | M4 |
| `src/plugins/create-operator.ts` | **Create** | M4 |
| `src/plugins/create-evaluator.ts` | **Create** | M4 |
| `src/plugins/index.ts` | **Create** | M4 |
| `src/index.ts` | Modify | All |
| `__tests__/string.test.ts` | Modify | M1 |
| `__tests__/valueref.test.ts` | **Create** | M1 |
| `__tests__/diagnostics.test.ts` | **Create** | M2 |
| `__tests__/dependencies.test.ts` | **Create** | M2 |
| `__tests__/weighted.test.ts` | **Create** | M3 |
| `__tests__/plugins.test.ts` | **Create** | M4 |

---

## Milestone 1: Dynamic Comparisons & Advanced Operators

### 1.1 Schema Changes (`src/schemas.ts`)

**Add `valueRef` to all condition types:**

- `StringCondition`: Add optional `valueRef: z.string()`
- `NumberCondition`: Add optional `valueRef: z.string()` with refinement
- `BooleanCondition`: Add optional `valueRef: z.string()`
- `DateCondition`: Add optional `valueRef: z.string()`
- `ArrayCondition`: Add optional `valueRef: z.string()`

**Add new StringOperator values:**

```typescript
"one_of"        // Alias for "in" with clearer semantics
"not_one_of"    // Alias for "not_in"
"contains_any"  // Contains any substring from array
"contains_all"  // Contains all substrings from array
"ilike"         // SQL LIKE with % and _ wildcards (case-insensitive)
"not_ilike"     // Negation of ilike
```

### 1.2 String Operators (`src/operators/string.ts`)

Add implementations for:

- `one_of`: Alias for `in` operator
- `not_one_of`: Alias for `not_in` operator
- `contains_any`: Returns true if string contains ANY substring from array
- `contains_all`: Returns true if string contains ALL substrings from array
- `ilike`: SQL LIKE pattern matching (% = any chars, _ = single char)
- `not_ilike`: Negation of ilike

### 1.3 Operators Index (`src/operators/index.ts`)

Update `evaluateConditionValue` signature to accept resolved expected value:

```typescript
export function evaluateConditionValue(
   condition: Condition,
   actualValue: unknown,
   resolvedExpected?: unknown,
): boolean
```

### 1.4 Evaluator (`src/evaluator.ts`)

Modify `evaluateCondition` to resolve `valueRef`:

1. Check if condition has `valueRef`
2. If so, resolve value from context using `getNestedValue`
3. Pass resolved value to `evaluateConditionValue`

### 1.5 Tests

- `__tests__/valueref.test.ts`: Tests for field-to-field comparisons
- `__tests__/string.test.ts`: Add tests for new string operators

---

## Milestone 2: Diagnostics & Explainability

### 2.1 Schema Changes (`src/schemas.ts`)

Add new types:

```typescript
EvaluationMetadata = {
   valueSource: "static" | "reference";
   resolvedRef?: string;
}

DiffAnalysis = {
   type: "numeric" | "date";
   applicable: boolean;
   numericDistance?: number;
   proximity?: number;
   milliseconds?: number;
   humanReadable?: string;
}
```

Update `EvaluationResult` to include:
- `reason?: string`
- `metadata?: EvaluationMetadata`
- `diff?: DiffAnalysis`

### 2.2 Evaluator Helpers (`src/evaluator.ts`)

Add helper functions:

- `formatValue(value: unknown): string` - Format values for display
- `generateReason(operator, passed, actual, expected, field): string` - Human-readable reason
- `calculateDiff(type, operator, actual, expected): DiffAnalysis` - Calculate diff for numeric/date

### 2.3 Dependencies (`src/dependencies.ts`)

Create new file with:

```typescript
type DependencyInfo = {
   fields: string[];
   references: string[];
   allPaths: string[];
   nested: boolean;
   maxDepth: number;
}

function extractDependencies(input: Condition | ConditionGroup): DependencyInfo
```

### 2.4 Tests

- `__tests__/diagnostics.test.ts`: Tests for enhanced results
- `__tests__/dependencies.test.ts`: Tests for extractDependencies

---

## Milestone 3: Weighted Scoring System

### 3.1 Schema Changes (`src/schemas.ts`)

Add to condition options:
- `weight?: number` (min: 0)

Add to ConditionGroup:
- `scoringMode?: "binary" | "weighted"`
- `threshold?: number`
- `weight?: number`

Update GroupEvaluationResult:
- `scoringMode?: "binary" | "weighted"`
- `totalScore?: number`
- `maxPossibleScore?: number`
- `threshold?: number`
- `scorePercentage?: number`

### 3.2 Evaluator (`src/evaluator.ts`)

Add helper:
- `getWeight(item: Condition | ConditionGroup): number`

Update `evaluateConditionGroup`:
1. Track `totalScore` and `maxPossibleScore`
2. If `scoringMode === "weighted"`, determine pass based on threshold
3. Include weighted fields in result

### 3.3 Tests

- `__tests__/weighted.test.ts`: Tests for weighted scoring

---

## Milestone 4: Plugin System (Functional Approach)

### 4.1 Types (`src/plugins/types.ts`)

```typescript
type CustomOperatorConfig<TName, TValue, TOptions> = {
   name: TName;
   type: ConditionType;
   evaluate: (current: unknown, expected: TValue, options?: TOptions) => boolean;
   valueSchema?: z.ZodSchema<TValue>;
   reasonGenerator?: (passed, current, expected, field) => string;
}

type OperatorMap = Record<string, CustomOperatorConfig>

type CustomCondition<TOperator> = {
   id: string;
   type: "custom";
   field: string;
   operator: TOperator;
   value?: unknown;
   valueRef?: string;
   options?: { negate?: boolean; ... };
}

type EvaluatorConfig<T extends OperatorMap> = {
   operators?: T;
}
```

### 4.2 Create Operator (`src/plugins/create-operator.ts`)

```typescript
function createOperator<TName, TValue, TOptions>(
   config: CustomOperatorConfig<TName, TValue, TOptions>
): CustomOperatorConfig<TName, TValue, TOptions>
```

### 4.3 Create Evaluator (`src/plugins/create-evaluator.ts`)

```typescript
function createEvaluator<T extends OperatorMap>(config: EvaluatorConfig<T>) {
   return {
      evaluate,
      evaluateCondition,
      evaluateConditionGroup,
   }
}
```

### 4.4 Schema Changes (`src/schemas.ts`)

Add `CustomCondition` to the Condition discriminated union.

### 4.5 Tests

- `__tests__/plugins.test.ts`: Tests for plugin system

---

## Final Steps

### Update Exports (`src/index.ts`)

Export all new functions and types:
- `extractDependencies`, `DependencyInfo`
- `createOperator`, `createEvaluator`
- `CustomOperatorConfig`, `OperatorMap`, `EvaluatorConfig`
- `CustomCondition`, `EvaluationMetadata`, `DiffAnalysis`

### Run Tests

Ensure all existing tests pass without modification.

---

## Implementation Order

1. M1: Schema valueRef
2. M1: String operators
3. M1: Operators index
4. M1: Evaluator valueRef
5. M1: Tests
6. M2: Result types
7. M2: Reason generator
8. M2: Diff calculator
9. M2: Extract dependencies
10. M2: Tests
11. M3: Weighted schema
12. M3: Weighted result
13. M3: Weighted evaluation
14. M3: Tests
15. M4: Plugin types
16. M4: Create operator
17. M4: Create evaluator
18. M4: Custom condition
19. M4: Tests
20. Final exports
21. Final tests
