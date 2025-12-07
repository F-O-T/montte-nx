# Financial Automation Engine - Implementation Plan

## Overview

The Automation Engine transforms Montte from a passive data entry tool into an active financial operating system. Users can visually define logic using a node-based editor (React Flow), and the system automatically categorizes transactions, handles webhooks, manages alerts, and executes complex business logic.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT OPTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Option A: Single Container          Option B: Separate Containers          │
│  ┌─────────────────────────┐        ┌──────────────┐ ┌──────────────┐      │
│  │     apps/server         │        │  apps/server │ │ apps/worker  │      │
│  │  ┌───────┐ ┌────────┐   │        │  (API only)  │ │ (Jobs only)  │      │
│  │  │ API   │ │ Worker │   │        └──────────────┘ └──────────────┘      │
│  │  └───────┘ └────────┘   │                 │               │              │
│  └───────────┬─────────────┘                 └───────┬───────┘              │
│              │                                       │                      │
│              ▼                                       ▼                      │
│        ┌──────────┐                           ┌──────────┐                  │
│        │  Redis   │                           │  Redis   │                  │
│        └──────────┘                           └──────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Queue | BullMQ |
| Cache/Broker | Redis (ioredis) |
| Visual Builder | @xyflow/react |
| Backend | Elysia + tRPC |
| Database | PostgreSQL + Drizzle |

---

## Feature Scope

### Triggers

| Trigger | Event Name | Description |
|---------|------------|-------------|
| Transaction Created | `transaction.created` | Fires when a new transaction is added |
| Transaction Updated | `transaction.updated` | Fires when a transaction is modified |
| Webhook Received | `webhook.received` | Generic webhook payload (Stripe, Asaas, custom) |

### Conditions

| Category | Operators |
|----------|-----------|
| **Text** | equals, not_equals, contains, not_contains, starts_with, ends_with, regex |
| **Numeric** | eq, neq, gt, gte, lt, lte, between |
| **Date** | is_weekend, is_business_day, day_of_month, day_of_week, before, after |
| **Existence** | is_empty, is_not_empty |
| **List** | in_list, not_in_list |

### Actions

| Action | Description |
|--------|-------------|
| Set Category | Assign category to transaction |
| Add Tag | Add one or more tags |
| Remove Tag | Remove specific tags |
| Set Cost Center | Assign cost center |
| Update Description | Modify/append description |
| Create Transaction | Create new transaction (for webhooks) |
| Send Push Notification | In-app + browser push |
| Send Email | Via Resend |
| Stop Execution | Halt rule processing |

---

## Package Structure

```
packages/
├── queue/                           # Shared queue infrastructure
│   ├── src/
│   │   ├── connection.ts            # Redis connection factory
│   │   ├── types.ts                 # Shared queue types
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── rules-engine/                    # Core automation logic
│   ├── src/
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── events.ts            # Event type definitions
│   │   │   ├── conditions.ts        # Condition types & operators
│   │   │   ├── actions.ts           # Action types & payloads
│   │   │   └── rules.ts             # Rule structure
│   │   ├── engine/
│   │   │   ├── index.ts
│   │   │   ├── evaluator.ts         # Condition evaluation logic
│   │   │   ├── executor.ts          # Action execution logic
│   │   │   └── runner.ts            # Main orchestrator
│   │   ├── queue/
│   │   │   ├── index.ts
│   │   │   ├── queues.ts            # Queue definitions
│   │   │   ├── producer.ts          # Event emission (enqueue jobs)
│   │   │   └── consumer.ts          # Job processor (worker)
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── database/src/
│   ├── schemas/
│   │   └── automations.ts           # automation_rule, automation_log tables
│   └── repositories/
│       ├── automation-repository.ts
│       └── automation-log-repository.ts
│
└── api/src/server/routers/
    └── automation.ts                # CRUD + manual trigger

apps/
├── worker/                          # Separately deployable worker
│   ├── src/
│   │   ├── index.ts                 # Worker entry point
│   │   └── processors/
│   │       └── automation.ts        # Automation rule processor
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── railway.json
│
├── server/
│   ├── src/
│   │   ├── index.ts                 # Updated: webhook routes
│   │   └── integrations/
│   │       └── queue.ts             # Queue producer setup
│   └── docker-compose.yml           # Updated: add Redis service
│
└── dashboard/src/
    ├── features/
    │   └── automations/             # Visual builder feature
    │       ├── components/
    │       │   ├── builder/
    │       │   │   ├── automation-canvas.tsx
    │       │   │   ├── automation-toolbar.tsx
    │       │   │   ├── nodes/
    │       │   │   │   ├── index.ts
    │       │   │   │   ├── base-node.tsx
    │       │   │   │   ├── trigger-node.tsx
    │       │   │   │   ├── condition-node.tsx
    │       │   │   │   └── action-node.tsx
    │       │   │   ├── edges/
    │       │   │   │   └── custom-edge.tsx
    │       │   │   └── panels/
    │       │   │       ├── node-palette.tsx
    │       │   │       └── node-config-panel.tsx
    │       │   ├── automation-list.tsx
    │       │   ├── automation-card.tsx
    │       │   └── automation-history.tsx
    │       ├── hooks/
    │       │   ├── use-automation-builder.ts
    │       │   ├── use-flow-validation.ts
    │       │   └── use-automation-history.ts
    │       └── utils/
    │           ├── serialization.ts
    │           ├── validation.ts
    │           └── node-registry.ts
    └── routes/
        └── $slug/_dashboard/automations/
            ├── index.tsx            # List all automations
            ├── new.tsx              # Create new automation
            ├── $id/
            │   ├── index.tsx        # Edit automation
            │   └── history.tsx      # Execution history
            └── route.tsx            # Layout
```

---

## Database Schema

### `automation_rule` Table

```sql
CREATE TABLE automation_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    trigger_type TEXT NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    
    -- Rule logic
    conditions JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    
    -- React Flow state
    flow_data JSONB,
    
    -- Execution settings
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    stop_on_first_match BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES "user"(id),
    
    CONSTRAINT automation_rule_name_org_unique UNIQUE (organization_id, name)
);

CREATE INDEX idx_automation_rule_org_active ON automation_rule(organization_id, is_active);
CREATE INDEX idx_automation_rule_trigger ON automation_rule(trigger_type, is_active);
```

### `automation_log` Table

```sql
CREATE TABLE automation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES automation_rule(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    
    -- Rule snapshot
    rule_name TEXT NOT NULL,
    rule_snapshot JSONB,
    
    -- Trigger info
    trigger_type TEXT NOT NULL,
    trigger_event JSONB NOT NULL,
    
    -- Execution details
    conditions_evaluated JSONB,
    actions_executed JSONB,
    
    -- Result
    status TEXT NOT NULL,
    error_message TEXT,
    error_stack TEXT,
    
    -- Performance
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Context
    triggered_by TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automation_log_rule ON automation_log(rule_id);
CREATE INDEX idx_automation_log_org_created ON automation_log(organization_id, created_at DESC);
CREATE INDEX idx_automation_log_status ON automation_log(status);
CREATE INDEX idx_automation_log_entity ON automation_log(related_entity_type, related_entity_id);
```

---

## Implementation Tasks

### Phase 1: Infrastructure (Foundation)

- [ ] **1.1** Create `@packages/queue` package with Redis connection
- [ ] **1.2** Add Redis service to docker-compose
- [ ] **1.3** Update environment schema with REDIS_URL
- [ ] **1.4** Create `@packages/rules-engine` package structure
- [ ] **1.5** Add database schema for automations
- [ ] **1.6** Create automation repositories

### Phase 2: Rules Engine (Backend Logic)

- [ ] **2.1** Implement type definitions (events, conditions, actions, rules)
- [ ] **2.2** Implement condition evaluator
- [ ] **2.3** Implement action executor
- [ ] **2.4** Implement rule runner (orchestrator)
- [ ] **2.5** Create queue producer (event emission)
- [ ] **2.6** Create queue consumer (job processor)

### Phase 3: Worker App

- [ ] **3.1** Create worker app structure
- [ ] **3.2** Implement automation processor
- [ ] **3.3** Add Dockerfile for worker
- [ ] **3.4** Add Railway deployment config

### Phase 4: API Layer

- [ ] **4.1** Create automation tRPC router (CRUD)
- [ ] **4.2** Add webhook endpoints to server
- [ ] **4.3** Hook queue producer into transaction mutations
- [ ] **4.4** Add manual trigger endpoint

### Phase 5: Visual Builder (Frontend)

- [ ] **5.1** Install @xyflow/react dependency
- [ ] **5.2** Create base node component
- [ ] **5.3** Create trigger node component
- [ ] **5.4** Create condition node component
- [ ] **5.5** Create action node component
- [ ] **5.6** Create custom edge component
- [ ] **5.7** Create automation canvas
- [ ] **5.8** Create node palette sidebar
- [ ] **5.9** Create node configuration panel
- [ ] **5.10** Implement flow serialization/deserialization
- [ ] **5.11** Implement flow validation

### Phase 6: Dashboard Pages

- [ ] **6.1** Create automations route layout
- [ ] **6.2** Create automations list page
- [ ] **6.3** Create new automation page
- [ ] **6.4** Create edit automation page
- [ ] **6.5** Create execution history page

### Phase 7: Integration & Polish

- [ ] **7.1** Add navigation items to sidebar
- [ ] **7.2** Add translations (pt-BR and en)
- [ ] **7.3** Create automation history component
- [ ] **7.4** Add manual trigger button to UI
- [ ] **7.5** Add automation toggle (enable/disable)

---

## React Flow Node Types

| Node Type | Color | Shape | Inputs | Outputs |
|-----------|-------|-------|--------|---------|
| **Trigger** | Green (#22c55e) | Rounded | None | 1 (bottom) |
| **Condition** | Yellow (#eab308) | Diamond | 1 (top) | 2 (Yes/No) |
| **Action** | Blue (#3b82f6) | Rounded | 1 (top) | 1 (bottom) |
| **End** | Red (#ef4444) | Circle | 1 (top) | None |

---

## Environment Variables

```env
# Redis (required for queue)
REDIS_URL=redis://localhost:6379

# Worker configuration
WORKER_CONCURRENCY=5
```

---

## Dependencies

### packages/queue
```json
{
  "dependencies": {
    "bullmq": "^5.34.8",
    "ioredis": "^5.4.2"
  }
}
```

### packages/rules-engine
```json
{
  "dependencies": {
    "@packages/queue": "workspace:*",
    "@packages/database": "workspace:*"
  }
}
```

### apps/worker
```json
{
  "dependencies": {
    "@packages/rules-engine": "workspace:*",
    "@packages/database": "workspace:*",
    "@packages/queue": "workspace:*",
    "@packages/environment": "workspace:*"
  }
}
```

### apps/dashboard
```json
{
  "dependencies": {
    "@xyflow/react": "^12.4.4"
  }
}
```
