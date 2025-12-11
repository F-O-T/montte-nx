# Workflows Package Migration Plan

## Overview

Migration from `@packages/rules-engine` to `@packages/workflows` with full integration of `@f-o-t/rules-engine` library.

| Item | Decision |
|------|----------|
| **Package name** | `@packages/workflows` |
| **Trigger design** | Registry-based with entity convention |
| **Action location** | All in workflows package with registry |
| **Library features** | Full (versioning, conflicts, analysis) |
| **File structure** | No barrel files, one handler per file |
| **Database changes** | 3 new columns + version history table |
| **Tests** | Comprehensive suite |
| **Queue name** | Rename to `workflow-events` |
| **Version history** | Automatic on every save |

---

## Phase 1: Database Schema Changes

### 1.1 Update `automationRule` Table

**File:** `packages/database/src/schemas/automations.ts`

**Add 3 new columns:**

```typescript
tags: text("tags").array().default([]),
category: text("category"),
metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
```

**Add new indexes:**

```typescript
index("idx_automation_rule_tags").using("gin", table.tags),
index("idx_automation_rule_category").on(table.category),
```

### 1.2 Create Version History Table

**New table:** `automationRuleVersion`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `ruleId` | `uuid` | FK to automation_rule |
| `version` | `integer` | Version number (1, 2, 3...) |
| `snapshot` | `jsonb` | Full rule state at this version |
| `changeType` | `text` | 'created' \| 'updated' \| 'restored' \| 'deleted' |
| `changedBy` | `uuid` | FK to user (nullable) |
| `changedAt` | `timestamp` | When change occurred |
| `changeDescription` | `text` | Optional description of change |
| `diff` | `jsonb` | What changed from previous version |

**Indexes:**

- `idx_automation_rule_version_rule` on `ruleId`
- `idx_automation_rule_version_rule_version` unique on `(ruleId, version)`

### 1.3 Create Version Repository

**New file:** `packages/database/src/repositories/automation-version-repository.ts`

**Functions:**

- `createVersion(db, ruleId, snapshot, changeType, changedBy?, changeDescription?, diff?)`
- `getVersionHistory(db, ruleId, limit?, offset?)`
- `getVersion(db, ruleId, version)`
- `getLatestVersion(db, ruleId)`
- `restoreVersion(db, ruleId, version)`
- `deleteVersionsForRule(db, ruleId)`
- `pruneOldVersions(db, ruleId, keepCount)`

### 1.4 Update Type Exports

```typescript
export type RuleChangeType = "created" | "updated" | "restored" | "deleted";

export type RelatedEntityType = 
   | "transaction";
   // Extensible - add more as needed
```

---

## Phase 2: Delete Old Package

**Delete entire directory:** `packages/rules-engine/`

**Files to delete:**

```
packages/rules-engine/
├── __tests__/
│   ├── executor.test.ts
│   └── runner.test.ts
├── src/
│   ├── engine/
│   │   ├── executor.ts
│   │   └── runner.ts
│   ├── queue/
│   │   ├── consumer.ts
│   │   ├── producer.ts
│   │   └── queues.ts
│   └── types/
│       ├── actions.ts
│       ├── conditions.ts
│       ├── events.ts
│       └── rules.ts
├── package.json
└── tsconfig.json
```

---

## Phase 3: Create `@packages/workflows`

### 3.1 Package Structure

```
packages/workflows/
├── __tests__/
│   ├── actions/
│   │   ├── add-tag.test.ts
│   │   ├── create-transaction.test.ts
│   │   ├── executor.test.ts
│   │   ├── registry.test.ts
│   │   ├── remove-tag.test.ts
│   │   ├── send-email.test.ts
│   │   ├── send-push-notification.test.ts
│   │   ├── set-category.test.ts
│   │   ├── set-cost-center.test.ts
│   │   ├── stop-execution.test.ts
│   │   └── update-description.test.ts
│   ├── analysis/
│   │   └── analyzer.test.ts
│   ├── engine/
│   │   ├── adapter.test.ts
│   │   ├── factory.test.ts
│   │   └── runner.test.ts
│   ├── integration/
│   │   ├── end-to-end.test.ts
│   │   └── workflow-execution.test.ts
│   ├── queue/
│   │   ├── consumer.test.ts
│   │   └── producer.test.ts
│   ├── simulation/
│   │   └── simulator.test.ts
│   ├── triggers/
│   │   └── registry.test.ts
│   ├── validation/
│   │   └── validator.test.ts
│   └── versioning/
│       └── version-manager.test.ts
├── src/
│   ├── actions/
│   │   ├── handlers/
│   │   │   ├── add-tag.ts
│   │   │   ├── create-transaction.ts
│   │   │   ├── remove-tag.ts
│   │   │   ├── send-email.ts
│   │   │   ├── send-push-notification.ts
│   │   │   ├── set-category.ts
│   │   │   ├── set-cost-center.ts
│   │   │   ├── stop-execution.ts
│   │   │   └── update-description.ts
│   │   ├── executor.ts
│   │   └── registry.ts
│   ├── analysis/
│   │   └── analyzer.ts
│   ├── engine/
│   │   ├── adapter.ts
│   │   ├── factory.ts
│   │   └── runner.ts
│   ├── queue/
│   │   ├── consumer.ts
│   │   ├── producer.ts
│   │   └── queues.ts
│   ├── simulation/
│   │   └── simulator.ts
│   ├── triggers/
│   │   ├── definitions.ts
│   │   └── registry.ts
│   ├── types/
│   │   ├── actions.ts
│   │   ├── conditions.ts
│   │   ├── events.ts
│   │   └── rules.ts
│   ├── utils/
│   │   └── template.ts
│   ├── validation/
│   │   └── validator.ts
│   └── versioning/
│       └── version-manager.ts
├── package.json
└── tsconfig.json
```

### 3.2 Package Configuration

**package.json:**

```json
{
   "name": "@packages/workflows",
   "version": "0.1.0",
   "private": true,
   "type": "module",
   "license": "Apache-2.0",
   "scripts": {
      "build": "tsc --build",
      "test": "bun test",
      "typecheck": "tsc"
   },
   "dependencies": {
      "@f-o-t/condition-evaluator": "workspace:*",
      "@f-o-t/rules-engine": "workspace:*",
      "@packages/database": "workspace:*",
      "@packages/queue": "workspace:*"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "typescript": "catalog:development"
   },
   "exports": {
      "./actions/handlers/*": { "default": "./src/actions/handlers/*.ts" },
      "./actions/*": { "default": "./src/actions/*.ts" },
      "./analysis/*": { "default": "./src/analysis/*.ts" },
      "./engine/*": { "default": "./src/engine/*.ts" },
      "./queue/*": { "default": "./src/queue/*.ts" },
      "./simulation/*": { "default": "./src/simulation/*.ts" },
      "./triggers/*": { "default": "./src/triggers/*.ts" },
      "./types/*": { "default": "./src/types/*.ts" },
      "./utils/*": { "default": "./src/utils/*.ts" },
      "./validation/*": { "default": "./src/validation/*.ts" },
      "./versioning/*": { "default": "./src/versioning/*.ts" }
   }
}
```

**tsconfig.json:**

```json
{
   "extends": "@tooling/typescript/internal-package.json",
   "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "."
   },
   "include": ["src/**/*.ts", "__tests__/**/*.ts"]
}
```

### 3.3 Module Descriptions

#### Types (`src/types/`)

| File | Purpose |
|------|---------|
| `actions.ts` | Action types, ActionConfig, ActionDefinition, execution context/result types |
| `conditions.ts` | Re-export condition types from library, field definitions for UI |
| `events.ts` | Event types (TransactionEvent, future events), event factory functions |
| `rules.ts` | WorkflowRule type (extends DB type), execution result types |

#### Triggers (`src/triggers/`)

| File | Purpose |
|------|---------|
| `definitions.ts` | TRIGGER_DEFINITIONS array with labels, descriptions, schemas |
| `registry.ts` | TriggerRegistry class - register, get, list triggers, validation |

#### Actions (`src/actions/`)

| File | Purpose |
|------|---------|
| `handlers/*.ts` | One file per action type, each exports a single handler function |
| `registry.ts` | ActionRegistry - maps action types to handlers, registration |
| `executor.ts` | executeAction(), executeActions() - orchestrates handler execution |

#### Engine (`src/engine/`)

| File | Purpose |
|------|---------|
| `adapter.ts` | Converts DB WorkflowRule <-> Library Rule format |
| `factory.ts` | Creates configured library engine instances with caching |
| `runner.ts` | runRule(), runRules(), runRulesForEvent() - main execution logic |

#### Queue (`src/queue/`)

| File | Purpose |
|------|---------|
| `queues.ts` | Queue name (`workflow-events`), job types, queue instance management |
| `producer.ts` | emitWorkflowEvent(), emitTransactionCreated/Updated(), emitManualTrigger() |
| `consumer.ts` | startWorkflowConsumer(), processWorkflowJob() |

#### Validation (`src/validation/`)

| File | Purpose |
|------|---------|
| `validator.ts` | validateWorkflowRule(), detectConflicts(), checkIntegrity() - wraps library |

#### Simulation (`src/simulation/`)

| File | Purpose |
|------|---------|
| `simulator.ts` | simulateWorkflow(), whatIf(), dryRun() - wraps library simulation |

#### Analysis (`src/analysis/`)

| File | Purpose |
|------|---------|
| `analyzer.ts` | analyzeWorkflow(), getOptimizationSuggestions(), getComplexityScore() |

#### Versioning (`src/versioning/`)

| File | Purpose |
|------|---------|
| `version-manager.ts` | createVersion(), getVersionHistory(), restoreVersion(), diffVersions() - integrates with DB repository |

#### Utils (`src/utils/`)

| File | Purpose |
|------|---------|
| `template.ts` | interpolateTemplate(), getNestedValue() - template variable substitution |

---

## Phase 4: Update Consumers

### 4.1 Files to Update

| File | Change |
|------|--------|
| `apps/worker/package.json` | `@packages/rules-engine` -> `@packages/workflows` |
| `apps/worker/src/index.ts` | Update imports |
| `apps/server/package.json` | `@packages/rules-engine` -> `@packages/workflows` |
| `packages/api/package.json` | `@packages/rules-engine` -> `@packages/workflows` |
| `packages/api/src/server/routers/automations.ts` | Update imports |
| `packages/api/src/server/routers/transactions.ts` | Update imports |

### 4.2 Import Changes

**apps/worker/src/index.ts:**

```typescript
// From
import { startAutomationConsumer } from "@packages/rules-engine/queue/consumer";
import type { AutomationRule } from "@packages/rules-engine/types/rules";

// To
import { startWorkflowConsumer } from "@packages/workflows/queue/consumer";
import type { WorkflowRule } from "@packages/workflows/types/rules";
```

**packages/api/src/server/routers/automations.ts:**

```typescript
// From
import { emitManualTrigger } from "@packages/rules-engine/queue/producer";
import type { AutomationEvent } from "@packages/rules-engine/types/events";

// To
import { emitManualTrigger } from "@packages/workflows/queue/producer";
import type { WorkflowEvent } from "@packages/workflows/types/events";
```

**packages/api/src/server/routers/transactions.ts:**

```typescript
// From
import {
   emitTransactionCreatedEvent,
   emitTransactionUpdatedEvent,
} from "@packages/rules-engine/queue/producer";
import type { TransactionEventData } from "@packages/rules-engine/types/events";

// To
import {
   emitTransactionCreatedEvent,
   emitTransactionUpdatedEvent,
} from "@packages/workflows/queue/producer";
import type { TransactionEventData } from "@packages/workflows/types/events";
```

---

## Phase 5: Comprehensive Test Suite

### 5.1 Test Coverage Matrix

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `actions/set-category.test.ts` | Success, missing categoryId, missing transactionId, missing db, dry-run, db error | 100% |
| `actions/add-tag.test.ts` | Success, missing tagIds, empty tagIds, missing transactionId, dry-run, partial failure | 100% |
| `actions/remove-tag.test.ts` | Success, missing tagIds, dry-run, partial failure | 100% |
| `actions/set-cost-center.test.ts` | Success, missing costCenterId, dry-run, db error | 100% |
| `actions/update-description.test.ts` | Replace/append/prepend modes, template interpolation, nested variables, missing variables | 100% |
| `actions/create-transaction.test.ts` | Fixed amount, field amount, invalid amount, date handling, template description | 100% |
| `actions/send-push-notification.test.ts` | Success, missing title/body, template interpolation, url handling | 100% |
| `actions/send-email.test.ts` | Owner recipient, custom recipient, missing custom email, template interpolation | 100% |
| `actions/stop-execution.test.ts` | Default reason, custom reason, stopped flag | 100% |
| `actions/executor.test.ts` | Sequential execution, stop-on-error, continue-on-error, stop_execution handling, empty actions | 100% |
| `actions/registry.test.ts` | Register handler, get handler, unknown type, list handlers | 100% |
| `engine/adapter.test.ts` | DB->Library conversion, Library->DB conversion, conditions wrapping, edge cases | 100% |
| `engine/factory.test.ts` | Create engine, caching config, hooks setup | 100% |
| `engine/runner.test.ts` | Condition pass/fail, action execution, priority order, stopOnFirstMatch, logging, dry-run | 100% |
| `queue/producer.test.ts` | Emit events, job options, manual trigger, queue stats | 100% |
| `queue/consumer.test.ts` | Process job, error handling, callbacks, concurrency | 100% |
| `triggers/registry.test.ts` | Register trigger, get trigger, list by category, validate trigger | 100% |
| `validation/validator.test.ts` | Valid rule, invalid rule, conflict detection, integrity check | 100% |
| `simulation/simulator.test.ts` | Dry-run, what-if comparison, batch simulation | 100% |
| `analysis/analyzer.test.ts` | Complexity score, optimization suggestions, field usage | 100% |
| `versioning/version-manager.test.ts` | Create version, get history, restore, diff, prune old | 100% |
| `integration/workflow-execution.test.ts` | Full flow: event -> match -> execute -> log | 100% |
| `integration/end-to-end.test.ts` | Producer -> Queue -> Consumer -> Runner -> Actions -> DB | 100% |

### 5.2 Edge Cases Covered

**Conditions:**

- Empty conditions (always pass)
- Nested AND/OR groups
- Invalid operator handling
- Missing field in event data

**Actions:**

- All 9 action types
- Template interpolation edge cases
- Database failures
- Partial success scenarios

**Execution:**

- Multiple rules, priority ordering
- Stop on first match
- Stop execution action
- Continue on error flag
- Dry run mode

**Queue:**

- Job retry on failure
- Concurrent processing
- Connection failures

**Versioning:**

- Automatic version creation on save
- Restore versions
- Diff between versions
- Prune old versions

**Analysis:**

- Complex rule suggestions
- Conflicting rules detection
- Unused field warnings

---

## Phase 6: Verification

### 6.1 Verification Steps

1. **Typecheck:** `bun run typecheck`
2. **Tests:** `nx run @packages/workflows:test`
3. **Full build:** `bun run build:all`
4. **Database push:** `bun run db:push`
5. **Manual verification:** Start worker, trigger transaction, verify workflow runs

---

## Implementation Order

| Step | Phase | Description | Files |
|------|-------|-------------|-------|
| 1 | 1.1 | Add columns to automationRule | `packages/database/src/schemas/automations.ts` |
| 2 | 1.2 | Create version history table | `packages/database/src/schemas/automations.ts` |
| 3 | 1.3 | Add version repository | `packages/database/src/repositories/automation-version-repository.ts` |
| 4 | 2.1 | Delete old package | `packages/rules-engine/` (delete) |
| 5 | 3.1 | Create package structure | `packages/workflows/` |
| 6 | 3.2 | Create package.json & tsconfig | `packages/workflows/package.json`, `tsconfig.json` |
| 7 | 3.3a | Create types | `src/types/*.ts` |
| 8 | 3.3b | Create triggers | `src/triggers/*.ts` |
| 9 | 3.3c | Create utils | `src/utils/*.ts` |
| 10 | 3.3d | Create action handlers | `src/actions/handlers/*.ts` |
| 11 | 3.3e | Create action orchestration | `src/actions/executor.ts`, `registry.ts` |
| 12 | 3.3f | Create engine | `src/engine/*.ts` |
| 13 | 3.3g | Create queue | `src/queue/*.ts` |
| 14 | 3.3h | Create validation | `src/validation/*.ts` |
| 15 | 3.3i | Create simulation | `src/simulation/*.ts` |
| 16 | 3.3j | Create analysis | `src/analysis/*.ts` |
| 17 | 3.3k | Create versioning | `src/versioning/*.ts` |
| 18 | 4 | Update consumers | `apps/worker`, `packages/api` |
| 19 | 5 | Create test suite | `__tests__/**/*.test.ts` |
| 20 | 6 | Run tests & verify | - |

---

## File Count Summary

| Category | Files |
|----------|-------|
| Source files | 25 |
| Test files | 23 |
| Config files | 2 |
| Database files | 2 |
| **Total** | **52** |

---

## Key Design Decisions

### 1. Registry Pattern for Triggers

Triggers are registered in a registry, making it easy to add new triggers without modifying core code:

```typescript
// Future: easily add more
triggerRegistry.set('invoice.paid', { ... });
triggerRegistry.set('budget.exceeded', { ... });
triggerRegistry.set('schedule.daily', { ... });
```

### 2. Registry Pattern for Actions

Actions are registered similarly, allowing for extensibility:

```typescript
actionRegistry.set('set_category', setCategoryHandler);
actionRegistry.set('add_tag', addTagHandler);
// Future: easily add more
actionRegistry.set('create_invoice', createInvoiceHandler);
```

### 3. Adapter for Library Integration

The adapter converts between your database model and the library's rule format:

- DB `ConditionGroup[]` -> Library single `ConditionGroup` (wrapped in AND)
- DB `isActive` -> Library `enabled`
- DB `stopOnFirstMatch` -> Library `stopOnMatch`
- DB `actions` kept separate (library uses `consequences`)

### 4. Automatic Versioning

Every time a rule is saved (create/update), a version is automatically created:

```typescript
// In automation-repository.ts update function
await createVersion(db, {
   ruleId,
   version: latestVersion + 1,
   snapshot: updatedRule,
   changeType: 'updated',
   changedBy: userId,
});
```

### 5. Frontend Integration Points

The following features are exposed for frontend use:

| Feature | Function | Frontend Use Case |
|---------|----------|-------------------|
| Validation | `validateWorkflowRule()` | Real-time validation in builder |
| Conflicts | `detectConflicts()` | Warning about overlapping rules |
| Analysis | `analyzeWorkflow()` | Complexity score, optimization tips |
| Simulation | `simulateWorkflow()` | "Test" button in builder |
| What-If | `whatIf()` | Compare before/after changes |
| Version History | `getVersionHistory()` | "View history" panel |
| Restore | `restoreVersion()` | "Restore to version X" action |
