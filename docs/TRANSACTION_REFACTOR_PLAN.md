# Transaction Feature Refactoring Plan

## Overview

This document outlines the comprehensive refactoring of the transaction feature to consolidate all transaction-related code into the `features/transaction/` folder, improve the UX for transfers, and enhance the data table expanded content.

## Current State Analysis

### Problems Identified

1. **Scattered code:** Transaction components are split across `pages/` and `features/` folders
2. **Duplicate contexts:** Two separate contexts for transaction lists (`TransactionListContext` and `BankAccountTransactionListContext`)
3. **Mark as Transfer issues:**
   - Only shows destination account selector, not source
   - Doesn't create transfer log
   - Doesn't create/match counterpart transaction
4. **Manage Transaction Sheet issues:**
   - Collapsible "Advanced Options" is confusing UX
   - Categorization buried in collapsible
5. **Expanded content missing:**
   - No attachments count display
   - No transfer log display (from → to)

### Current File Locations

```
pages/transactions/
├── ui/
│   └── transactions-table-columns.tsx  # Should be in features/
├── features/
│   ├── filter-sheet.tsx                # Duplicate of bank-account version
│   └── transaction-list-context.tsx    # Should be consolidated

pages/bank-account-details/
├── features/
│   ├── transaction-filter-sheet.tsx    # Should be in features/transaction/
│   ├── bank-account-transaction-list-context.tsx  # Should be consolidated
│   └── use-transaction-bulk-actions.ts # Should be in features/transaction/

features/transaction/
├── features/
│   ├── categorize-sheet.tsx
│   ├── category-split-sheet.tsx
│   ├── delete-transaction-dialog.tsx
│   ├── link-file-sheet.tsx
│   ├── manage-transaction-sheet.tsx
│   └── mark-as-transfer-sheet.tsx
└── ui/
    ├── category-split-input.tsx
    └── transaction-item.tsx
```

---

## Target State

### New Folder Structure

```
features/transaction/
├── components/
│   ├── transaction-table-columns.tsx      # Column definitions + helpers
│   ├── transaction-expanded-content.tsx   # Expandable row content (enhanced)
│   ├── transaction-mobile-card.tsx        # Mobile card view
│   ├── transaction-filter-sheet.tsx       # Consolidated filter sheet
│   └── category-split-input.tsx           # Moved from ui/
├── context/
│   └── transaction-list-context.tsx       # Consolidated context
├── hooks/
│   └── use-transaction-bulk-actions.ts    # Moved from pages/
├── sheets/
│   ├── categorize-sheet.tsx
│   ├── category-split-sheet.tsx
│   ├── delete-transaction-dialog.tsx
│   ├── link-file-sheet.tsx
│   ├── manage-transaction-sheet.tsx       # Redesigned with tabs
│   └── mark-as-transfer-sheet.tsx         # Enhanced with fuzzy matching
├── ui/
│   └── transaction-item.tsx
└── index.ts                               # Barrel export
```

---

## Task Breakdown

### Task 1: Move Data Table Components

**Source:** `apps/dashboard/src/pages/transactions/ui/transactions-table-columns.tsx`

**Target:** Split into 3 files in `apps/dashboard/src/features/transaction/components/`

#### File 1: `transaction-table-columns.tsx`

```tsx
// Contents:
// - getCategoryDetails() helper function
// - TransactionActionsCell component
// - createTransactionColumns() factory function
```

#### File 2: `transaction-expanded-content.tsx`

```tsx
// Contents:
// - TransactionExpandedContent component
// - Enhanced with:
//   - Attachments count (fetched separately)
//   - Transfer log display (fetched separately)
//   - Category splits display (already in data)
```

#### File 3: `transaction-mobile-card.tsx`

```tsx
// Contents:
// - TransactionMobileCard component
```

**Files to update imports:**
- `pages/transactions/ui/transactions-list-section.tsx`
- `pages/bank-account-details/ui/bank-account-recent-transactions-section.tsx`
- `pages/home/ui/home-recent-transactions-section.tsx`

---

### Task 2: Move Bulk Actions Hook

**Source:** `apps/dashboard/src/pages/bank-account-details/features/use-transaction-bulk-actions.ts`

**Target:** `apps/dashboard/src/features/transaction/hooks/use-transaction-bulk-actions.ts`

No changes to the hook itself, just location.

---

### Task 3: Move Filter Sheet

**Source:** `apps/dashboard/src/pages/bank-account-details/features/transaction-filter-sheet.tsx`

**Target:** `apps/dashboard/src/features/transaction/components/transaction-filter-sheet.tsx`

**Delete:** `apps/dashboard/src/pages/transactions/features/filter-sheet.tsx` (duplicate)

---

### Task 4: Consolidate Context

**Create:** `apps/dashboard/src/features/transaction/context/transaction-list-context.tsx`

#### Unified Interface

```tsx
interface TransactionListContextType {
   // Selection
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   
   // Filters
   categoryFilter: string;
   setCategoryFilter: (value: string) => void;
   typeFilter: string;
   setTypeFilter: (value: string) => void;
   searchTerm: string;
   setSearchTerm: (term: string) => void;
   bankAccountFilter: string;
   setBankAccountFilter: (value: string) => void;
   selectedMonth: Date;
   setSelectedMonth: (date: Date) => void;
}
```

**Delete old contexts:**
- `pages/transactions/features/transaction-list-context.tsx`
- `pages/bank-account-details/features/bank-account-transaction-list-context.tsx`

---

### Task 5: Backend - Add Repository Functions

**File:** `packages/database/src/repositories/transaction-repository.ts`

#### Function 1: `findMatchingTransferTransaction`

For exact match lookup:

```tsx
export async function findMatchingTransferTransaction(
   db: Database,
   params: {
      bankAccountId: string;
      amount: number;
      date: Date;
      organizationId: string;
   }
): Promise<Transaction | null> {
   const dateStart = new Date(params.date);
   dateStart.setHours(0, 0, 0, 0);
   const dateEnd = new Date(params.date);
   dateEnd.setHours(23, 59, 59, 999);
   
   return db.query.transactions.findFirst({
      where: and(
         eq(transactions.bankAccountId, params.bankAccountId),
         eq(transactions.organizationId, params.organizationId),
         eq(transactions.amount, params.amount.toString()),
         gte(transactions.date, dateStart),
         lte(transactions.date, dateEnd),
         not(eq(transactions.type, "transfer")),
      ),
   });
}
```

#### Function 2: `findTransferCandidates`

For fuzzy match lookup:

```tsx
export async function findTransferCandidates(
   db: Database,
   params: {
      bankAccountId: string;
      amount: number;
      date: Date;
      description: string;
      organizationId: string;
   }
): Promise<Array<{
   transaction: Transaction;
   score: number;
   matchReason: string;
}>> {
   // Search within ±7 days
   const dateStart = new Date(params.date);
   dateStart.setDate(dateStart.getDate() - 7);
   const dateEnd = new Date(params.date);
   dateEnd.setDate(dateEnd.getDate() + 7);
   
   const candidates = await db.query.transactions.findMany({
      where: and(
         eq(transactions.bankAccountId, params.bankAccountId),
         eq(transactions.organizationId, params.organizationId),
         eq(transactions.amount, params.amount.toString()),
         gte(transactions.date, dateStart),
         lte(transactions.date, dateEnd),
         not(eq(transactions.type, "transfer")),
      ),
      with: {
         bankAccount: true,
      },
   });
   
   // Score each candidate
   return candidates.map(candidate => {
      let score = 0;
      const reasons: string[] = [];
      
      // Date scoring (max 50 points)
      const daysDiff = Math.abs(
         Math.floor((candidate.date.getTime() - params.date.getTime()) / (1000 * 60 * 60 * 24))
      );
      if (daysDiff === 0) {
         score += 50;
         reasons.push("Mesma data");
      } else if (daysDiff === 1) {
         score += 40;
         reasons.push("1 dia de diferença");
      } else if (daysDiff <= 3) {
         score += 25;
         reasons.push(`${daysDiff} dias de diferença`);
      } else if (daysDiff <= 7) {
         score += 10;
         reasons.push(`${daysDiff} dias de diferença`);
      }
      
      // Description scoring (max 50 points)
      const descLower = candidate.description.toLowerCase();
      const paramDescLower = params.description.toLowerCase();
      if (descLower === paramDescLower) {
         score += 50;
         reasons.push("Descrição idêntica");
      } else if (descLower.includes(paramDescLower) || paramDescLower.includes(descLower)) {
         score += 35;
         reasons.push("Descrição similar");
      } else {
         // Check for common words
         const candidateWords = new Set(descLower.split(/\s+/));
         const paramWords = paramDescLower.split(/\s+/);
         const commonWords = paramWords.filter(w => w.length > 3 && candidateWords.has(w));
         if (commonWords.length > 0) {
            score += 20;
            reasons.push("Palavras em comum");
         }
      }
      
      return {
         transaction: candidate,
         score,
         matchReason: reasons.join(", "),
      };
   }).filter(c => c.score >= 50) // Only return candidates with score >= 50
     .sort((a, b) => b.score - a.score);
}
```

---

### Task 6: Backend - Add `findTransferCandidates` Query

**File:** `packages/api/src/server/routers/transactions.ts`

```tsx
findTransferCandidates: protectedProcedure
   .input(z.object({
      transactionId: z.string(),
      toBankAccountId: z.string(),
   }))
   .query(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;
      
      const transaction = await findTransactionById(resolvedCtx.db, input.transactionId);
      
      if (!transaction || transaction.organizationId !== organizationId) {
         throw new Error("Transaction not found");
      }
      
      const amount = Number(transaction.amount);
      const inverseAmount = -amount;
      
      const candidates = await findTransferCandidates(resolvedCtx.db, {
         bankAccountId: input.toBankAccountId,
         amount: inverseAmount,
         date: transaction.date,
         description: transaction.description,
         organizationId,
      });
      
      // Separate exact matches (score >= 90) from fuzzy matches
      const exactMatch = candidates.find(c => c.score >= 90) || null;
      const fuzzyMatches = candidates.filter(c => c.score < 90 && c.score >= 50);
      
      return {
         exactMatch: exactMatch ? {
            transaction: exactMatch.transaction,
            score: exactMatch.score,
            matchReason: exactMatch.matchReason,
         } : null,
         fuzzyMatches: fuzzyMatches.map(c => ({
            transaction: c.transaction,
            score: c.score,
            matchReason: c.matchReason,
         })),
      };
   }),
```

---

### Task 7: Backend - Update `markAsTransfer` Mutation

**File:** `packages/api/src/server/routers/transactions.ts`

Replace lines 278-311:

```tsx
markAsTransfer: protectedProcedure
   .input(z.object({
      ids: z.array(z.string()).min(1),
      toBankAccountId: z.string(),
      matchedTransactionIds: z.record(z.string(), z.string()).optional(),
      // Map of sourceTransactionId -> matchedTransactionId (user-confirmed matches)
   }))
   .mutation(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      const transactions = await Promise.all(
         input.ids.map((id) => findTransactionById(resolvedCtx.db, id)),
      );

      const validTransactions = transactions.filter(
         (t) => t && t.organizationId === organizationId && t.bankAccountId,
      );

      if (validTransactions.length === 0) {
         throw new Error("No valid transactions found");
      }

      const results = await Promise.all(
         validTransactions.map(async (t) => {
            const amount = Number(t!.amount);
            const isOutgoing = amount < 0;
            
            // 1. Update original transaction type to transfer
            await updateTransaction(resolvedCtx.db, t!.id, {
               type: "transfer",
            });
            
            let counterpartId: string;
            
            // 2. Check if user provided a matched transaction
            const userMatchedId = input.matchedTransactionIds?.[t!.id];
            
            if (userMatchedId) {
               // User confirmed a match - update it to transfer type
               await updateTransaction(resolvedCtx.db, userMatchedId, {
                  type: "transfer",
               });
               counterpartId = userMatchedId;
            } else {
               // Try to find exact match
               const exactMatch = await findMatchingTransferTransaction(
                  resolvedCtx.db,
                  {
                     bankAccountId: input.toBankAccountId,
                     amount: -amount,
                     date: t!.date,
                     organizationId,
                  }
               );
               
               if (exactMatch) {
                  // Found exact match - update it to transfer type
                  await updateTransaction(resolvedCtx.db, exactMatch.id, {
                     type: "transfer",
                  });
                  counterpartId = exactMatch.id;
               } else {
                  // No match found - create counterpart transaction
                  const counterpart = await createTransaction(resolvedCtx.db, {
                     amount: (-amount).toString(),
                     bankAccountId: input.toBankAccountId,
                     date: t!.date,
                     description: t!.description,
                     organizationId,
                     type: "transfer",
                  });
                  counterpartId = counterpart.id;
               }
            }
            
            // 3. Create transfer log linking both transactions
            await createTransferLog(resolvedCtx.db, {
               fromBankAccountId: isOutgoing ? t!.bankAccountId! : input.toBankAccountId,
               fromTransactionId: isOutgoing ? t!.id : counterpartId,
               toBankAccountId: isOutgoing ? input.toBankAccountId : t!.bankAccountId!,
               toTransactionId: isOutgoing ? counterpartId : t!.id,
               organizationId,
               notes: null,
            });
            
            return t!.id;
         }),
      );

      return results;
   }),
```

---

### Task 8: Update Mark as Transfer Sheet UI

**File:** `apps/dashboard/src/features/transaction/features/mark-as-transfer-sheet.tsx`

#### New Component Structure

```tsx
import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import { RadioGroup, RadioGroupItem } from "@packages/ui/components/radio-group";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";
import type { Transaction } from "../ui/transaction-item";

type MarkAsTransferSheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   transactions: Transaction[];
   onSuccess?: () => void;
};

type MatchOption = "create" | string; // "create" or transactionId

export function MarkAsTransferSheet({
   isOpen,
   onOpenChange,
   transactions,
   onSuccess,
}: MarkAsTransferSheetProps) {
   const queryClient = useQueryClient();
   const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
   const [step, setStep] = useState<"select-account" | "confirm-match">("select-account");
   const [selectedMatch, setSelectedMatch] = useState<MatchOption>("create");

   const { data: bankAccounts = [] } = useQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   // Get source accounts from selected transactions
   const sourceAccounts = useMemo(() => {
      const accountIds = [...new Set(
         transactions.map(t => t.bankAccountId).filter(Boolean)
      )];
      return bankAccounts.filter(a => accountIds.includes(a.id));
   }, [transactions, bankAccounts]);

   // For single transaction, fetch candidates when account is selected
   const singleTransaction = transactions.length === 1 ? transactions[0] : null;
   
   const { 
      data: candidates, 
      isLoading: isLoadingCandidates,
      refetch: refetchCandidates,
   } = useQuery({
      ...trpc.transactions.findTransferCandidates.queryOptions({
         transactionId: singleTransaction?.id || "",
         toBankAccountId: selectedBankAccountId,
      }),
      enabled: false, // Manual trigger
   });

   const markAsTransferMutation = useMutation(
      trpc.transactions.markAsTransfer.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao marcar como transferência");
         },
         onSuccess: async (data) => {
            await Promise.all([
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getAllPaginated.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.bankAccounts.getTransactions.queryKey(),
               }),
               queryClient.invalidateQueries({
                  queryKey: trpc.transactions.getStats.queryKey(),
               }),
            ]);
            toast.success(
               `${data.length} ${data.length === 1 ? "transação marcada" : "transações marcadas"} como transferência`,
            );
            onSuccess?.();
            handleOpenChange(false);
         },
      }),
   );

   const sourceBankAccountIds = [
      ...new Set(
         transactions.filter((t) => t.bankAccountId).map((t) => t.bankAccountId),
      ),
   ];

   const availableBankAccounts = bankAccounts.filter(
      (account) => !sourceBankAccountIds.includes(account.id),
   );

   const bankAccountOptions = availableBankAccounts.map((account) => ({
      label: `${account.name} - ${account.bank}`,
      value: account.id,
   }));

   const handleSearchMatches = async () => {
      if (!selectedBankAccountId) return;
      
      if (singleTransaction) {
         await refetchCandidates();
         setStep("confirm-match");
      } else {
         // For bulk, skip match confirmation
         handleConfirm();
      }
   };

   const handleConfirm = () => {
      if (!selectedBankAccountId || transactions.length === 0) return;
      
      const matchedTransactionIds: Record<string, string> = {};
      
      if (singleTransaction && selectedMatch !== "create") {
         matchedTransactionIds[singleTransaction.id] = selectedMatch;
      }
      
      markAsTransferMutation.mutate({
         ids: transactions.map((t) => t.id),
         toBankAccountId: selectedBankAccountId,
         matchedTransactionIds: Object.keys(matchedTransactionIds).length > 0 
            ? matchedTransactionIds 
            : undefined,
      });
   };

   const handleOpenChange = (open: boolean) => {
      if (!open) {
         setSelectedBankAccountId("");
         setStep("select-account");
         setSelectedMatch("create");
      }
      onOpenChange(open);
   };

   const handleBack = () => {
      setStep("select-account");
      setSelectedMatch("create");
   };

   const destinationAccount = bankAccounts.find(a => a.id === selectedBankAccountId);
   const hasExactMatch = candidates?.exactMatch != null;
   const hasFuzzyMatches = (candidates?.fuzzyMatches?.length || 0) > 0;
   const hasAnyMatch = hasExactMatch || hasFuzzyMatches;

   return (
      <Sheet onOpenChange={handleOpenChange} open={isOpen}>
         <SheetContent side="right">
            <SheetHeader>
               <SheetTitle>Marcar como Transferência</SheetTitle>
               <SheetDescription>
                  {step === "select-account" ? (
                     <>
                        Marque {transactions.length}{" "}
                        {transactions.length === 1 ? "transação" : "transações"} como
                        transferência para outra conta.
                     </>
                  ) : (
                     "Selecione a transação correspondente ou crie uma nova."
                  )}
               </SheetDescription>
            </SheetHeader>

            {step === "select-account" ? (
               <>
                  <div className="grid gap-4 px-4 py-4">
                     {/* Source Account - Disabled */}
                     <FieldGroup>
                        <Field>
                           <FieldLabel>Conta de origem</FieldLabel>
                           <Select disabled value={sourceAccounts[0]?.id || ""}>
                              <SelectTrigger>
                                 <SelectValue>
                                    {sourceAccounts.length === 1
                                       ? `${sourceAccounts[0]?.name} - ${sourceAccounts[0]?.bank}`
                                       : sourceAccounts.length > 1
                                         ? `${sourceAccounts.length} contas selecionadas`
                                         : "Nenhuma conta"}
                                 </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                 {sourceAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                       {account.name} - {account.bank}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </Field>
                     </FieldGroup>

                     {/* Destination Account */}
                     <FieldGroup>
                        <Field>
                           <FieldLabel>
                              {translate("common.form.to-account.label")}
                           </FieldLabel>
                           <Combobox
                              emptyMessage={translate("common.form.search.no-results")}
                              onValueChange={setSelectedBankAccountId}
                              options={bankAccountOptions}
                              placeholder={translate("common.form.to-account.placeholder")}
                              searchPlaceholder={translate("common.form.search.label")}
                              value={selectedBankAccountId}
                           />
                        </Field>
                     </FieldGroup>
                  </div>

                  <SheetFooter className="px-4">
                     <Button
                        className="w-full"
                        disabled={!selectedBankAccountId || isLoadingCandidates}
                        onClick={handleSearchMatches}
                     >
                        {isLoadingCandidates ? (
                           <>
                              <Loader2 className="size-4 animate-spin" />
                              Buscando...
                           </>
                        ) : singleTransaction ? (
                           <>
                              <Search className="size-4" />
                              Buscar correspondência
                           </>
                        ) : (
                           "Confirmar"
                        )}
                     </Button>
                  </SheetFooter>
               </>
            ) : (
               <>
                  <div className="grid gap-4 px-4 py-4">
                     {/* Summary of transfer */}
                     <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 text-sm">
                           <p className="font-medium">{sourceAccounts[0]?.name}</p>
                           <p className="text-muted-foreground text-xs">
                              {sourceAccounts[0]?.bank}
                           </p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                        <div className="flex-1 text-sm text-right">
                           <p className="font-medium">{destinationAccount?.name}</p>
                           <p className="text-muted-foreground text-xs">
                              {destinationAccount?.bank}
                           </p>
                        </div>
                     </div>

                     {/* Match options */}
                     <FieldGroup>
                        <Field>
                           <FieldLabel>
                              {hasAnyMatch
                                 ? "Selecione a transação correspondente"
                                 : "Nenhuma correspondência encontrada"}
                           </FieldLabel>
                           
                           <RadioGroup
                              value={selectedMatch}
                              onValueChange={(value) => setSelectedMatch(value as MatchOption)}
                              className="gap-3"
                           >
                              {/* Exact match */}
                              {candidates?.exactMatch && (
                                 <label
                                    className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
                                    data-state={selectedMatch === candidates.exactMatch.transaction.id ? "checked" : "unchecked"}
                                 >
                                    <RadioGroupItem
                                       value={candidates.exactMatch.transaction.id}
                                       className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm truncate">
                                             {candidates.exactMatch.transaction.description}
                                          </span>
                                          <Badge variant="default" className="shrink-0">
                                             {candidates.exactMatch.score}% match
                                          </Badge>
                                       </div>
                                       <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(candidates.exactMatch.transaction.date).toLocaleDateString("pt-BR")}
                                          {" "}&bull;{" "}
                                          {formatDecimalCurrency(Math.abs(Number(candidates.exactMatch.transaction.amount)))}
                                       </p>
                                       <p className="text-xs text-muted-foreground">
                                          {candidates.exactMatch.matchReason}
                                       </p>
                                    </div>
                                 </label>
                              )}

                              {/* Fuzzy matches */}
                              {candidates?.fuzzyMatches?.map((match) => (
                                 <label
                                    key={match.transaction.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
                                    data-state={selectedMatch === match.transaction.id ? "checked" : "unchecked"}
                                 >
                                    <RadioGroupItem
                                       value={match.transaction.id}
                                       className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm truncate">
                                             {match.transaction.description}
                                          </span>
                                          <Badge variant="secondary" className="shrink-0">
                                             {match.score}% match
                                          </Badge>
                                       </div>
                                       <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(match.transaction.date).toLocaleDateString("pt-BR")}
                                          {" "}&bull;{" "}
                                          {formatDecimalCurrency(Math.abs(Number(match.transaction.amount)))}
                                       </p>
                                       <p className="text-xs text-muted-foreground">
                                          {match.matchReason}
                                       </p>
                                    </div>
                                 </label>
                              ))}

                              {/* Create new option */}
                              <label
                                 className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
                                 data-state={selectedMatch === "create" ? "checked" : "unchecked"}
                              >
                                 <RadioGroupItem value="create" className="mt-0.5" />
                                 <div className="flex-1">
                                    <span className="font-medium text-sm">
                                       Criar nova transação
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                       Uma nova transação será criada na conta {destinationAccount?.name}
                                    </p>
                                 </div>
                              </label>
                           </RadioGroup>
                        </Field>
                     </FieldGroup>
                  </div>

                  <SheetFooter className="px-4 gap-2">
                     <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={markAsTransferMutation.isPending}
                     >
                        Voltar
                     </Button>
                     <Button
                        className="flex-1"
                        disabled={markAsTransferMutation.isPending}
                        onClick={handleConfirm}
                     >
                        {markAsTransferMutation.isPending ? (
                           <>
                              <Loader2 className="size-4 animate-spin" />
                              Salvando...
                           </>
                        ) : (
                           <>
                              <Check className="size-4" />
                              Confirmar
                           </>
                        )}
                     </Button>
                  </SheetFooter>
               </>
            )}
         </SheetContent>
      </Sheet>
   );
}
```

---

### Task 9: Redesign Manage Transaction Sheet

**File:** `apps/dashboard/src/features/transaction/features/manage-transaction-sheet.tsx`

#### Key Changes

1. **Remove transfer type option** from type selector
2. **Remove** `toBankAccountId` field
3. **Remove** Collapsible wrapper
4. **Remove** CategorySplitInput (moved to dedicated sheet)
5. **Add** Tabs structure (Details | Categorization)
6. **Categorization tab** has nested tabs (Category | Cost Center | Tags) like CategorizeSheet

#### New Structure

```tsx
<Sheet>
   <SheetContent>
      <form>
         <SheetHeader>
            <SheetTitle>{modeTexts.title}</SheetTitle>
            <SheetDescription>{modeTexts.description}</SheetDescription>
         </SheetHeader>
         
         <div className="px-4">
            <Tabs defaultValue="details">
               <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" className="gap-1.5">
                     <Receipt className="size-3.5" />
                     <span className="hidden sm:inline">Detalhes</span>
                  </TabsTrigger>
                  <TabsTrigger value="categorization" className="gap-1.5">
                     <FolderOpen className="size-3.5" />
                     <span className="hidden sm:inline">Categorização</span>
                  </TabsTrigger>
               </TabsList>
               
               <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Description (textarea) */}
                  {/* Amount (money input) */}
                  {/* Bank Account (select) */}
                  {/* Type (expense/income only - NO transfer) */}
                  {/* Date (date picker) */}
               </TabsContent>
               
               <TabsContent value="categorization" className="space-y-4 mt-4">
                  <Tabs defaultValue="category">
                     <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="category" className="gap-1.5">
                           <FolderOpen className="size-3.5" />
                           <span className="hidden sm:inline">Categoria</span>
                        </TabsTrigger>
                        <TabsTrigger value="cost-center" className="gap-1.5">
                           <Landmark className="size-3.5" />
                           <span className="hidden sm:inline">Centro</span>
                        </TabsTrigger>
                        <TabsTrigger value="tags" className="gap-1.5">
                           <Tag className="size-3.5" />
                           <span className="hidden sm:inline">Tags</span>
                        </TabsTrigger>
                     </TabsList>
                     
                     <TabsContent value="category" className="mt-4">
                        {/* Category combobox with create option */}
                     </TabsContent>
                     
                     <TabsContent value="cost-center" className="mt-4">
                        {/* Cost center combobox with create option */}
                     </TabsContent>
                     
                     <TabsContent value="tags" className="mt-4">
                        {/* Tags with badges + combobox to add */}
                     </TabsContent>
                  </Tabs>
               </TabsContent>
            </Tabs>
         </div>
         
         <SheetFooter className="px-4">
            <Button type="submit" className="w-full">
               {modeTexts.title}
            </Button>
         </SheetFooter>
      </form>
   </SheetContent>
</Sheet>
```

---

### Task 10: Enhance TransactionExpandedContent

**File:** `apps/dashboard/src/features/transaction/components/transaction-expanded-content.tsx`

#### New Features

1. **Attachments count** (fetched separately via `trpc.transactions.getAttachments`)
2. **Transfer log display** (fetched separately via `trpc.transactions.getTransferLog`)
3. **Keep split categories action button**

#### Component Structure

```tsx
export function TransactionExpandedContent({
   row,
   categories,
   slug,
}: TransactionExpandedContentProps) {
   const transaction = row.original;
   const tags = transaction.transactionTags || [];
   const categorySplits = transaction.categorySplits as CategorySplit[] | null;
   const hasSplit = categorySplits && categorySplits.length > 0;
   
   // Sheet states
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isTransferOpen, setIsTransferOpen] = useState(false);
   const [isSplitOpen, setIsSplitOpen] = useState(false);
   const [isCategorizeOpen, setIsCategorizeOpen] = useState(false);
   const [isLinkFileOpen, setIsLinkFileOpen] = useState(false);

   const isTransfer = transaction.type === "transfer";
   const isNotTransfer = !isTransfer;

   // Fetch attachments (separate query)
   const { data: attachments = [] } = useQuery(
      trpc.transactions.getAttachments.queryOptions({
         transactionId: transaction.id,
      }),
   );

   // Fetch transfer log for transfers (separate query)
   const { data: transferLog } = useQuery({
      ...trpc.transactions.getTransferLog.queryOptions({
         transactionId: transaction.id,
      }),
      enabled: isTransfer,
   });

   return (
      <div className="p-4 space-y-4">
         {/* Category Splits Display */}
         {hasSplit && (
            <div>
               <p className="text-xs text-muted-foreground mb-2">
                  Divisão por Categoria
               </p>
               <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {categorySplits.map((split) => {
                     const cat = categories.find((c) => c.id === split.categoryId);
                     if (!cat) return null;
                     return (
                        <div
                           className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50"
                           key={split.categoryId}
                        >
                           <div className="flex items-center gap-2">
                              <div
                                 className="size-3 rounded-sm shrink-0"
                                 style={{ backgroundColor: cat.color }}
                              />
                              <span className="text-sm truncate">{cat.name}</span>
                           </div>
                           <span className="text-sm font-medium shrink-0">
                              {formatDecimalCurrency(split.value / 100)}
                           </span>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         {/* Transfer Log Display */}
         {isTransfer && transferLog && (
            <div>
               <p className="text-xs text-muted-foreground mb-2">Transferência</p>
               <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                     <p className="text-sm font-medium">
                        {transferLog.fromBankAccount?.name}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        {transferLog.fromBankAccount?.bank}
                     </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 text-right">
                     <p className="text-sm font-medium">
                        {transferLog.toBankAccount?.name}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        {transferLog.toBankAccount?.bank}
                     </p>
                  </div>
               </div>
            </div>
         )}

         {/* Tags */}
         {tags.length > 0 && (
            <div>
               <p className="text-xs text-muted-foreground mb-2">Tags</p>
               <div className="flex flex-wrap gap-1">
                  {tags.map((transactionTag) => (
                     <Link
                        key={transactionTag.tag.id}
                        params={{ slug, tagId: transactionTag.tag.id }}
                        to="/$slug/tags/$tagId"
                     >
                        <Badge
                           className="cursor-pointer hover:opacity-80 transition-opacity"
                           style={{ backgroundColor: transactionTag.tag.color }}
                           variant="secondary"
                        >
                           {transactionTag.tag.name}
                        </Badge>
                     </Link>
                  ))}
               </div>
            </div>
         )}

         {/* Cost Center */}
         {transaction.costCenter && (
            <div>
               <p className="text-xs text-muted-foreground mb-1">Centro de Custo</p>
               <p className="text-sm font-medium">{transaction.costCenter.name}</p>
            </div>
         )}

         {/* Bank Account */}
         {transaction.bankAccount && (
            <div>
               <p className="text-xs text-muted-foreground mb-1">Conta</p>
               <p className="text-sm font-medium">{transaction.bankAccount.name}</p>
            </div>
         )}

         {/* Attachments Count */}
         {attachments.length > 0 && (
            <div>
               <p className="text-xs text-muted-foreground mb-1">Anexos</p>
               <Badge variant="outline">
                  <Paperclip className="size-3 mr-1.5" />
                  {attachments.length} {attachments.length === 1 ? "arquivo" : "arquivos"}
               </Badge>
            </div>
         )}

         {/* Actions */}
         <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {isNotTransfer && (
               <Button
                  onClick={() => setIsTransferOpen(true)}
                  size="sm"
                  variant="outline"
               >
                  <ArrowLeftRight className="size-4" />
                  Marcar Transferência
               </Button>
            )}
            
            <Button
               onClick={() => setIsSplitOpen(true)}
               size="sm"
               variant="outline"
            >
               <Split className="size-4" />
               Dividir Categorias
            </Button>
            
            <Button
               onClick={() => setIsCategorizeOpen(true)}
               size="sm"
               variant="outline"
            >
               <FolderOpen className="size-4" />
               Categorizar
            </Button>
            
            <Button
               onClick={() => setIsLinkFileOpen(true)}
               size="sm"
               variant="outline"
            >
               <Paperclip className="size-4" />
               {translate("dashboard.routes.transactions.link-file.button")}
            </Button>
            
            <div className="h-4 w-px bg-border" />
            
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{ slug, transactionId: transaction.id }}
                  to="/$slug/transactions/$transactionId"
               >
                  <Eye className="size-4" />
                  Ver Detalhes
               </Link>
            </Button>
            
            <Button
               onClick={() => setIsEditOpen(true)}
               size="sm"
               variant="outline"
            >
               <Pencil className="size-4" />
               Editar
            </Button>
            
            <Button
               onClick={() => setIsDeleteOpen(true)}
               size="sm"
               variant="destructive"
            >
               <Trash2 className="size-4" />
               Excluir
            </Button>
         </div>

         {/* Sheets */}
         <ManageTransactionSheet
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            transaction={transaction}
         />
         <DeleteTransaction
            onOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            transaction={transaction}
         />
         <MarkAsTransferSheet
            isOpen={isTransferOpen}
            onOpenChange={setIsTransferOpen}
            transactions={[transaction]}
         />
         <CategorySplitSheet
            isOpen={isSplitOpen}
            onOpenChange={setIsSplitOpen}
            transaction={transaction}
         />
         <CategorizeSheet
            isOpen={isCategorizeOpen}
            onOpenChange={setIsCategorizeOpen}
            transactions={[transaction]}
         />
         <LinkFileSheet
            isOpen={isLinkFileOpen}
            onOpenChange={setIsLinkFileOpen}
            transaction={transaction}
         />
      </div>
   );
}
```

---

### Task 11: Wrap Pages with TransactionListProvider

**Files to update:**

1. `apps/dashboard/src/pages/transactions/` - wrap with provider
2. `apps/dashboard/src/pages/bank-account-details/` - wrap with provider

Example:

```tsx
// In transactions page layout or component
import { TransactionListProvider } from "@/features/transaction/context/transaction-list-context";

export function TransactionsPage() {
   return (
      <TransactionListProvider>
         {/* Page content */}
      </TransactionListProvider>
   );
}
```

---

### Task 12: Update Imports

**Files that need import updates:**

| File | Old Import | New Import |
|------|-----------|------------|
| `pages/transactions/ui/transactions-list-section.tsx` | `../ui/transactions-table-columns` | `@/features/transaction/components/transaction-table-columns` |
| `pages/bank-account-details/ui/bank-account-recent-transactions-section.tsx` | `@/pages/transactions/ui/transactions-table-columns` | `@/features/transaction/components/transaction-table-columns` |
| `pages/bank-account-details/ui/bank-account-recent-transactions-section.tsx` | `../features/use-transaction-bulk-actions` | `@/features/transaction/hooks/use-transaction-bulk-actions` |
| `pages/bank-account-details/ui/bank-account-recent-transactions-section.tsx` | `../features/transaction-filter-sheet` | `@/features/transaction/components/transaction-filter-sheet` |
| `pages/home/ui/home-recent-transactions-section.tsx` | `@/pages/transactions/ui/transactions-table-columns` | `@/features/transaction/components/transaction-table-columns` |

---

### Task 13: Delete Old Files

**Files to delete after migration:**

```
apps/dashboard/src/pages/transactions/ui/transactions-table-columns.tsx
apps/dashboard/src/pages/transactions/features/transaction-list-context.tsx
apps/dashboard/src/pages/transactions/features/filter-sheet.tsx
apps/dashboard/src/pages/bank-account-details/features/bank-account-transaction-list-context.tsx
apps/dashboard/src/pages/bank-account-details/features/transaction-filter-sheet.tsx
apps/dashboard/src/pages/bank-account-details/features/use-transaction-bulk-actions.ts
```

---

## Execution Order

1. **Backend first:**
   - Task 5: Add repository functions
   - Task 6: Add `findTransferCandidates` query
   - Task 7: Update `markAsTransfer` mutation

2. **File moves:**
   - Task 1: Move table components
   - Task 2: Move bulk actions hook
   - Task 3: Move filter sheet
   - Task 4: Create consolidated context

3. **UI updates:**
   - Task 8: Update Mark as Transfer Sheet
   - Task 9: Redesign Manage Transaction Sheet
   - Task 10: Enhance TransactionExpandedContent

4. **Integration:**
   - Task 11: Wrap pages with provider
   - Task 12: Update all imports

5. **Cleanup:**
   - Task 13: Delete old files
   - Task 14: Test everything

---

## Testing Checklist

- [ ] Mark single transaction as transfer with exact match
- [ ] Mark single transaction as transfer with fuzzy match
- [ ] Mark single transaction as transfer with no match (creates new)
- [ ] Mark multiple transactions as transfer (bulk)
- [ ] Create new transaction (expense/income)
- [ ] Edit existing transaction with categorization tabs
- [ ] View expanded content with attachments
- [ ] View expanded content with transfer log
- [ ] View expanded content with category splits
- [ ] Split categories action from expanded content
- [ ] Filter transactions by type/category
- [ ] Bulk select and categorize transactions
- [ ] Bulk select and delete transactions
- [ ] Context state persists across navigation

---

## Notes

- The fuzzy matching uses a scoring system (0-100) based on date proximity and description similarity
- Exact matches (score >= 90) are auto-suggested as the default option
- Fuzzy matches (50-89) are shown as alternatives
- Scores below 50 are not shown as candidates
- For bulk operations, exact matching is used automatically to avoid overwhelming UX
- The transfer type is completely removed from the manage transaction sheet - transfers must be created via "Mark as Transfer"
