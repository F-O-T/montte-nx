# Automation Version History Feature

## Overview

Add automation **version history** feature that allows users to view the history of changes made to an automation rule. This includes who made changes, when, and what was modified.

## Issue Reference

- GitHub Issue: #285 - Automation History

## Implementation Plan

### Files to Create/Modify

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `packages/api/src/server/routers/automations.ts` | Modify | Add `versions.getHistory` endpoint |
| 2 | `apps/dashboard/src/pages/automation-details/ui/automation-history-view.tsx` | Delete | Remove incorrect execution log view |
| 3 | `apps/dashboard/src/pages/automation-details/ui/automation-version-history-view.tsx` | Create | DataTable-based version history view |
| 4 | `apps/dashboard/src/pages/automation-details/ui/automation-builder.tsx` | Modify | Pass `onBackToEditor` callback to history view |

---

## 1. API Endpoint: `versions.getHistory`

**Location:** `packages/api/src/server/routers/automations.ts`

```typescript
versions: router({
   getHistory: protectedProcedure
      .input(z.object({
         ruleId: z.string(),
         page: z.coerce.number().min(1).default(1),
         limit: z.coerce.number().min(1).max(100).default(20),
      }))
      .query(async ({ ctx, input }) => {
         // 1. Resolve context
         // 2. Verify rule belongs to organization
         // 3. Call getVersionHistory from repository
         // 4. Return versions with pagination
      })
})
```

**Security:** Verifies the automation rule belongs to the user's organization before returning version history.

---

## 2. Version History View Component

**Location:** `apps/dashboard/src/pages/automation-details/ui/automation-version-history-view.tsx`

### Props

```typescript
type AutomationVersionHistoryViewProps = {
   automationId: string;
   onBackToEditor: () => void;
}
```

### Header

- Title: "Historico de Versoes"
- Badge showing total version count
- "Voltar ao Editor" button (calls `onBackToEditor`)

### DataTable Columns

| Column | Content |
|--------|---------|
| Versao | `v{number}` badge |
| Tipo | Change type badge with colors |
| Alterado por | User name or email (or "Sistema" if null) |
| Data | Formatted timestamp (dd/MM/yyyy HH:mm) |
| Descricao | Change description or "-" |

### Change Type Labels & Colors

| Type | Label (PT-BR) | Color |
|------|---------------|-------|
| `created` | Criado | Green |
| `updated` | Atualizado | Blue |
| `restored` | Restaurado | Amber |
| `deleted` | Excluido | Red |

### Expandable Row (Diff View)

- Shows changed fields in readable format
- Simple fields: "Campo: 'valor antigo' -> 'valor novo'"
- Complex fields (conditions, actions, flowData): Summary like "3 acoes modificadas"
- If no diff available, shows "Snapshot inicial"

### Empty State

- Icon + "Nenhuma versao encontrada"
- Description: "O historico de versoes aparecera aqui quando a automacao for modificada."

### Mobile Support

- Mobile card view following existing patterns from `automations-table-columns.tsx`

---

## 3. View Mode Toggle Flow

```
+---------------------------------------------+
|  EDITOR MODE                                |
|  +---------+                                |
|  | Toolbar | <- Click History button        |
|  | [clock] |                                |
|  +---------+                                |
|  +-------------------------------------+    |
|  |          Canvas                     |    |
|  |                                     |    |
|  +-------------------------------------+    |
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
|  HISTORY MODE                               |
|  +-------------------------------------+    |
|  | Historico de Versoes    [<- Editor] |    |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  |         DataTable                   |    |
|  |  v3 | updated | Joao | 10/12/2025   |    |
|  |  v2 | updated | Maria| 09/12/2025   |    |
|  |  v1 | created | Joao | 08/12/2025   |    |
|  +-------------------------------------+    |
|  [Pagination]                               |
+---------------------------------------------+
```

---

## 4. Database Schema (Existing)

The `automationRuleVersion` table already exists with:

- `id` - UUID primary key
- `ruleId` - Reference to automation rule
- `version` - Version number (integer)
- `snapshot` - Full snapshot of the rule at that version (JSONB)
- `changeType` - Type of change: created | updated | restored | deleted
- `changedBy` - User who made the change (nullable)
- `changedAt` - Timestamp of the change
- `changeDescription` - Optional description of what changed
- `diff` - Array of field changes (JSONB)

---

## 5. Repository Functions (Existing)

From `packages/database/src/repositories/automation-version-repository.ts`:

- `getVersionHistory(db, ruleId, { limit, offset })` - Returns paginated versions with user info
- `getVersion(db, ruleId, version)` - Get specific version
- `getLatestVersion(db, ruleId)` - Get latest version
- `createVersion(db, data)` - Create new version (with atomic version numbering)
- `computeDiff(oldSnapshot, newSnapshot)` - Compute diff between snapshots
- `createSnapshotFromRule(rule)` - Create snapshot from rule

---

## Notes

1. **Version creation is not automatic yet** - Versions are not automatically created when automations are updated. This can be added in a future enhancement.

2. **No restore functionality for now** - Users can view history but cannot restore to a previous version. This can be added later.

3. **Execution logs remain in ActivityPanel** - The execution log history (automation runs) is still accessible via the `ActivityPanel` at the bottom of the canvas. This feature is specifically for rule version history.

---

## Future Enhancements

- [ ] Automatic version creation on automation updates
- [ ] Restore to previous version functionality
- [ ] Version comparison view (side-by-side diff)
- [ ] Export version history
