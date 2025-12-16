# Finance Tracker - Claude Code Guidelines

## Project Overview

A personal finance management application built as an **Nx monorepo** with Bun as the package manager. The system provides transaction tracking, bill management, budgeting, and financial reporting with end-to-end encryption support.

---

## Technology Stack

### Runtime & Build
| Tool | Version | Purpose |
|------|---------|---------|
| Bun | 2.x | Package manager & runtime |
| Nx | 22.1.3 | Monorepo build system with caching |
| TypeScript | 5.9.3 | Type safety |

### Frontend (Dashboard)
| Library | Version | Purpose |
|---------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool |
| TanStack Router | 1.139.1 | File-based routing |
| TanStack Query | 5.66.5 | Server state management |
| TanStack Form | 1.26.0 | Form handling |
| TanStack Store | - | Global client state |
| Tailwind CSS | 4.1.16 | Styling |
| Radix UI | - | Component primitives |

### Backend (Server)
| Library | Version | Purpose |
|---------|---------|---------|
| Elysia | 1.4.12 | Bun-first web framework |
| tRPC | 11.4.3 | Type-safe API layer |
| Drizzle ORM | 0.44.2 | Database ORM |
| PostgreSQL | - | Database |
| Better Auth | 1.4.3 | Authentication |
| Arcjet | 1.0.0-beta | Rate limiting & DDoS protection |

### Background Jobs (Worker)
| Library | Version | Purpose |
|---------|---------|---------|
| BullMQ | 5.58.7 | Job queue |
| Redis | (ioredis) | Queue storage |

### Integrations
| Service | Purpose |
|---------|---------|
| Stripe | Payments |
| Resend | Transactional email |
| PostHog | Analytics |
| MinIO | File storage |

---

## Monorepo Structure

```
finance-tracker/
├── apps/
│   ├── dashboard/       # React/Vite SPA - main user interface
│   ├── server/          # Elysia backend API server
│   ├── worker/          # BullMQ background job processor
│   └── landing-page/    # Astro marketing site
├── packages/
│   ├── api/             # tRPC routers and procedures
│   ├── authentication/  # Better Auth setup
│   ├── cache/           # Redis caching layer
│   ├── database/        # Drizzle ORM schemas & repositories
│   ├── encryption/      # NaCl-based encryption
│   ├── environment/     # Zod-validated env vars
│   ├── files/           # MinIO & file utilities
│   ├── localization/    # i18next translations (en-US, pt-BR)
│   ├── notifications/   # Push notifications
│   ├── posthog/         # Analytics client
│   ├── queue/           # BullMQ abstractions
│   ├── stripe/          # Stripe SDK wrapper
│   ├── transactional/   # Email templates (React Email)
│   ├── ui/              # Radix + Tailwind components
│   ├── utils/           # Shared utilities
│   └── workflows/       # Workflow engine
├── tooling/
│   └── typescript/      # Shared TypeScript configs
└── scripts/             # Utility scripts
```

---

## Buildable Package Exports

Packages in `packages/` are buildable TypeScript packages. They use explicit exports in `package.json` to expose specific entry points.

### Export Pattern Types

#### 1. Named Entry Points
Single file exports for specific functionality:
```json
{
   "exports": {
      ".": {
         "default": "./src/index.ts",
         "types": "./dist/src/index.d.ts"
      },
      "./client": {
         "default": "./src/client.ts",
         "types": "./dist/src/client.d.ts"
      },
      "./server": {
         "default": "./src/server.ts",
         "types": "./dist/src/server.d.ts"
      }
   }
}
```

**Usage:**
```typescript
import { createClient } from "@packages/encryption/client";
import { encryptionService } from "@packages/encryption/server";
```

#### 2. Wildcard Entry Points
Pattern-based exports for directories with multiple files:
```json
{
   "exports": {
      "./components/*": {
         "default": "./src/components/*.{ts,tsx}",
         "types": "./dist/src/components/*.d.ts"
      },
      "./repositories/*": {
         "default": "./src/repositories/*.ts",
         "types": "./dist/src/repositories/*.d.ts"
      }
   }
}
```

**Usage:**
```typescript
import { Button } from "@packages/ui/components/button";
import { Spinner } from "@packages/ui/components/spinner";
import { createTransaction } from "@packages/database/repositories/transaction-repository";
```

### Standard Package Structure

```json
{
   "name": "@packages/example",
   "type": "module",
   "private": true,
   "exports": {
      ".": {
         "default": "./src/index.ts",
         "types": "./dist/src/index.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "typecheck": "tsc"
   }
}
```

### Common Export Patterns by Package Type

| Package Type | Exports | Example |
|--------------|---------|---------|
| UI Components | `./components/*`, `./hooks/*`, `./lib/*` | `@packages/ui` |
| Database | `.`, `./client`, `./schema`, `./schemas/*`, `./repositories/*` | `@packages/database` |
| API | `./client`, `./server`, `./schemas/*` | `@packages/api` |
| Utils/Services | `.`, `./client`, `./server` | `@packages/encryption` |
| Environment | `./server`, `./worker`, `./client` | `@packages/environment` |

### Import Rules

1. **Always use the export path, never relative paths:**
   ```typescript
   // Good
   import { Button } from "@packages/ui/components/button";

   // Bad (don't bypass exports)
   import { Button } from "@packages/ui/src/components/button";
   ```

2. **Match the export exactly:**
   ```typescript
   // Good - matches "./repositories/*"
   import { createBill } from "@packages/database/repositories/bill-repository";

   // Bad - doesn't match any export
   import { createBill } from "@packages/database/bill-repository";
   ```

3. **Types are resolved automatically** from the `types` field in exports.

---

## Code Style Rules

### No Barrel Files

Do NOT use barrel files (index.ts/index.tsx) to re-export components or modules.

**Bad:**
```typescript
// features/encryption/index.ts
export * from "./hooks";
export * from "./ui";
```

**Good:** Import directly from the source file:
```typescript
import { useEncryption } from "@/features/encryption/hooks/use-encryption";
import { EncryptionSetupCredenza } from "@/features/encryption/ui/encryption-setup-credenza";
```

**Why:**
- Improves tree-shaking and bundle size
- Makes dependencies explicit
- Faster TypeScript compilation
- Easier to trace imports

**Exception:** Package entry points (packages/*/src/index.ts) are allowed for external consumers.

### File Naming

Use **kebab-case** for all files:
```
encryption-setup-credenza.tsx
use-encryption-context.tsx
account-deletion.ts
transaction-repository.ts
```

### Component Naming

Use **PascalCase** for components, following `[Feature][Action][Type]` pattern:
```typescript
// Component names
EncryptionSetupCredenza    // feature: encryption, action: setup, type: credenza
CookieConsentBanner        // feature: cookie, action: consent, type: banner
ProfileSection             // feature: profile, type: section
BillFilterCredenza         // feature: bill, action: filter, type: credenza
```

### Hook Naming

Use **use[Feature][Action]** pattern:
```typescript
useEncryptionContext()
useActiveOrganization()
useCookieConsent()
useDeleteCategory()
usePendingOfxImport()
```

### Type/Interface Naming

Use **PascalCase** with descriptive suffixes:
```typescript
// Props interfaces
interface EncryptionSetupCredenzaProps { ... }
interface BillFilterCredenzaProps { ... }

// Database types (use Drizzle inference)
type Transaction = typeof transactionTable.$inferSelect;
type NewTransaction = typeof transactionTable.$inferInsert;

// General types
type Step = "intro" | "passphrase" | "confirm" | "success";
type ConsentStatus = "accepted" | "declined" | null;
```

---

## Feature Folder Structure

Organize features with consistent subfolder patterns:

```
/features/[feature-name]/
├── hooks/
│   ├── use-[feature]-context.tsx
│   └── use-[feature]-[action].ts
├── ui/
│   ├── [feature]-[action]-credenza.tsx
│   └── [feature]-banner.tsx
└── utils/ (when needed)
```

**Example - Encryption Feature:**
```
/features/encryption/
├── hooks/
│   ├── use-encryption-context.tsx
│   ├── use-encryption.ts
│   └── use-encryption-key-storage.ts
└── ui/
    ├── encryption-setup-credenza.tsx
    └── encryption-unlock-dialog.tsx
```

---

## Route Organization (TanStack Router)

File-based routing with these conventions:

- **kebab-case** for route files
- **$** prefix for dynamic segments: `$slug`, `$billId`
- **_** prefix for layout routes: `_dashboard`
- **index.tsx** for index routes

```
/routes/
├── auth/
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── forgot-password.tsx
└── $slug/
    └── _dashboard/
        ├── home.tsx
        ├── bills/
        │   ├── index.tsx
        │   └── $billId.tsx
        └── settings/
            ├── profile.tsx
            ├── security.tsx
            └── encryption.tsx
```

---

## Database Patterns (Drizzle ORM)

### Schema Definition
```typescript
// packages/database/src/schemas/transactions.ts
export const transaction = pgTable("transaction", {
   id: uuid("id").primaryKey().defaultRandom(),
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   description: text("description"),
   date: timestamp("date").notNull(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const transactionRelations = relations(transaction, ({ one, many }) => ({
   bankAccount: one(bankAccount, { ... }),
   transactionCategories: many(transactionCategory),
}));
```

### Repository Pattern
```typescript
// packages/database/src/repositories/transaction-repository.ts
export async function createTransaction(
   dbClient: DatabaseInstance,
   data: NewTransaction,
) {
   try {
      const encryptedData = encryptTransactionFields(data);
      const result = await dbClient
         .insert(transaction)
         .values(encryptedData)
         .returning();
      return decryptTransactionFields(result[0]);
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create transaction");
   }
}
```

---

## API Patterns (tRPC)

### Procedure Types
```typescript
// packages/api/src/server/trpc.ts
export const publicProcedure = baseProcedure
   .use(arcjetPublicMiddleware);

export const protectedProcedure = baseProcedure
   .use(arcjetProtectedMiddleware)
   .use(isAuthed)
   .use(telemetryMiddleware);
```

### Router Structure
```typescript
// packages/api/src/server/routers/categories.ts
export const categoryRouter = router({
   create: protectedProcedure
      .input(createCategorySchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         return createCategory(resolvedCtx.db, { ...input });
      }),

   getAll: protectedProcedure
      .query(async ({ ctx }) => {
         const resolvedCtx = await ctx;
         return getCategories(resolvedCtx.db, resolvedCtx.organizationId);
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => { ... }),
});
```

### Middleware Chain
1. Logger middleware
2. Timing middleware
3. Arcjet (rate limiting)
4. Authentication (isAuthed)
5. Telemetry middleware

---

## UI Patterns

### Component Library (CVA + Radix)
```typescript
// packages/ui/src/components/button.tsx
const buttonVariants = cva(
   "inline-flex items-center justify-center gap-2...",
   {
      variants: {
         size: { default: "h-9 px-4", icon: "size-9", sm: "h-8 px-3" },
         variant: { default: "bg-primary", ghost: "hover:bg-accent" }
      },
      defaultVariants: { size: "default", variant: "default" }
   }
);

export function Button({ className, variant, size, ...props }) {
   return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### TanStack Form Pattern
```typescript
const form = useForm({
   defaultValues: { description: "", amount: 0 },
   validators: { onBlur: transactionSchema },
   onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync(value);
      formApi.reset();
   },
});

<form.Field name="description">
   {(field) => (
      <Field>
         <FieldLabel>{translate("common.form.description.label")}</FieldLabel>
         <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
         />
         <FieldError errors={field.state.meta.errors} />
      </Field>
   )}
</form.Field>
```

### Global UI Hooks (TanStack Store)

The dashboard uses global state hooks for managing overlay UI (sheets, modals, dialogs). These hooks use TanStack Store for state management and require a corresponding `Global*` component mounted at the app root.

#### Available Hooks

| Hook | Purpose | Component |
|------|---------|-----------|
| `useSheet` | Forms and data entry | `GlobalSheet` |
| `useCredenza` | Important immediate actions (non-destructive) | `GlobalCredenza` |
| `useAlertDialog` | Destructive confirmations | `GlobalAlertDialog` |

#### useSheet - Forms
Use for forms and data entry that slides in from the side.
```typescript
import { useSheet } from "@/hooks/use-sheet";

function MyComponent() {
   const { openSheet, closeSheet } = useSheet();

   // Open a sheet with a form
   const handleOpen = () => {
      openSheet({
         children: <CreateTransactionForm onSuccess={closeSheet} />
      });
   };

   return <Button onClick={handleOpen}>Add Transaction</Button>;
}

// Inside the sheet content, close when done
function CreateTransactionForm({ onSuccess }: { onSuccess: () => void }) {
   const { closeSheet } = useSheet();

   const handleSubmit = async () => {
      await saveData();
      closeSheet();
   };
}
```

#### useCredenza - Important Immediate Actions
Use for important actions that require immediate user attention but are not destructive (modal on desktop, drawer on mobile).
```typescript
import { useCredenza } from "@/hooks/use-credenza";

function MyComponent() {
   const { openCredenza, closeCredenza } = useCredenza();

   // Example: Filter selection, category picker, important info
   const handleOpen = () => {
      openCredenza({
         children: <CategoryFilterPicker onApply={closeCredenza} />
      });
   };
}

// Functions are also exported standalone for use outside React components
import { openCredenza, closeCredenza } from "@/hooks/use-credenza";
```

#### useAlertDialog - Destructive Confirmations
Use for confirming destructive or irreversible actions.
```typescript
import { useAlertDialog } from "@/hooks/use-alert-dialog";

function DeleteButton({ itemId }: { itemId: string }) {
   const { openAlertDialog } = useAlertDialog();
   const deleteMutation = useDeleteItem();

   const handleDelete = () => {
      openAlertDialog({
         title: "Delete Item",
         description: "Are you sure? This action cannot be undone.",
         actionLabel: "Delete",        // Optional, defaults to "Confirm"
         cancelLabel: "Cancel",        // Optional, defaults to "Cancel"
         variant: "destructive",       // "default" | "destructive"
         onAction: async () => {
            await deleteMutation.mutateAsync(itemId);
         },
      });
   };
}
```

#### When to Use Each

| Scenario | Use |
|----------|-----|
| Creating/editing a transaction, category, bill | `useSheet` |
| Inviting a member, creating a team | `useSheet` |
| Applying filters that need immediate action | `useCredenza` |
| Selecting from important options | `useCredenza` |
| Deleting a record | `useAlertDialog` |
| Revoking access, removing a member | `useAlertDialog` |

---

## Import Conventions

### Path Aliases
```typescript
// Within dashboard app
import { Button } from "@/components/button";
import { useSheet } from "@/hooks/use-sheet";
import { TransactionForm } from "@/features/transaction/ui/transaction-form";

// Cross-package imports
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { serverEnv } from "@packages/environment/server";
```

### Direct Imports Only
Never use index.ts re-exports within apps. Always import from the exact source file:
```typescript
// Good
import { useEncryption } from "@/features/encryption/hooks/use-encryption";

// Bad
import { useEncryption } from "@/features/encryption";
```

---

## Environment Variables

### Naming Convention
Use **SCREAMING_SNAKE_CASE** for all environment variables:
```
DATABASE_URL
ENCRYPTION_KEY
REDIS_URL
STRIPE_SECRET_KEY
BETTER_AUTH_SECRET
```

### Zod Validation Pattern
```typescript
// packages/environment/src/server.ts
const EnvSchema = z.object({
   DATABASE_URL: z.string(),
   ENCRYPTION_KEY: z.string().length(64).regex(/^[0-9a-fA-F]+$/),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   NODE_ENV: z.enum(["development", "production", "test"]),
});

export type ServerEnv = z.infer<typeof EnvSchema>;
export const serverEnv = parseEnv(process.env, EnvSchema);
```

### Client vs Server Separation
- **Server**: `packages/environment/src/server.ts` - secrets, API keys
- **Worker**: `packages/environment/src/worker.ts` - queue config
- **Client**: Use `VITE_` prefix for frontend-exposed vars

---

## Commands Reference

### Development
```bash
bun dev              # Start dashboard, server, worker in parallel
bun dev:all          # Start all apps and packages
bun dev:server       # Server only
bun dev:landing-page # Landing page only
```

### Build
```bash
bun run build        # Build all projects (with Nx caching)
bun run typecheck    # TypeScript checks across workspace
bun run check        # Code quality checks (Biome)
```

### Database
```bash
bun run db:push      # Push schema changes to database
bun run db:studio    # Open Drizzle Studio GUI
```

### Testing
```bash
bun run test         # Run tests with parallelization
```

---

## Error Handling

### API Errors
Use `AppError` utility for consistent error types:
```typescript
throw AppError.database("Failed to create transaction");
throw AppError.notFound("Category not found");
throw AppError.unauthorized("Invalid session");
```

### Client-Side
- Toast notifications for recoverable errors (via Sonner)
- Error modals for critical/repeated failures
- Error tracking with PostHog telemetry

---

## Localization

### Usage Pattern
```typescript
import { translate } from "@packages/localization";

translate("common.actions.save");
translate("dashboard.routes.settings.profile.title");
```

### Supported Languages
- `en-US` (English)
- `pt-BR` (Portuguese - Brazil)

### File Organization
```
packages/localization/src/locales/
├── en-US/
│   ├── common/
│   │   ├── actions.json
│   │   └── form.json
│   └── dashboard/
│       └── routes/
│           └── settings.json
└── pt-BR/
    └── (same structure)
```

---

## Authentication (Better Auth)

### Session Access
```typescript
// In tRPC procedures
const resolvedCtx = await ctx;
const userId = resolvedCtx.userId;
const organizationId = resolvedCtx.organizationId;
```

### Plugins Enabled
- Google OAuth
- Magic Link
- Email OTP
- Two-Factor Authentication (2FA)

---

## Encryption

### Server-Side
Transparent encryption at repository level using the `ENCRYPTION_KEY` env var.

### End-to-End (E2E)
Optional user-controlled encryption with NaCl (TweetNaCl):
```typescript
// Check E2E status
const { e2eEnabled, isUnlocked, encrypt, decrypt } = useEncryptionContext();

// Encrypt/decrypt
const encrypted = encrypt(plaintext);
const decrypted = decrypt(encryptedData);
```
