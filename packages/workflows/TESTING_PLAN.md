# Comprehensive Testing Plan for @packages/workflows

## Overview

This plan covers:
1. **Email Integration** - New workflow email template + handler integration
2. **Environment Updates** - RESEND_API_KEY and VAPID keys for worker
3. **Test Suite** - Complete testing for `@packages/workflows` (~230 tests)

### Current State

| Metric | Value |
|--------|-------|
| Test files | 2 |
| Total tests | ~45 |
| Coverage | ~10% |

### Target State

| Metric | Value |
|--------|-------|
| Test files | 24 |
| Total tests | ~275 |
| Coverage | >90% |

---

## Part 1: Email Integration

### 1.1 New Email Template

**File:** `packages/transactional/src/emails/workflow-notification.tsx`

Creates a branded email template for workflow notifications that:
- Uses existing `DefaultEmailLayout`, `DefaultHeading`, `DefaultFooter`
- Supports HTML body content from workflow action config
- Maintains consistent branding with other system emails

```typescript
interface WorkflowNotificationEmailProps {
   body: string;      // HTML content from workflow config
}
```

### 1.2 New Email Send Function

**File:** `packages/transactional/src/client.tsx`

Add new function:
```typescript
export interface SendWorkflowEmailOptions {
   to: string;
   subject: string;
   body: string;  // HTML content
}

export const sendWorkflowEmail = async (
   client: Resend,
   options: SendWorkflowEmailOptions,
) => { ... }
```

---

## Part 2: Worker Environment Updates

### 2.1 Worker Environment Schema

**File:** `packages/environment/src/worker.ts`

Add to schema:
- `RESEND_API_KEY` - For email sending
- `VAPID_PUBLIC_KEY` - For push notifications
- `VAPID_PRIVATE_KEY` - For push notifications  
- `VAPID_SUBJECT` - For push notifications (with default)

### 2.2 Worker .env.example

**File:** `apps/worker/.env.example`

Add:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:contato@montte.co
```

---

## Part 3: Workflow Package Updates

### 3.1 Action Handler Context

**File:** `packages/workflows/src/actions/types.ts`

Update `ActionHandlerContext` to include:
```typescript
resendClient?: ResendClient;
vapidConfig?: {
   publicKey: string;
   privateKey: string;
   subject: string;
};
```

### 3.2 Worker Config

**File:** `packages/workflows/src/queue/consumer.ts`

Update `WorkflowWorkerConfig` to accept:
- `resendClient` - Resend client instance
- `vapidConfig` - VAPID configuration object

### 3.3 Handler Updates

**Files:**
- `packages/workflows/src/actions/handlers/send-email.ts` - Use `context.resendClient`
- `packages/workflows/src/actions/handlers/send-push-notification.ts` - Use `context.vapidConfig`

### 3.4 Worker Entry

**File:** `apps/worker/src/index.ts`

- Initialize Resend client
- Pass `resendClient` and `vapidConfig` to `createWorkflowWorker`

---

## Part 4: Test Suite

### 4.1 Test Helper Files

| File | Purpose |
|------|---------|
| `__tests__/helpers/mock-db.ts` | Database mock factory with chainable query builders |
| `__tests__/helpers/mock-context.ts` | Action handler context factory |
| `__tests__/helpers/fixtures.ts` | Reusable test data (events, actions, rules) |

### 4.2 Phase 1: Pure Functions

**No mocking required** - Tests pure transformation and utility functions.

| File | Tests | Module |
|------|-------|--------|
| `adapter.test.ts` | ~15 | `src/engine/adapter.ts` |
| `actions-types.test.ts` | ~18 | `src/types/actions.ts` |
| `conditions-types.test.ts` | ~20 | `src/types/conditions.ts` |
| `rules-types.test.ts` | ~12 | `src/types/rules.ts` |
| `triggers-definitions.test.ts` | ~15 | `src/triggers/definitions.ts` |
| `action-helpers.test.ts` | ~10 | `src/actions/types.ts` |

**Total: 6 files, ~90 tests**

### 4.3 Phase 2: Registries

**Minimal mocking** - Tests registry state management.

| File | Tests | Module |
|------|-------|--------|
| `registry.test.ts` | ~15 | `src/actions/registry.ts` |
| `triggers-registry.test.ts` | ~18 | `src/triggers/registry.ts` |

**Total: 2 files, ~33 tests**

### 4.4 Phase 3: Action Handlers

**Database mocking required** - Each handler tests:
- Success case
- Dry run mode
- Missing config validation
- Missing transaction ID handling
- Database error handling
- validate() method

| File | Tests | Mocks |
|------|-------|-------|
| `handlers/set-category.test.ts` | ~10 | DB |
| `handlers/add-tag.test.ts` | ~12 | DB |
| `handlers/remove-tag.test.ts` | ~10 | DB |
| `handlers/set-cost-center.test.ts` | ~11 | DB |
| `handlers/update-description.test.ts` | ~14 | DB |
| `handlers/create-transaction.test.ts` | ~16 | DB |
| `handlers/send-push-notification.test.ts` | ~12 | DB, auth-repository, notifications/push |
| `handlers/send-email.test.ts` | ~14 | DB, auth-repository, transactional/resend |
| `handlers/stop-execution.test.ts` | ~8 | None |

**Total: 9 files, ~107 tests**

### 4.5 Phase 4: Executor & Runner

**Full integration mocking** - Tests orchestration logic.

| File | Tests | Mocks |
|------|-------|-------|
| `executor.test.ts` | ~18 | Action handlers |
| `runner.test.ts` | ~22 | condition-evaluator, automation-repository, executor |

**Total: 2 files, ~40 tests**

### 4.6 Phase 5: Queue Layer

**BullMQ mocking** - Tests queue operations.

| File | Tests | Mocks |
|------|-------|-------|
| `queues.test.ts` | ~10 | @packages/queue/bullmq |
| `producer.test.ts` | ~12 | Queue singleton |
| `consumer.test.ts` | ~12 | @packages/queue/bullmq, runner |

**Total: 3 files, ~34 tests**

---

## Implementation Order

### Step 1: Email Integration (Real Feature)

1. Create workflow email template
2. Add sendWorkflowEmail function
3. Update worker environment schema
4. Update worker .env.example
5. Update ActionHandlerContext type
6. Update WorkflowWorkerConfig
7. Update runner to pass context
8. Update executor to pass context
9. Update send_email handler
10. Update send_push_notification handler
11. Update worker entry

### Step 2: Test Infrastructure

12. Create test helpers (mock-db, mock-context, fixtures)

### Step 3: Tests by Phase

13. Phase 1: Pure function tests (6 files)
14. Phase 2: Registry tests (2 files)
15. Phase 3: Handler tests (9 files)
16. Phase 4: Executor & Runner tests (2 files)
17. Phase 5: Queue tests (3 files)

### Step 4: Validation

18. Run all tests
19. Run typecheck
20. Run format

---

## File Summary

### New Files (25)

| Category | Files |
|----------|-------|
| Email Template | 1 |
| Test Helpers | 3 |
| Test Files | 21 |

### Modified Files (10)

| File | Changes |
|------|---------|
| `packages/transactional/src/client.tsx` | Add sendWorkflowEmail |
| `packages/environment/src/worker.ts` | Add RESEND_API_KEY, VAPID_* |
| `apps/worker/.env.example` | Add new env vars |
| `apps/worker/src/index.ts` | Initialize clients, pass configs |
| `packages/workflows/src/actions/types.ts` | Add to context type |
| `packages/workflows/src/queue/consumer.ts` | Add to config, pass through |
| `packages/workflows/src/engine/runner.ts` | Accept and pass context |
| `packages/workflows/src/actions/executor.ts` | Pass context to handlers |
| `packages/workflows/src/actions/handlers/send-email.ts` | Use resendClient |
| `packages/workflows/src/actions/handlers/send-push-notification.ts` | Use vapidConfig |

---

## Test Patterns

### Database Mock Pattern

```typescript
export function createMockDb(overrides = {}) {
   return {
      select: () => ({
         from: () => ({
            where: () => ({
               limit: () => Promise.resolve([])
            })
         })
      }),
      insert: () => ({
         values: () => ({
            returning: () => Promise.resolve([{ id: "new-id" }])
         })
      }),
      update: () => ({
         set: () => ({
            where: () => ({
               returning: () => Promise.resolve([{ id: "tx-123" }])
            })
         })
      }),
      delete: () => ({
         where: () => ({
            returning: () => Promise.resolve([])
         })
      }),
      ...overrides
   };
}
```

### Resend Mock Pattern

```typescript
import { mock } from "bun:test";

mock.module("@packages/transactional/client", () => ({
   sendWorkflowEmail: mock(() => Promise.resolve()),
   getResendClient: mock(() => ({
      emails: {
         send: mock(() => Promise.resolve({ id: "email-123" }))
      }
   })),
}));
```

### Context Factory Pattern

```typescript
export function createMockContext(overrides = {}) {
   return {
      db: createMockDb(),
      organizationId: "org-123",
      eventData: {
         id: "tx-123",
         description: "Test transaction",
         amount: 100,
         type: "expense",
         date: "2024-01-15",
      },
      ruleId: "rule-123",
      dryRun: false,
      resendClient: createMockResendClient(),
      vapidConfig: {
         publicKey: "test-public-key",
         privateKey: "test-private-key",
         subject: "mailto:test@example.com",
      },
      ...overrides,
   };
}
```

---

## Success Criteria

- [ ] All 275+ tests pass
- [ ] Typecheck passes with no errors
- [ ] Format check passes
- [ ] send_email handler sends real emails (when not in test)
- [ ] send_push_notification uses typed config
- [ ] Worker starts successfully with new env vars
- [ ] Coverage >90%
