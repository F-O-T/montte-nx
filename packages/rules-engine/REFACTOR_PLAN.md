# Rules Engine & Queue Refactoring Plan

## Overview

This refactor will:
1. Remove all barrel files from `@packages/queue` and `@packages/rules-engine`
2. Convert all TypeScript interfaces to Zod schemas with `z.infer<>` types
3. Include definitions (constants like `ACTION_DEFINITIONS`) inside the Zod schema files
4. Split the monolithic `executor.ts` into separate files per action type
5. Create an internal events module for event handling/emitting
6. Move shared utilities to proper locations
7. Update all imports across the codebase

---

## Tasks

### 1. Utils Package Updates

- [x] 1.1 Improve `normalizeText` function in `@packages/utils/src/text.ts`
- [x] 1.2 Create `@packages/utils/src/object.ts` with `getNestedValue` and `interpolateTemplate`
- [x] 1.3 Update `@packages/utils/package.json` exports

### 2. Queue Package Refactor

- [x] 2.1 Add `zod` dependency to `@packages/queue/package.json`
- [x] 2.2 Convert `@packages/queue/src/types.ts` to Zod schemas
- [x] 2.3 Create `@packages/queue/src/bullmq.ts` for bullmq re-exports
- [x] 2.4 Update `@packages/queue/src/connection.ts` imports
- [x] 2.5 Delete `@packages/queue/src/index.ts` (barrel file)
- [x] 2.6 Update `@packages/queue/package.json` exports

### 3. Rules Engine - Schemas

- [x] 3.1 Create `@packages/rules-engine/src/schemas/actions.ts`
- [x] 3.2 Create `@packages/rules-engine/src/schemas/conditions.ts`
- [x] 3.3 Create `@packages/rules-engine/src/schemas/events.ts`
- [x] 3.4 Create `@packages/rules-engine/src/schemas/rules.ts`

### 4. Rules Engine - Events Module

- [x] 4.1 Create `@packages/rules-engine/src/events/events.ts`

### 5. Rules Engine - Internal Utils

- [x] 5.1 Create `@packages/rules-engine/src/utils.ts`

### 6. Rules Engine - Split Executors

- [x] 6.1 Create `@packages/rules-engine/src/engine/executors/tag.ts`
- [x] 6.2 Create `@packages/rules-engine/src/engine/executors/category.ts`
- [x] 6.3 Create `@packages/rules-engine/src/engine/executors/cost-center.ts`
- [x] 6.4 Create `@packages/rules-engine/src/engine/executors/description.ts`
- [x] 6.5 Create `@packages/rules-engine/src/engine/executors/transaction.ts`
- [x] 6.6 Create `@packages/rules-engine/src/engine/executors/notification.ts`
- [x] 6.7 Create `@packages/rules-engine/src/engine/executors/control.ts`
- [x] 6.8 Create `@packages/rules-engine/src/engine/executors/executor.ts` (orchestrator)

### 7. Rules Engine - Update Existing Files

- [x] 7.1 Update `@packages/rules-engine/src/engine/evaluator.ts`
- [x] 7.2 Update `@packages/rules-engine/src/engine/runner.ts`
- [x] 7.3 Update `@packages/rules-engine/src/queue/queues.ts`
- [x] 7.4 Update `@packages/rules-engine/src/queue/producer.ts`
- [x] 7.5 Update `@packages/rules-engine/src/queue/consumer.ts`

### 8. Rules Engine - Cleanup

- [x] 8.1 Delete `@packages/rules-engine/src/index.ts`
- [x] 8.2 Delete `@packages/rules-engine/src/engine/index.ts`
- [x] 8.3 Delete `@packages/rules-engine/src/queue/index.ts`
- [x] 8.4 Delete `@packages/rules-engine/src/types/index.ts`
- [x] 8.5 Delete `@packages/rules-engine/src/types/actions.ts`
- [x] 8.6 Delete `@packages/rules-engine/src/types/conditions.ts`
- [x] 8.7 Delete `@packages/rules-engine/src/types/events.ts`
- [x] 8.8 Delete `@packages/rules-engine/src/types/rules.ts`
- [x] 8.9 Delete `@packages/rules-engine/src/engine/executor.ts` (old monolithic file)
- [x] 8.10 Update `@packages/rules-engine/package.json`

### 9. Update Tests

- [x] 9.1 Update `@packages/rules-engine/__tests__/evaluator.test.ts`
- [x] 9.2 Update `@packages/rules-engine/__tests__/executor.test.ts`
- [x] 9.3 Update `@packages/rules-engine/__tests__/runner.test.ts`

### 10. Update External Consumers

- [x] 10.1 Update `packages/api/src/server/routers/transactions.ts`
- [x] 10.2 Update `packages/api/src/server/routers/automations.ts`
- [x] 10.3 Update `apps/worker/src/index.ts`
- [x] 10.4 Update `apps/server/src/integrations/webhooks.ts`

### 11. Verification

- [x] 11.1 Run typecheck
- [x] 11.2 Run tests

---

## File Changes Summary

| Package | Files Created | Files Modified | Files Deleted |
|---------|---------------|----------------|---------------|
| `@packages/utils` | 1 (object.ts) | 2 (text.ts, package.json) | 0 |
| `@packages/queue` | 1 (bullmq.ts) | 3 (types.ts, connection.ts, package.json) | 1 (index.ts) |
| `@packages/rules-engine` | 12 | 6 | 9 |
| External consumers | 0 | 4 | 0 |
