# Bills Feature Update Plan

## Overview

Comprehensive update to the bills feature to be fully-featured, matching patterns from bank accounts and transactions. This includes:

- Counterparties (Clients/Suppliers)
- Bill Attachments (multi-file support)
- Interest Templates (juros + correção monetária)
- Installments (parcelas)
- Recurrence improvements
- 3-step ManageBillSheet
- Enhanced Bill Details page
- New Bills navigation section

---

## Completed Phases (Previous Work)

### Phase 1-4: Basic Bills Update
- [x] Backend bulk operations (`deleteManyBills`, `completeManyBills`)
- [x] Bulk actions hook, table components with mobile cards/expanded rows
- [x] List section with inline filters, row selection, bulk actions
- [x] Bill details page at `/apps/dashboard/src/pages/bill-details/`

### Phase 5: Layout Updates
- [x] Updated `/apps/dashboard/src/pages/bills/ui/bills-page.tsx` - single-column layout
- [x] Updated `/apps/dashboard/src/pages/bills/ui/bills-stats.tsx` - horizontal 4-card grid
- [x] Updated `/apps/dashboard/src/pages/bills/features/manage-bill-sheet.tsx` - 2-step stepper

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| Interest Display | Auto-display when viewing overdue bill |
| Correção Monetária | Automatic via Brasil API (SELIC, CDI, IPCA) |
| Installments Interval | User configurable (preset + custom) |
| Installment Amounts | Both equal + custom per installment |
| Navigation | New Bills section in NavMain |
| Counterparties Location | Under Bills section |
| Interest Templates Location | Under Bills section |
| Legacy counterparty field | Remove it (not in production) |
| Bills Overview | Same style as bank accounts list |
| Counterparties page style | Follow Categories + Category Details pattern |
| Interest Templates page style | Follow Categories + Category Details pattern |
| Quick create counterparty | Combobox (inline creation) |
| Interest template default | User selects (not auto-assigned) |
| Bulk complete date | Use today's date automatically |
| Bulk complete bank account | Use each bill's existing `bankAccountId` |

---

## New Navigation Structure

```
Finance
├── Transactions
├── Bank Accounts
├── Reports
└── Budgets

Bills (NEW SECTION)
├── Overview          → /$slug/bills
├── Payables          → /$slug/bills?type=payable
├── Receivables       → /$slug/bills?type=receivable
├── Counterparties    → /$slug/counterparties
└── Interest Models   → /$slug/interest-templates

Categorization
├── Categories
├── Cost Centers
└── Tags
```

---

## New Schemas

### 1. Counterparty

```typescript
counterparty = pgTable("counterparty", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "client" | "supplier" | "both"
  document: text("document"),   // CPF/CNPJ (no validation)
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
```

### 2. Interest Template

```typescript
interestTemplate = pgTable("interest_template", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  
  // Multa (one-time penalty)
  penaltyType: text("penalty_type").notNull(), // "none" | "percentage" | "fixed"
  penaltyValue: decimal("penalty_value", { precision: 10, scale: 4 }),
  
  // Juros de Mora (recurring interest)
  interestType: text("interest_type").notNull(), // "none" | "daily" | "monthly"
  interestValue: decimal("interest_value", { precision: 10, scale: 4 }),
  
  // Correção Monetária
  monetaryCorrectionIndex: text("monetary_correction_index").notNull(), // "none" | "ipca" | "selic" | "cdi"
  
  gracePeriodDays: integer("grace_period_days").default(0),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
```

### 3. Bill Attachment

```typescript
billAttachment = pgTable("bill_attachment", {
  id: uuid("id").defaultRandom().primaryKey(),
  billId: uuid("bill_id").notNull().references(() => bill.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
```

### 4. Bill Schema Updates

```typescript
// REMOVE:
counterparty: text("counterparty"),  // Delete this field

// ADD:
counterpartyId: uuid("counterparty_id").references(() => counterparty.id, { onDelete: "set null" }),
interestTemplateId: uuid("interest_template_id").references(() => interestTemplate.id, { onDelete: "set null" }),

// Installments
installmentGroupId: uuid("installment_group_id"),
installmentNumber: integer("installment_number"),
totalInstallments: integer("total_installments"),
installmentIntervalDays: integer("installment_interval_days"),

// Interest tracking
originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
appliedPenalty: decimal("applied_penalty", { precision: 10, scale: 2 }).default("0"),
appliedInterest: decimal("applied_interest", { precision: 10, scale: 2 }).default("0"),
appliedCorrection: decimal("applied_correction", { precision: 10, scale: 2 }).default("0"),
lastInterestUpdate: timestamp("last_interest_update"),

// Recurrence control
autoCreateNext: boolean("auto_create_next").default(true),
```

---

## Implementation Phases

### Phase 1: Bug Fixes
- [ ] Fix BillListProvider context error in ManageBillSheet
- [ ] Fix date validation error (issueDate string vs Date)

### Phase 2: Brasil API Update
- [ ] Add `Taxa` type
- [ ] Add `getAllTaxas()` function
- [ ] Add `getTaxaByName()` function
- [ ] Add tests for new functions

### Phase 3: Counterparties Feature
**Schema + Repository + Router:**
- [ ] Create `packages/database/src/schemas/counterparties.ts`
- [ ] Create `packages/database/src/repositories/counterparty-repository.ts`
- [ ] Create `packages/api/src/server/routers/counterparties.ts`
- [ ] Export from index files

**UI (following Categories pattern):**
- [ ] Create `apps/dashboard/src/pages/counterparties/ui/counterparties-page.tsx`
- [ ] Create `apps/dashboard/src/pages/counterparty-details/ui/counterparty-details-page.tsx`
- [ ] Create route files for both pages
- [ ] Add translations

### Phase 4: Interest Templates Feature
**Schema + Repository + Router:**
- [ ] Create `packages/database/src/schemas/interest-templates.ts`
- [ ] Create `packages/database/src/repositories/interest-template-repository.ts`
- [ ] Create `packages/api/src/server/routers/interest-templates.ts`
- [ ] Export from index files

**UI (following Categories pattern):**
- [ ] Create `apps/dashboard/src/pages/interest-templates/ui/interest-templates-page.tsx`
- [ ] Create `apps/dashboard/src/pages/interest-template-details/ui/interest-template-details-page.tsx`
- [ ] Create route files
- [ ] Add translations

### Phase 5: Bill Attachments
- [ ] Add `billAttachment` table to `packages/database/src/schemas/bills.ts`
- [ ] Create `packages/database/src/repositories/bill-attachment-repository.ts`
- [ ] Add attachment endpoints to `packages/api/src/server/routers/bills.ts`

### Phase 6: Update Bills Schema
- [ ] Remove `counterparty` text field
- [ ] Add `counterpartyId` FK
- [ ] Add `interestTemplateId` FK
- [ ] Add installment fields
- [ ] Add interest tracking fields
- [ ] Add `autoCreateNext` for recurrence control
- [ ] Update bill repository queries to include new relations

### Phase 7: Interest Calculation Utils
- [ ] Create `packages/utils/src/interest.ts`
- [ ] Implement `calculateInterest()` function
- [ ] Implement `calculateDaysOverdue()` helper
- [ ] Implement `applyMonetaryCorrection()` with Brasil API rates
- [ ] Add tests

### Phase 8: Update NavMain
- [ ] Remove Payables/Receivables from Finance section
- [ ] Create new Bills section
- [ ] Add translations for new nav items

### Phase 9: Update ManageBillSheet (3 Steps)
**Step 1 - Details:**
- [ ] Type, Description, Amount, Due Date
- [ ] Installments toggle with config panel

**Step 2 - Categorization:**
- [ ] Category (existing)
- [ ] Counterparty (combobox with quick create)
- [ ] Bank Account (existing)
- [ ] Interest Template (select, only for receivables)

**Step 3 - Additional:**
- [ ] Recurrence (existing)
- [ ] Issue Date (existing)
- [ ] Notes (existing)
- [ ] Attachments (new file upload)

### Phase 10: Installments Creation Logic
- [ ] Add `createBillWithInstallments()` to bill repository
- [ ] Generate all installment records with shared `installmentGroupId`
- [ ] Calculate due dates based on interval
- [ ] Support equal or custom amounts

### Phase 11: Update Bill Details Page
- [ ] Attachments section (upload, download, delete)
- [ ] Interest section (auto-calculated, apply button) - receivables only
- [ ] Installments section (list all in group) - if part of group
- [ ] Recurrence toggle - if recurring
- [ ] Show counterparty as link
- [ ] Show interest template name

### Phase 12: Translations
- [ ] Nav items (Bills section)
- [ ] Counterparties pages
- [ ] Interest Templates pages
- [ ] ManageBillSheet new fields
- [ ] Bill Details new sections

---

## Files Summary

### New Files (17+)

| Path | Description |
|------|-------------|
| `packages/database/src/schemas/counterparties.ts` | Counterparty schema |
| `packages/database/src/schemas/interest-templates.ts` | Interest template schema |
| `packages/database/src/repositories/counterparty-repository.ts` | Counterparty CRUD |
| `packages/database/src/repositories/interest-template-repository.ts` | Interest template CRUD |
| `packages/database/src/repositories/bill-attachment-repository.ts` | Bill attachment CRUD |
| `packages/api/src/server/routers/counterparties.ts` | Counterparty API |
| `packages/api/src/server/routers/interest-templates.ts` | Interest template API |
| `packages/utils/src/interest.ts` | Interest calculation |
| `apps/dashboard/src/pages/counterparties/ui/counterparties-page.tsx` | List page |
| `apps/dashboard/src/pages/counterparty-details/ui/counterparty-details-page.tsx` | Details page |
| `apps/dashboard/src/pages/interest-templates/ui/interest-templates-page.tsx` | List page |
| `apps/dashboard/src/pages/interest-template-details/ui/interest-template-details-page.tsx` | Details page |
| `apps/dashboard/src/routes/$slug/_dashboard/counterparties.index.tsx` | Route |
| `apps/dashboard/src/routes/$slug/_dashboard/counterparties.$counterpartyId.tsx` | Route |
| `apps/dashboard/src/routes/$slug/_dashboard/interest-templates.index.tsx` | Route |
| `apps/dashboard/src/routes/$slug/_dashboard/interest-templates.$interestTemplateId.tsx` | Route |
| `packages/localization/src/locales/pt-BR/dashboard/counterparties.json` | Translations |

### Modified Files (12+)

| Path | Changes |
|------|---------|
| `packages/brasil-api/src/index.ts` | Add taxas functions |
| `packages/brasil-api/__tests__/index.test.ts` | Add taxas tests |
| `packages/database/src/schemas/bills.ts` | Add fields + attachment table |
| `packages/database/src/repositories/bill-repository.ts` | Update queries, add installment logic |
| `packages/database/src/index.ts` | Export new schemas/repos |
| `packages/api/src/server/routers/bills.ts` | Add attachment endpoints |
| `packages/api/src/server/index.ts` | Register new routers |
| `packages/utils/src/index.ts` | Export interest utils |
| `apps/dashboard/src/layout/nav-main.tsx` | Reorganize navigation |
| `apps/dashboard/src/pages/bills/features/manage-bill-sheet.tsx` | 3-step stepper |
| `apps/dashboard/src/pages/bills/features/bill-list-context.tsx` | Fix context error |
| `apps/dashboard/src/pages/bill-details/ui/bill-details-page.tsx` | Add new sections |

---

## UI Mockups

### ManageBillSheet Step 1 - Installments Config

```
┌─────────────────────────────────────────────────────────────┐
│ Parcelamento                                                │
├─────────────────────────────────────────────────────────────┤
│ [✓] Parcelar esta conta                                     │
│                                                             │
│ Número de parcelas: [12        ]                            │
│                                                             │
│ Intervalo:                                                  │
│ [Mensal ▼] ou [  ] dias personalizado                       │
│                                                             │
│ Valores das parcelas:                                       │
│ ○ Iguais (R$ 83,33 cada)                                    │
│ ● Personalizados                                            │
│                                                             │
│ Parcela 1: [R$ 100,00] - 15/01/2025                         │
│ Parcela 2: [R$ 80,00]  - 15/02/2025                         │
│ ...                                                         │
│ Total: R$ 1.000,00 ✓                                        │
└─────────────────────────────────────────────────────────────┘
```

### Bill Details - Interest Section (Auto-displayed)

```
┌─────────────────────────────────────────────────────────────┐
│ Juros e Correção                         Atualizado: Agora  │
├─────────────────────────────────────────────────────────────┤
│ Modelo: [Padrão (2% + 1%/mês + IPCA) ▼]                     │
│ Dias em atraso: 45                                          │
│                                                             │
│ Valor Original:           R$ 1.000,00                       │
│ Multa (2%):              +R$    20,00                       │
│ Juros (1%/mês × 1.5):    +R$    15,00                       │
│ IPCA (4.68%/ano):        +R$     5,78                       │
│ ──────────────────────────────────────                      │
│ Valor Atualizado:         R$ 1.040,78                       │
│                                                             │
│               [Aplicar Juros ao Valor]                      │
│                                                             │
│ ⓘ Taxas atualizadas automaticamente via Banco Central       │
└─────────────────────────────────────────────────────────────┘
```

### Bill Details - Installments Section

```
┌─────────────────────────────────────────────────────────────┐
│ Parcelas                                             3/12   │
├─────────────────────────────────────────────────────────────┤
│ ✅ Parcela 1   R$ 83,33   15/01/2025   Pago                 │
│ ✅ Parcela 2   R$ 83,33   15/02/2025   Pago                 │
│ 🔵 Parcela 3   R$ 83,33   15/03/2025   ← Atual              │
│ ⏳ Parcela 4   R$ 83,33   15/04/2025   Pendente             │
│ ⏳ Parcela 5   R$ 83,33   15/05/2025   Pendente             │
│ [Ver todas as 12 parcelas]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Bill Details - Attachments Section

```
┌─────────────────────────────────────────────────────────────┐
│ Anexos (3)                                       [+ Anexar] │
├─────────────────────────────────────────────────────────────┤
│ 📄 nota-fiscal.pdf          12 KB      [Baixar] [Remover]   │
│ 🖼️ comprovante.jpg          45 KB      [Baixar] [Remover]   │
│ 📄 contrato.pdf            128 KB      [Baixar] [Remover]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Points

| Integration | How It's Handled |
|-------------|------------------|
| **Bills → Transactions** | `completeMany` creates transactions; Details page shows linked transaction |
| **Bills → Bank Accounts** | Complete uses bill's `bankAccountId`; Details page shows linked account |
| **Bills → Categories** | Columns show category icon/color; Details page shows category info |
| **Bills → Counterparties** | Bills reference counterparty via FK; Quick create in ManageBillSheet |
| **Bills → Interest Templates** | Bills reference template via FK; Auto-calculate interest on overdue |
| **Bills → Attachments** | Multi-file storage via MinIO; Display in Details page |
| **Bills → Brasil API** | Fetch SELIC/CDI/IPCA rates for correção monetária |
| **Bills → Navigation** | New Bills section with Overview, Payables, Receivables, Counterparties, Interest Models |
