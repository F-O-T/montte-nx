# Categorization System Design

## Overview

Sistema completo de categorização e acompanhamento que suporta:

- **Tags**: Etiquetas flexíveis e transversais para eventos/projetos (ex: "Viagem Disney 2025", "Reforma da Casa")
- **Centros de Custo**: Estrutura organizacional/empresarial para rastrear despesas por departamento (ex: "Depto. de Marketing", "Filial Sul") - **Apenas Business**

> **Nota**: Transaction Splits (Rateio) está sendo implementado separadamente.

---

## Context

Todo usuário possui uma **organization** (personal workspace por default). Portanto:

- `organizationId` é a chave principal para filtrar dados
- Business = nova organization criada no onboarding
- Personal = organization default criada no signup

---

## Data Model

### 1. Category (Updated)

```typescript
category = {
   id: uuid (PK),
   organizationId: uuid (FK -> organization) NOT NULL,
   name: text,
   color: text,
   icon: text (default "Wallet"),
   createdAt, updatedAt
}
// Removed: budget, userId
```

### 2. Tag (New)

```typescript
tag = {
   id: uuid (PK),
   organizationId: uuid (FK -> organization) NOT NULL,
   name: text,
   color: text,
   icon: text (default "Tag"),
   createdAt, updatedAt
}

transaction_tag = {
   transactionId: uuid (FK -> transaction),
   tagId: uuid (FK -> tag),
   PK: (transactionId, tagId)
}
```

### 3. Cost Center (New - Business Only)

```typescript
cost_center = {
   id: uuid (PK),
   organizationId: uuid (FK -> organization) NOT NULL,
   parentId: uuid (self-ref, nullable),  // Hierarchy support
   name: text,
   code: text,  // e.g., "MKT-001"
   isDefault: boolean (default false),
   isActive: boolean (default true),
   createdAt, updatedAt
}
```

---

## Relationships Diagram

```
organization (personal or business)
     |
     |--< category
     |
     |--< tag --< transaction_tag >-- transaction
     |
     |--< cost_center (business only)
     |       |-- parentId (self-ref hierarchy)
     |
     |--< bank_account
     |
     |--< transaction
```

---

## Proposed Schemas

### `packages/database/src/schemas/categories.ts`

```typescript
import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const category = pgTable("category", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   name: text("name").notNull(),
   color: text("color").notNull(),
   icon: text("icon").default("Wallet"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const categoryRelations = relations(category, ({ one }) => ({
   organization: one(organization, {
      fields: [category.organizationId],
      references: [organization.id],
   }),
}));
```

### `packages/database/src/schemas/tags.ts`

```typescript
import { relations, sql } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { transaction } from "./transactions";

export const tag = pgTable("tag", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   name: text("name").notNull(),
   color: text("color").notNull(),
   icon: text("icon").default("Tag"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const transactionTag = pgTable("transaction_tag", {
   transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transaction.id, { onDelete: "cascade" }),
   tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
}, (table) => ({
   pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
   organization: one(organization, {
      fields: [tag.organizationId],
      references: [organization.id],
   }),
   transactionTags: many(transactionTag),
}));

export const transactionTagRelations = relations(transactionTag, ({ one }) => ({
   transaction: one(transaction, {
      fields: [transactionTag.transactionId],
      references: [transaction.id],
   }),
   tag: one(tag, {
      fields: [transactionTag.tagId],
      references: [tag.id],
   }),
}));
```

### `packages/database/src/schemas/cost-centers.ts`

```typescript
import { relations, sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const costCenter = pgTable("cost_center", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   parentId: uuid("parent_id"),
   name: text("name").notNull(),
   code: text("code"),
   isDefault: boolean("is_default").default(false).notNull(),
   isActive: boolean("is_active").default(true).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const costCenterRelations = relations(costCenter, ({ one, many }) => ({
   organization: one(organization, {
      fields: [costCenter.organizationId],
      references: [organization.id],
   }),
   parent: one(costCenter, {
      fields: [costCenter.parentId],
      references: [costCenter.id],
      relationName: "parentChild",
   }),
   children: many(costCenter, { relationName: "parentChild" }),
}));
```

---

## Default Cost Centers (Business Onboarding)

| Name | Code |
|------|------|
| Administrativo | ADM |
| Comercial | COM |
| Marketing | MKT |
| Operacional | OPS |
| Financeiro | FIN |
| Recursos Humanos | RH |

---

## Files to Modify/Create

### Create (New)

| File | Description |
|------|-------------|
| `packages/database/src/schemas/tags.ts` | Schema `tag` + `transactionTag` |
| `packages/database/src/schemas/cost-centers.ts` | Schema `costCenter` |
| `packages/database/src/repositories/tag-repository.ts` | CRUD operations |
| `packages/database/src/repositories/cost-center-repository.ts` | CRUD + hierarchy |
| `packages/api/src/server/routers/tags.ts` | tRPC router |
| `packages/api/src/server/routers/cost-centers.ts` | tRPC router |

### Modify (Existing)

| File | Change |
|------|--------|
| `packages/database/src/schemas/categories.ts` | Remove `budget`, `userId` |
| `packages/database/src/repositories/category-repository.ts` | Queries by `organizationId`, remove `getCategorySpending` |
| `packages/api/src/server/routers/categories.ts` | Remove `budget`, use `organizationId` |
| `packages/api/src/server/routers/transactions.ts` | Remove `checkBudgetAndNotify` |
| `packages/database/src/schema.ts` | Export new schemas |
| `packages/api/src/server/index.ts` | Add new routers |

---

## SQL Migration

```sql
-- 1. Add organizationId to category (for existing data)
ALTER TABLE category 
ADD COLUMN organization_id UUID REFERENCES organization(id) ON DELETE CASCADE;

-- 2. Populate organization_id from user's default org (for existing data)
UPDATE category c
SET organization_id = (
   SELECT m.organization_id 
   FROM member m 
   WHERE m.user_id = c.user_id 
   LIMIT 1
);

-- 3. Make organization_id NOT NULL
ALTER TABLE category 
ALTER COLUMN organization_id SET NOT NULL;

-- 4. Remove budget and userId columns
ALTER TABLE category DROP COLUMN budget;
ALTER TABLE category DROP COLUMN user_id;

-- 5. Create indexes
CREATE INDEX idx_category_organization ON category(organization_id);
CREATE INDEX idx_tag_organization ON tag(organization_id);
CREATE INDEX idx_cost_center_organization ON cost_center(organization_id);
CREATE INDEX idx_transaction_tag_transaction ON transaction_tag(transaction_id);
CREATE INDEX idx_transaction_tag_tag ON transaction_tag(tag_id);
```

---

## Implementation Phases

| Phase | Scope | Estimate |
|-------|-------|----------|
| **1** | Update `category` (remove budget/userId) | 1 day |
| **2** | Remove `checkBudgetAndNotify` from transactions | 0.5 day |
| **3** | Create `tags` (schema + repository + router) | 1-2 days |
| **4** | Create `cost_center` (schema + repository + router) | 1-2 days |
| **5** | Frontend: Tags | 2 days |
| **6** | Frontend: Cost Centers (Business only) | 2 days |
| **7** | Integrate tags in transaction sheet | 1 day |
| **8** | Cost centers defaults in Business onboarding | 1 day |

**Total: ~10 days**

---

## UX Flows

### Tags in Transaction

```
+----------------------------------------------------------+
| New Transaction                                          |
+----------------------------------------------------------+
| Amount:      [R$ 300.00]                                 |
| Description: [Grocery Shopping]                          |
| Date:        [25/11/2025]                                |
| Account:     [Nubank v]                                  |
| Category:    [Food v]                                    |
|                                                          |
| Tags: [+ Add Tag]                                        |
|       [Disney Trip 2025 x] [Vacation x]                  |
|                                                          |
| [Cancel]                                       [Save]    |
+----------------------------------------------------------+
```

### Cost Centers Page (Business)

```
+----------------------------------------------------------+
| Cost Centers                                   [+ New]   |
+----------------------------------------------------------+
|                                                          |
| + Administrativo (ADM)                                   |
|   +-- Contabilidade                                      |
|   +-- Juridico                                           |
|                                                          |
| + Comercial (COM)                                        |
|   +-- Vendas                                             |
|   +-- Pos-Vendas                                         |
|                                                          |
| + Marketing (MKT)                                        |
|                                                          |
| + Operacional (OPS)                                      |
|                                                          |
+----------------------------------------------------------+
```
