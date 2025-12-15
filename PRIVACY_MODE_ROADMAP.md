# Privacy Mode Implementation Roadmap

> **Issue:** [#273 - Privacy Mode Feature](https://github.com/your-repo/montte-nx/issues/273)
> **Last Updated:** December 15, 2024

This document outlines the implementation roadmap for Montte's comprehensive Privacy Mode feature, including account deletion, login tracking, cookie consent, data disclosure, and encryption capabilities.

---

## 📊 Implementation Status

| Phase | Feature | Status | Priority |
|-------|---------|--------|----------|
| 1 | Account Deletion System | ✅ **Complete** | High |
| 2 | Login Method Tracking | ✅ **Complete** | High |
| 3 | Cookie Consent Banner | 🔲 Pending | High |
| 4 | Stripe Data Disclosure | 🔲 Pending | Medium |
| 5 | Data Encryption (E2E) | 🔲 Pending | Low (Optional) |

---

## ✅ Completed Features

### Phase 1: Account Deletion System

**Status:** ✅ Completed (Commit: `2566cb4`)

**What's Implemented:**
- Database schema with `deletionScheduledAt` and `deletionType` fields
- `account_deletion_request` table for tracking deletion requests
- tRPC API endpoints:
  - `getDeletionStatus` - Check pending deletion status
  - `requestDeletion` - Handle immediate or 30-day grace period deletion
  - `cancelDeletion` - Cancel scheduled deletions
- Password verification before deletion
- Full data cleanup across all tables (transactions, bills, budgets, etc.)
- UI integration in Settings → Profile → Delete Account

**Next Steps:**
- [ ] Run database migration: `pnpm db:generate && pnpm db:migrate`
- [ ] Implement background job to execute scheduled deletions after 30 days
- [ ] Add email notification for scheduled deletion confirmation
- [ ] Add email reminder 7 days before deletion

---

### Phase 2: Login Method Tracking

**Status:** ✅ Completed (Commit: `2566cb4`)

**What's Implemented:**
- Better Auth's `lastLoginMethod()` plugin configured
- UI displays login method in session list with icons:
  - 📧 Email & Password
  - 🌐 Google OAuth
  - 🛡️ Two-Factor (OTP)
  - 🔗 Magic Link
  - 👤 Anonymous
- Visual indicators in Settings → Security section

**Files Modified:**
- `apps/dashboard/src/pages/settings/ui/security-section.tsx`

---

## 🔲 Remaining Implementation

### Phase 3: Cookie Consent Banner

**Priority:** High (Privacy Compliance)
**Estimated Effort:** 2-3 hours

#### Implementation Plan

##### 3.1 Frontend Hook

**File:** `apps/dashboard/src/features/cookie-consent/use-cookie-consent.ts` (NEW)

```typescript
import { useEffect, useState } from "react";

const STORAGE_KEY = "montte-cookie-consent";

export type ConsentStatus = "accepted" | "declined" | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored as ConsentStatus);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
  };

  return { consent, accept, decline };
}
```

##### 3.2 Banner Component

**File:** `apps/dashboard/src/features/cookie-consent/cookie-consent-banner.tsx` (NEW)

```typescript
import { Button } from "@packages/ui/components/button";
import { Card } from "@packages/ui/components/card";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "./use-cookie-consent";
import { useTRPC } from "@/integrations/clients";

export function CookieConsentBanner() {
  const { consent, accept, decline } = useCookieConsent();
  const api = useTRPC();
  const updateTelemetry = api.session.updateTelemetryConsent.useMutation();

  if (consent !== null) return null; // Already decided

  const handleAccept = () => {
    accept();
    updateTelemetry.mutate({ consent: true });
  };

  const handleDecline = () => {
    decline();
    updateTelemetry.mutate({ consent: false });
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 shadow-lg border-2">
        <div className="flex items-start gap-3">
          <Cookie className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Cookies e Privacidade</h3>
              <p className="text-sm text-muted-foreground">
                Usamos cookies essenciais para funcionamento e telemetria
                opcional para melhorar sua experiência.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1"
              >
                Aceitar todos
              </Button>
              <Button
                onClick={handleDecline}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Apenas essenciais
              </Button>
            </div>
            <a
              href="/privacy"
              className="text-xs text-muted-foreground hover:underline inline-block"
            >
              Política de Privacidade
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

##### 3.3 Integration

**File:** `apps/dashboard/src/routes/__root.tsx`

```typescript
// Add import
import { CookieConsentBanner } from "@/features/cookie-consent/cookie-consent-banner";

// Add to RootComponent return
export function RootComponent() {
  return (
    <>
      <Outlet />
      <CookieConsentBanner />
      {/* ... other components */}
    </>
  );
}
```

##### 3.4 Critical Files

- `apps/dashboard/src/features/cookie-consent/use-cookie-consent.ts` (NEW)
- `apps/dashboard/src/features/cookie-consent/cookie-consent-banner.tsx` (NEW)
- `apps/dashboard/src/routes/__root.tsx` (MODIFY)

##### 3.5 Testing Checklist

- [ ] Banner appears on first visit
- [ ] "Accept all" enables telemetry
- [ ] "Essential only" disables telemetry
- [ ] Choice persists in localStorage
- [ ] Banner doesn't show after choice is made
- [ ] Privacy policy link works
- [ ] Mobile responsive design

---

### Phase 4: Stripe Data Disclosure

**Priority:** Medium (Transparency)
**Estimated Effort:** 1-2 hours

#### Implementation Plan

##### 4.1 Disclosure Component

**File:** `apps/dashboard/src/features/stripe-disclosure/stripe-data-disclosure.tsx` (NEW)

```typescript
import { Alert, AlertDescription, AlertTitle } from "@packages/ui/components/alert";
import { ShieldCheck } from "lucide-react";

export function StripeDataDisclosure() {
  return (
    <Alert className="bg-muted/50">
      <ShieldCheck className="size-4" />
      <AlertTitle>Pagamentos Seguros com Stripe</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          Seus dados de pagamento são processados com segurança pela Stripe,
          nossa provedora de pagamentos certificada PCI-DSS nível 1.
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Montte não armazena números de cartão de crédito</p>
          <p>• Todos os dados de pagamento são criptografados</p>
          <p>
            • Consulte a{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Política de Privacidade da Stripe
            </a>
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

##### 4.2 Integration Points

**Option A: Billing Section** (if exists)

**File:** `apps/dashboard/src/pages/settings/ui/billing-section.tsx`

```typescript
import { StripeDataDisclosure } from "@/features/stripe-disclosure/stripe-data-disclosure";

export function BillingSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StripeDataDisclosure />
        {/* ... existing billing content */}
      </CardContent>
    </Card>
  );
}
```

**Option B: Sign-Up Page** (if billing during signup)

**File:** `apps/dashboard/src/pages/sign-up/ui/sign-up-page.tsx`

Add small disclosure text near payment form:

```typescript
<p className="text-xs text-muted-foreground">
  Pagamentos processados com segurança pela{" "}
  <a href="https://stripe.com/privacy" className="underline">
    Stripe
  </a>
</p>
```

##### 4.3 Critical Files

- `apps/dashboard/src/features/stripe-disclosure/stripe-data-disclosure.tsx` (NEW)
- `apps/dashboard/src/pages/settings/ui/billing-section.tsx` (MODIFY - if exists)

##### 4.4 Testing Checklist

- [ ] Disclosure appears in billing settings
- [ ] Stripe privacy policy link opens in new tab
- [ ] Mobile responsive design
- [ ] Text is clear and concise

---

### Phase 5: End-to-End Data Encryption (Optional)

**Priority:** Low (Advanced Privacy Feature)
**Estimated Effort:** 8-12 hours
**Complexity:** High

⚠️ **Important:** This feature has significant trade-offs:
- Breaks server-side search functionality
- Impacts reporting and analytics
- Requires client-side key management
- Adds complexity to data recovery

#### Implementation Plan

##### 5.1 Encryption Package

**File:** `packages/encryption/package.json` (NEW)

```json
{
  "name": "@packages/encryption",
  "version": "1.0.0",
  "main": "src/index.ts",
  "dependencies": {
    "tweetnacl": "^1.0.3",
    "tweetnacl-util": "^0.15.1"
  }
}
```

**File:** `packages/encryption/src/index.ts` (NEW)

```typescript
import nacl from "tweetnacl";
import { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } from "tweetnacl-util";

// Application-level encryption (server-side key)
export function encryptField(value: string, serverKey: string): string {
  const key = decodeBase64(serverKey);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = decodeUTF8(value);
  const encrypted = nacl.secretbox(message, nonce, key);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return encodeBase64(fullMessage);
}

export function decryptField(encrypted: string, serverKey: string): string {
  const key = decodeBase64(serverKey);
  const fullMessage = decodeBase64(encrypted);

  const nonce = fullMessage.slice(0, nacl.secretbox.nonceLength);
  const message = fullMessage.slice(nacl.secretbox.nonceLength);

  const decrypted = nacl.secretbox.open(message, nonce, key);
  if (!decrypted) throw new Error("Decryption failed");

  return encodeUTF8(decrypted);
}

// E2E encryption (user-derived key, client-side only)
export function deriveKey(password: string, salt: string): Uint8Array {
  // Use PBKDF2 or Argon2 for key derivation
  // Simplified example - use proper KDF in production
  const combined = password + salt;
  return nacl.hash(decodeUTF8(combined)).slice(0, nacl.secretbox.keyLength);
}

export function encryptE2E(
  value: string,
  key: Uint8Array
): { encrypted: string; iv: string } {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = decodeUTF8(value);
  const encrypted = nacl.secretbox(message, nonce, key);

  return {
    encrypted: encodeBase64(encrypted),
    iv: encodeBase64(nonce),
  };
}

export function decryptE2E(
  encrypted: string,
  iv: string,
  key: Uint8Array
): string {
  const nonce = decodeBase64(iv);
  const message = decodeBase64(encrypted);

  const decrypted = nacl.secretbox.open(message, nonce, key);
  if (!decrypted) throw new Error("Decryption failed");

  return encodeUTF8(decrypted);
}
```

##### 5.2 Database Schema Extensions

**File:** `packages/database/src/schemas/encryption.ts` (NEW)

```typescript
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const encryptedField = pgTable("encrypted_field", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tableName: text("table_name").notNull(), // e.g., "transaction", "bill"
  recordId: uuid("record_id").notNull(),
  fieldName: text("field_name").notNull(), // e.g., "description", "amount"
  encryptedValue: text("encrypted_value").notNull(),
  iv: text("iv").notNull(), // Initialization vector
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Add to user schema via Better Auth:

```typescript
// In packages/authentication/src/server.ts
user: {
  additionalFields: {
    // ... existing fields
    encryptionEnabled: {
      defaultValue: false,
      input: true,
      required: false,
      type: "boolean",
    },
    encryptionKeyHash: {
      defaultValue: null,
      input: true,
      required: false,
      type: "string",
    },
  },
}
```

##### 5.3 Backend Middleware

**File:** `packages/api/src/server/middleware/encryption.ts` (NEW)

```typescript
import { encryptField, decryptField } from "@packages/encryption";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

const SENSITIVE_FIELDS = {
  transaction: ["description", "notes"],
  bill: ["description", "notes"],
  bankAccount: ["accountNumber", "notes"],
  counterparty: ["notes"],
};

export async function encryptSensitiveFields(
  tableName: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  const fields = SENSITIVE_FIELDS[tableName];
  if (!fields) return data;

  const encrypted = { ...data };
  for (const field of fields) {
    if (data[field]) {
      encrypted[field] = encryptField(data[field], ENCRYPTION_KEY);
    }
  }
  return encrypted;
}

export async function decryptSensitiveFields(
  tableName: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  const fields = SENSITIVE_FIELDS[tableName];
  if (!fields) return data;

  const decrypted = { ...data };
  for (const field of fields) {
    if (data[field]) {
      try {
        decrypted[field] = decryptField(data[field], ENCRYPTION_KEY);
      } catch {
        // Field might not be encrypted yet
        decrypted[field] = data[field];
      }
    }
  }
  return decrypted;
}
```

##### 5.4 Frontend Encryption Hook

**File:** `apps/dashboard/src/features/encryption/use-encryption.ts` (NEW)

```typescript
import { deriveKey, encryptE2E, decryptE2E } from "@packages/encryption";
import { useState, useCallback } from "react";

export function useEncryption() {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);

  const initializeKey = useCallback((password: string, userId: string) => {
    const key = deriveKey(password, userId); // userId as salt
    setEncryptionKey(key);
  }, []);

  const encrypt = useCallback(
    (value: string) => {
      if (!encryptionKey) throw new Error("Encryption key not initialized");
      return encryptE2E(value, encryptionKey);
    },
    [encryptionKey]
  );

  const decrypt = useCallback(
    (encrypted: string, iv: string) => {
      if (!encryptionKey) throw new Error("Encryption key not initialized");
      return decryptE2E(encrypted, iv, encryptionKey);
    },
    [encryptionKey]
  );

  const clearKey = useCallback(() => {
    setEncryptionKey(null);
  }, []);

  return { initializeKey, encrypt, decrypt, clearKey, hasKey: !!encryptionKey };
}
```

##### 5.5 Encryption Settings UI

**File:** `apps/dashboard/src/pages/settings/ui/encryption-settings-section.tsx` (NEW)

Add to profile security section:

```typescript
import { Switch } from "@packages/ui/components/switch";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Lock, AlertTriangle } from "lucide-react";

export function EncryptionSettingsCard() {
  const [enabled, setEnabled] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5" />
          Criptografia de Ponta a Ponta
        </CardTitle>
        <CardDescription>
          Criptografe seus dados sensíveis com uma chave que apenas você possui
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-sm">
            <strong>Atenção:</strong> Ativar a criptografia E2E desabilita:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Busca de transações por descrição</li>
              <li>Alguns relatórios financeiros</li>
              <li>Automações baseadas em texto</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Criptografia E2E</div>
            <div className="text-sm text-muted-foreground">
              {enabled ? "Ativada" : "Desativada"}
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Passphrase setup credenza when toggled on */}
      </CardContent>
    </Card>
  );
}
```

##### 5.6 Environment Variables

Add to `.env`:

```bash
ENCRYPTION_KEY=<base64-encoded-32-byte-key>
```

Generate key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

##### 5.7 Critical Files

- `packages/encryption/package.json` (NEW)
- `packages/encryption/src/index.ts` (NEW)
- `packages/database/src/schemas/encryption.ts` (NEW)
- `packages/api/src/server/middleware/encryption.ts` (NEW)
- `apps/dashboard/src/features/encryption/use-encryption.ts` (NEW)
- `apps/dashboard/src/pages/settings/ui/encryption-settings-section.tsx` (NEW)
- `packages/authentication/src/server.ts` (MODIFY)

##### 5.8 Dependencies

```bash
pnpm add tweetnacl tweetnacl-util -w
pnpm add -D @types/tweetnacl @types/tweetnacl-util -w
```

##### 5.9 Testing Checklist

- [ ] Server-side encryption works for sensitive fields
- [ ] E2E encryption/decryption works client-side
- [ ] Key derivation is secure (use proper KDF)
- [ ] Encrypted data is not searchable (verify limitation)
- [ ] Recovery mechanism exists for lost passphrases
- [ ] Migration path for existing data
- [ ] Performance impact is acceptable

---

## 📝 Implementation Notes

### Background Jobs

For **Phase 1** (scheduled deletions), implement a background job:

**Options:**
1. **BullMQ** (Recommended) - Already in packages
2. **Cron job** - Simple but less robust
3. **Database triggers** - PostgreSQL scheduled jobs

**Pseudocode:**

```typescript
// packages/queue/src/jobs/account-deletion-job.ts
export async function processScheduledDeletions() {
  const now = new Date();

  const pendingDeletions = await db.query.accountDeletionRequest.findMany({
    where: (req, { and, eq, lte }) =>
      and(
        eq(req.status, "pending"),
        eq(req.type, "grace_period"),
        lte(req.scheduledDeletionAt, now)
      ),
  });

  for (const deletion of pendingDeletions) {
    await deleteAllUserData(db, deletion.userId, /* orgId */);
    await auth.api.deleteUser({ userId: deletion.userId });

    // Mark as completed
    await db
      .update(accountDeletionRequest)
      .set({ status: "completed", completedAt: now })
      .where(eq(accountDeletionRequest.id, deletion.id));
  }
}

// Run daily at 2 AM
schedule.scheduleJob("0 2 * * *", processScheduledDeletions);
```

### Email Notifications

For deletion confirmations and reminders:

**File:** `packages/transactional/src/emails/account-deletion.tsx`

```typescript
export function DeletionScheduledEmail({
  userName,
  scheduledDate
}: {
  userName: string;
  scheduledDate: Date;
}) {
  return (
    <Email>
      <h1>Exclusão de Conta Agendada</h1>
      <p>Olá {userName},</p>
      <p>
        Sua conta Montte está agendada para exclusão em{" "}
        {scheduledDate.toLocaleDateString("pt-BR")}.
      </p>
      <p>
        Se você mudou de ideia, pode cancelar a exclusão nas configurações
        da sua conta.
      </p>
    </Email>
  );
}
```

### Translations (i18n)

Add to `packages/localization/src/locales/pt-BR/dashboard/routes/profile.json`:

```json
{
  "security": {
    "encryption": {
      "title": "Criptografia",
      "description": "Configure a criptografia de ponta a ponta",
      "enable": "Ativar E2E",
      "disable": "Desativar E2E",
      "warning": "A criptografia E2E desabilita busca e alguns relatórios"
    },
    "loginMethod": {
      "email": "Email",
      "google": "Google",
      "otp": "Código 2FA",
      "magicLink": "Link Mágico",
      "anonymous": "Anônimo"
    }
  },
  "deletion": {
    "title": "Excluir Conta",
    "immediate": "Excluir imediatamente",
    "gracePeriod": "Excluir em 30 dias",
    "warning": "Esta ação é irreversível",
    "success": {
      "immediate": "Conta excluída com sucesso",
      "scheduled": "Exclusão agendada para {date}"
    }
  },
  "cookies": {
    "banner": {
      "title": "Cookies e Privacidade",
      "description": "Usamos cookies essenciais e telemetria opcional",
      "accept": "Aceitar todos",
      "decline": "Apenas essenciais"
    }
  }
}
```

---

## 🎯 Priority Recommendations

### Must-Have (High Priority)
1. ✅ **Phase 1:** Account Deletion - Completed
2. ✅ **Phase 2:** Login Method Display - Completed
3. 🔲 **Phase 3:** Cookie Consent Banner - **Implement Next**

### Should-Have (Medium Priority)
4. 🔲 **Phase 4:** Stripe Disclosure - Quick win for transparency

### Nice-to-Have (Low Priority)
5. 🔲 **Phase 5:** Encryption - Only if privacy-focused users request it

---

## 🚀 Quick Start Guide

### To Continue Implementation:

1. **Run Migration (Required)**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

2. **Implement Phase 3 (Cookie Consent)**
   ```bash
   # Create files as outlined above
   mkdir -p apps/dashboard/src/features/cookie-consent
   # Follow Phase 3 implementation plan
   ```

3. **Test Completed Features**
   - Navigate to Settings → Profile → Delete Account
   - Navigate to Settings → Security to see login methods

4. **Create Background Job (Optional but Recommended)**
   - Implement scheduled deletion processor
   - Add to existing BullMQ queue setup

---

## 📚 Related Documentation

- [Better Auth Documentation](https://better-auth.com)
- [Better Auth Plugins](https://better-auth.com/docs/plugins)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)

---

## 🤝 Contributing

When implementing remaining phases:

1. Create a new branch from `273-feature-privacy-mode`
2. Follow existing patterns (Card/Item/ItemGroup, Credenza, etc.)
3. Add i18n translations
4. Write tests for new functionality
5. Update this roadmap when features are completed

---

**Last Updated:** December 15, 2024
**Maintained By:** Development Team
**Issue:** [#273](https://github.com/your-repo/montte-nx/issues/273)
