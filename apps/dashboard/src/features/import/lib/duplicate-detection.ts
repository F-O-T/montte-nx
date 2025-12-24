import { calculateDuplicateScore } from "@packages/utils/duplicate-detection";
import type {
   BatchDuplicateInfo,
   BatchParsedTransaction,
} from "./use-import-wizard";

export interface DuplicateCandidate {
   rowIndex: number;
   fileIndex: number;
   filename: string;
   date: Date;
   amount: number;
   description: string;
}

export interface ExistingTransaction {
   id: string;
   date: Date;
   amount: number;
   description: string;
}

export interface DuplicateMatch {
   candidate: DuplicateCandidate;
   matchedWith: DuplicateCandidate | ExistingTransaction;
   matchType: "within_batch" | "existing_database";
   score: number;
   scorePercentage: number;
}

/**
 * Detects duplicates within a batch of transactions.
 * Compares each transaction with all subsequent transactions.
 */
export function detectWithinBatchDuplicates(
   transactions: DuplicateCandidate[],
): DuplicateMatch[] {
   const duplicates: DuplicateMatch[] = [];

   for (let i = 0; i < transactions.length; i++) {
      const candidate = transactions[i];
      if (!candidate) continue;

      for (let j = i + 1; j < transactions.length; j++) {
         const target = transactions[j];
         if (!target) continue;

         const { score, scorePercentage, passed } = calculateDuplicateScore(
            candidate,
            target,
         );

         if (passed) {
            duplicates.push({
               candidate,
               matchedWith: target,
               matchType: "within_batch",
               score,
               scorePercentage,
            });
         }
      }
   }

   return duplicates;
}

/**
 * Detects duplicates against existing database transactions.
 */
export function detectExistingDuplicates(
   newTransactions: DuplicateCandidate[],
   existingTransactions: ExistingTransaction[],
): DuplicateMatch[] {
   const duplicates: DuplicateMatch[] = [];

   for (const candidate of newTransactions) {
      for (const existing of existingTransactions) {
         const { score, scorePercentage, passed } = calculateDuplicateScore(
            candidate,
            existing,
         );

         if (passed) {
            duplicates.push({
               candidate,
               matchedWith: existing,
               matchType: "existing_database",
               score,
               scorePercentage,
            });
            // Only keep first match for existing transactions
            break;
         }
      }
   }

   return duplicates;
}

/**
 * Detects all duplicates - both within batch and against existing transactions.
 */
export function detectAllDuplicates(
   newTransactions: DuplicateCandidate[],
   existingTransactions: ExistingTransaction[],
): DuplicateMatch[] {
   const withinBatch = detectWithinBatchDuplicates(newTransactions);
   const existing = detectExistingDuplicates(
      newTransactions,
      existingTransactions,
   );

   return [...withinBatch, ...existing];
}

/**
 * Converts batch parsed transactions to duplicate candidates.
 */
export function toBatchDuplicateCandidates(
   transactions: BatchParsedTransaction[],
): DuplicateCandidate[] {
   return transactions.map((t) => ({
      rowIndex: t.rowIndex,
      fileIndex: t.fileIndex,
      filename: t.filename,
      date: t.date,
      amount: t.amount,
      description: t.description,
   }));
}

/**
 * Converts duplicate matches to BatchDuplicateInfo for UI display.
 */
export function toBatchDuplicateInfos(
   matches: DuplicateMatch[],
): BatchDuplicateInfo[] {
   return matches.map((match) => {
      const isExisting = match.matchType === "existing_database";
      const existingTrn = isExisting
         ? (match.matchedWith as ExistingTransaction)
         : null;
      const batchTrn = !isExisting
         ? (match.matchedWith as DuplicateCandidate)
         : null;

      return {
         rowIndex: match.candidate.rowIndex,
         fileIndex: match.candidate.fileIndex,
         existingTransactionId: existingTrn?.id ?? "",
         existingTransactionDate:
            existingTrn?.date.toISOString() ??
            batchTrn?.date.toISOString() ??
            "",
         existingTransactionDescription:
            existingTrn?.description ?? batchTrn?.description ?? "",
         duplicateType: match.matchType,
         matchScore: match.scorePercentage,
         matchedFileIndex: batchTrn?.fileIndex,
         matchedRowIndex: batchTrn?.rowIndex,
      };
   });
}

// Re-export shared duplicate detection logic
export { calculateDuplicateScore };
