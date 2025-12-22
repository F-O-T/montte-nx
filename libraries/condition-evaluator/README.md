# @f-o-t/condition-evaluator

A flexible, type-safe condition evaluator for building rule engines. Uses Zod for schema validation with types inferred from schemas.

## Installation

```bash
bun add @f-o-t/condition-evaluator
```

## Quick Start

```typescript
import {
   evaluateCondition,
   evaluateConditionGroup,
   type Condition,
   type ConditionGroup,
   type EvaluationContext,
} from "@f-o-t/condition-evaluator";

const condition: Condition = {
   id: "1",
   type: "string",
   field: "name",
   operator: "eq",
   value: "John",
};

const context: EvaluationContext = {
   data: { name: "John", age: 25 },
};

const result = evaluateCondition(condition, context);
console.log(result.passed); // true
```

## Features

- **Type-safe**: All types inferred from Zod schemas
- **Multiple condition types**: string, number, boolean, date, array, custom
- **Plugin System**: Create custom operators with `createOperator()` and `createEvaluator()`
- **Weighted Scoring**: Support for weighted conditions with threshold-based evaluation
- **Dynamic References**: Compare fields against other fields using `valueRef`
- **Diagnostics**: Human-readable reasons, diff analysis, and dependency extraction
- **Nested field access**: Access nested properties with dot notation (`user.profile.name`)
- **Condition groups**: Combine conditions with AND/OR logic
- **Zod validation**: All inputs validated at runtime

## API Reference

### Evaluation Functions

#### `evaluateCondition(condition, context)`

Evaluates a single condition against a context.

```typescript
const result = evaluateCondition(
   {
      id: "1",
      type: "number",
      field: "amount",
      operator: "gt",
      value: 100,
   },
   { data: { amount: 150 } },
);

console.log(result.passed); // true
console.log(result.actualValue); // 150
```

#### `evaluateConditionGroup(group, context)`

Evaluates a group of conditions with AND/OR logic.

```typescript
const result = evaluateConditionGroup(
   {
      id: "g1",
      operator: "AND",
      conditions: [
         { id: "1", type: "string", field: "status", operator: "eq", value: "active" },
         { id: "2", type: "number", field: "score", operator: "gte", value: 80 },
      ],
   },
   { data: { status: "active", score: 95 } },
);

console.log(result.passed); // true
```

#### `evaluateConditions(groups, context)`

Evaluates multiple condition groups (all must pass).

```typescript
const { passed, results } = evaluateConditions(
   [group1, group2],
   { data: { ... } }
);
```

#### `evaluate(conditionOrGroup, context)`

Universal function that handles both single conditions and groups.

### Condition Types & Operators

#### String Operators

| Operator       | Description                    | Value Type |
| -------------- | ------------------------------ | ---------- |
| `eq`           | Equals                         | `string`   |
| `neq`          | Not equals                     | `string`   |
| `contains`     | Contains substring             | `string`   |
| `not_contains` | Does not contain substring     | `string`   |
| `starts_with`  | Starts with                    | `string`   |
| `ends_with`    | Ends with                      | `string`   |
| `matches`      | Matches regex pattern          | `string`   |
| `is_empty`     | Is empty/null/undefined        | -          |
| `is_not_empty` | Is not empty                   | -          |
| `in`           | Value is in list               | `string[]` |
| `not_in`       | Value is not in list           | `string[]` |

Options: `caseSensitive`, `trim`

#### Number Operators

| Operator      | Description            | Value Type           |
| ------------- | ---------------------- | -------------------- |
| `eq`          | Equals                 | `number`             |
| `neq`         | Not equals             | `number`             |
| `gt`          | Greater than           | `number`             |
| `gte`         | Greater than or equal  | `number`             |
| `lt`          | Less than              | `number`             |
| `lte`         | Less than or equal     | `number`             |
| `between`     | Between two values     | `[number, number]`   |
| `not_between` | Not between two values | `[number, number]`   |

#### Boolean Operators

| Operator   | Description | Value Type  |
| ---------- | ----------- | ----------- |
| `eq`       | Equals      | `boolean`   |
| `neq`      | Not equals  | `boolean`   |
| `is_true`  | Is true     | -           |
| `is_false` | Is false    | -           |

#### Date Operators

| Operator       | Description              | Value Type                   |
| -------------- | ------------------------ | ---------------------------- |
| `eq`           | Equals                   | `string \| Date \| number`   |
| `neq`          | Not equals               | `string \| Date \| number`   |
| `before`       | Before date              | `string \| Date \| number`   |
| `after`        | After date               | `string \| Date \| number`   |
| `between`      | Between two dates        | `[DateValue, DateValue]`     |
| `not_between`  | Not between two dates    | `[DateValue, DateValue]`     |
| `is_weekend`   | Is Saturday or Sunday    | -                            |
| `is_weekday`   | Is Monday-Friday         | -                            |
| `day_of_week`  | Matches day(s) of week   | `number \| number[]` (0-6)   |
| `day_of_month` | Matches day(s) of month  | `number \| number[]` (1-31)  |

#### Array Operators

| Operator       | Description              | Value Type  |
| -------------- | ------------------------ | ----------- |
| `contains`     | Contains item            | `unknown`   |
| `not_contains` | Does not contain item    | `unknown`   |
| `contains_all` | Contains all items       | `unknown[]` |
| `contains_any` | Contains any item        | `unknown[]` |
| `is_empty`     | Array is empty           | -           |
| `is_not_empty` | Array is not empty       | -           |
| `length_eq`    | Length equals            | `number`    |
| `length_gt`    | Length greater than      | `number`    |
| `length_lt`    | Length less than         | `number`    |

### Condition Options

All conditions support a `negate` option to invert the result:

```typescript
{
   id: "1",
   type: "string",
   field: "status",
   operator: "eq",
   value: "active",
   options: { negate: true } // Will pass if status is NOT "active"
}
```

### Nested Groups

Groups can be nested for complex logic:

```typescript
const group: ConditionGroup = {
   id: "root",
   operator: "AND",
   conditions: [
      { id: "1", type: "string", field: "status", operator: "eq", value: "active" },
      {
         id: "nested",
         operator: "OR",
         conditions: [
            { id: "2", type: "number", field: "score", operator: "gt", value: 90 },
            { id: "3", type: "string", field: "role", operator: "eq", value: "admin" },
         ],
      },
   ],
};
```

### Schemas

All Zod schemas are exported for custom validation:

```typescript
import {
   StringCondition,
   NumberCondition,
   Condition,
   ConditionGroup,
   EvaluationContext,
} from "@f-o-t/condition-evaluator";

// Validate a condition
const result = Condition.safeParse(myCondition);
if (!result.success) {
   console.error(result.error);
}
```

### Individual Operator Functions

Low-level operator functions are also exported:

```typescript
import {
   evaluateString,
   evaluateNumber,
   evaluateBoolean,
   evaluateDate,
   evaluateArray,
} from "@f-o-t/condition-evaluator";

// Direct evaluation without full condition structure
const passed = evaluateString("contains", "hello world", "world");
```

## Types

```typescript
type EvaluationContext = {
   data: Record<string, unknown>;
   metadata?: Record<string, unknown>;
};

type EvaluationResult = {
   conditionId: string;
   passed: boolean;
   field: string;
   operator: string;
   actualValue: unknown;
   expectedValue?: unknown;
   error?: string;
};

type GroupEvaluationResult = {
   groupId: string;
   operator: "AND" | "OR";
   passed: boolean;
   results: (EvaluationResult | GroupEvaluationResult)[];
};
```

## Plugin System

Create custom operators for domain-specific logic:

```typescript
import { createOperator, createEvaluator } from "@f-o-t/condition-evaluator";
import { z } from "zod";

// Define a custom operator
const isPalindrome = createOperator({
   name: "is_palindrome",
   valueSchema: z.undefined(),
   evaluate: (actual) => {
      if (typeof actual !== "string") return false;
      const cleaned = actual.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleaned === cleaned.split("").reverse().join("");
   },
   reason: (passed, actual) =>
      passed ? `"${actual}" is a palindrome` : `"${actual}" is not a palindrome`,
});

// Create evaluator with custom operators
const customEvaluator = createEvaluator({
   operators: { is_palindrome: isPalindrome },
});

// Use with custom condition type
const result = customEvaluator.evaluateCondition(
   {
      id: "1",
      type: "custom",
      field: "word",
      operator: "is_palindrome",
   },
   { data: { word: "racecar" } },
);
```

## Weighted Scoring

Use weighted conditions for fuzzy matching:

```typescript
const result = evaluateConditionGroup(
   {
      id: "g1",
      operator: "AND",
      scoringMode: "weighted",
      threshold: 0.7, // 70% score required to pass
      conditions: [
         { id: "1", type: "string", field: "name", operator: "eq", value: "John", weight: 2 },
         { id: "2", type: "number", field: "age", operator: "gte", value: 18, weight: 1 },
      ],
   },
   { data: { name: "John", age: 16 } },
);

console.log(result.totalScore); // 2 (name matched)
console.log(result.maxPossibleScore); // 3 (total weights)
console.log(result.scorePercentage); // 0.666...
```

## Dynamic References

Compare fields against other fields:

```typescript
const condition: Condition = {
   id: "1",
   type: "number",
   field: "currentPrice",
   operator: "lt",
   valueRef: "maxBudget", // Compare against another field
};

evaluateCondition(condition, { data: { currentPrice: 50, maxBudget: 100 } });
// Passes because 50 < 100
```

## Dependency Extraction

Analyze condition dependencies for static analysis:

```typescript
import { extractDependencies } from "@f-o-t/condition-evaluator";

const deps = extractDependencies(conditionGroup);
console.log(deps.fields); // ["user.name", "order.total"]
console.log(deps.references); // ["limits.maxOrder"]
console.log(deps.maxDepth); // 2
```

## License

MIT
