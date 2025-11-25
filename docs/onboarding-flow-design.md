# Dynamic Onboarding Flow Design

## Overview

The onboarding flow dynamically adapts based on whether the user selects **Personal Finance** or **Business Finance** context.

---

## Terminology

- **Bank Name**: The name of the bank account itself - "Carteira" (personal) or "Caixa" (business)
- **Nickname**: Optional user-defined alias for the account

---

## Flow Architecture

```
Step 0: Context Selection
        ├── Personal Finance → Uses default org, creates "Carteira"
        └── Business Finance → Creates NEW org (plan-limited), creates "Caixa"

Flow A (Personal Finance):
├── Step 1: Auto-create "Carteira" bank account
├── Step 2: Optional custom bank account (can skip)
└── Step 3: Category selection

Flow B (Business Finance):
├── Step 1: Create NEW organization (business name, slug)
│           └── Check org limit based on user's plan first
├── Step 2: Auto-create "Caixa" bank account
├── Step 3: Optional custom bank account (can skip)
└── Step 4: Category selection
```

---

## Context Comparison

| Aspect              | Personal Finance       | Business Finance              |
| ------------------- | ---------------------- | ----------------------------- |
| Organization        | Default (signup)       | New org (plan-limited)        |
| Default Bank Name   | "Carteira"             | "Caixa"                       |
| Org Creation Step   | Skipped                | Required                      |
| Account Type        | "checking"             | "checking"                    |

---

## Step Details

### Step 0: Context Selection

User selects between:

- **Personal Finance**: For tracking personal expenses, income, and savings
- **Business Finance**: For managing business finances under a new organization

UI: Two selectable cards with icons and descriptions.

---

### Step 1a (Personal): Default Account Creation

- Automatically creates a bank account named **"Carteira"**
- Uses existing `createDefaultWalletBankAccount()` function (updated to use "Carteira")
- Shows confirmation to user

### Step 1b (Business): Organization Setup

- User enters **business name** and **slug**
- System checks organization limit based on user's plan (`organization.getOrganizationLimit`)
- Creates new organization via `organization.createOrganization`
- Sets new organization as active

---

### Step 2 (Business only): Default Account Creation

- Automatically creates a bank account named **"Caixa"**
- Tied to the newly created organization
- Shows confirmation to user

---

### Step 3: Optional Custom Bank Account

- User can optionally set up an additional bank account
- Form includes: bank name (required), bank selection, account type, nickname (optional)
- **Skip button** available to proceed without adding

---

### Step 4: Category Selection

- Existing category selection step
- User toggles predefined default categories (food, health, housing, leisure, shopping, transport)

---

## Required Implementation Changes

### 1. Repository Layer

**File:** `packages/database/src/repositories/bank-account-repository.ts`

Update existing function to use "Carteira":

```typescript
export async function createDefaultWalletBankAccount(
  dbClient: DatabaseInstance,
  userId: string,
) {
  const result = await dbClient
    .insert(bankAccount)
    .values({
      bank: "Carteira",
      name: "Carteira",
      type: "checking",
      userId,
    })
    .returning();
  return result[0];
}
```

Add new function for business:

```typescript
export async function createDefaultBusinessBankAccount(
  dbClient: DatabaseInstance,
  userId: string,
) {
  const result = await dbClient
    .insert(bankAccount)
    .values({
      bank: "Caixa",
      name: "Caixa",
      type: "checking",
      userId,
    })
    .returning();
  return result[0];
}
```

### 2. API Layer

**File:** `packages/api/src/server/routers/bank-accounts.ts`

Add procedures:

```typescript
createDefaultPersonal: protectedProcedure.mutation(async ({ ctx }) => {
  const resolvedCtx = await ctx;
  const userId = resolvedCtx.session.user.id;
  return createDefaultWalletBankAccount(resolvedCtx.db, userId);
});

createDefaultBusiness: protectedProcedure.mutation(async ({ ctx }) => {
  const resolvedCtx = await ctx;
  const userId = resolvedCtx.session.user.id;
  return createDefaultBusinessBankAccount(resolvedCtx.db, userId);
});
```

### 3. UI Layer

**File:** `apps/dashboard/src/pages/onboarding/ui/onboarding-page.tsx`

Refactor to include:

- Context selection state
- Conditional step rendering
- Dynamic stepper configuration

**New Components:**

| Component                    | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `ContextSelectionStep`       | Initial personal/business choice         |
| `OrganizationSetupStep`      | Business org creation form               |
| `DefaultAccountCreatedStep`  | Confirmation of auto-created account     |
| `OptionalBankAccountStep`    | Skippable custom bank account form       |

### 4. Localization

**File:** `packages/localization/src/locales/en/dashboard.json` (and other locales)

Add keys for:

- Context selection titles/descriptions
- Organization setup labels
- Default account confirmation messages
- Skip button text

---

## State Management

```typescript
type OnboardingContext = "personal" | "business" | null;

const [context, setContext] = useState<OnboardingContext>(null);
const [skipCustomAccount, setSkipCustomAccount] = useState(false);
```

---

## Business Flow: Organization Limit Check

Before showing organization creation form:

1. Call `organization.getOrganizationLimit` to get max allowed orgs
2. Call `organization.getOrganizations` to get current count
3. If at limit, show upgrade prompt instead of form

---

## UI Mockup: Context Selection

```
┌────────────────────────────────────────────────────────┐
│           Choose Your Finance Context                  │
│  ─────────────────────────────────────────────────────│
│                                                        │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │   👤 Personal    │    │   🏢 Business    │         │
│  │                  │    │                  │         │
│  │  Track personal  │    │  Manage your     │         │
│  │  finances with   │    │  business        │         │
│  │  Carteira        │    │  finances with   │         │
│  │                  │    │  Caixa           │         │
│  └──────────────────┘    └──────────────────┘         │
│                                                        │
│                              [ Continue → ]            │
└────────────────────────────────────────────────────────┘
```

---

## UI Mockup: Optional Bank Account Step

```
┌────────────────────────────────────────────────────────┐
│           Add Another Bank Account                     │
│  ─────────────────────────────────────────────────────│
│                                                        │
│  Bank Name *        [ __________________________ ]     │
│                                                        │
│  Bank              [ Select bank...           ▼ ]     │
│                                                        │
│  Account Type      [ Checking               ▼ ]       │
│                                                        │
│  Nickname          [ __________________________ ]     │
│  (optional)                                            │
│                                                        │
│  [ Skip ]                            [ Continue → ]    │
└────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File                                                          | Action                              |
| ------------------------------------------------------------- | ----------------------------------- |
| `packages/database/src/repositories/bank-account-repository.ts` | Add `createDefaultBusinessBankAccount` |
| `packages/api/src/server/routers/bank-accounts.ts`            | Add default account procedures      |
| `apps/dashboard/src/pages/onboarding/ui/onboarding-page.tsx`  | Refactor for dynamic flow           |
| `packages/localization/src/locales/*/dashboard.json`          | Add translation keys                |
