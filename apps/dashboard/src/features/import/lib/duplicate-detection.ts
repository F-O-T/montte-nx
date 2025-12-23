import type { BatchDuplicateInfo, BatchParsedTransaction } from "./use-import-wizard";

// Weights for duplicate detection (total: 6)
const WEIGHTS = {
   amount: 3, // Most important - exact match
   date: 2, // Important - within tolerance
   description: 1, // Less important - similarity
} as const;

const MAX_SCORE = WEIGHTS.amount + WEIGHTS.date + WEIGHTS.description;
const THRESHOLD_PERCENTAGE = 0.8; // 80% match

// Date tolerance in days
const DATE_TOLERANCE_DAYS = 1;

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
 * Extracts key tokens from description for similarity matching.
 * Removes common words and normalizes text.
 */
function extractDescriptionTokens(description: string): string[] {
   const stopWords = new Set([
      "de",
      "da",
      "do",
      "para",
      "com",
      "em",
      "no",
      "na",
      "os",
      "as",
      "um",
      "uma",
      "the",
      "a",
      "an",
      "of",
      "to",
      "in",
      "for",
      "on",
      "at",
   ]);

   return description
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token));
}

/**
 * Calculates Jaccard similarity between two sets of tokens.
 * Returns a value between 0 and 1.
 */
function calculateTokenSimilarity(tokens1: string[], tokens2: string[]): number {
   if (tokens1.length === 0 || tokens2.length === 0) return 0;

   const set1 = new Set(tokens1);
   const set2 = new Set(tokens2);

   let intersectionSize = 0;
   for (const token of set1) {
      if (set2.has(token)) intersectionSize++;
   }

   const unionSize = set1.size + set2.size - intersectionSize;
   if (unionSize === 0) return 0;

   return intersectionSize / unionSize;
}

/**
 * Checks if two dates are within the specified tolerance.
 */
function datesWithinTolerance(
   date1: Date,
   date2: Date,
   toleranceDays = DATE_TOLERANCE_DAYS,
): boolean {
   const diffMs = Math.abs(date1.getTime() - date2.getTime());
   const diffDays = diffMs / (1000 * 60 * 60 * 24);
   return diffDays <= toleranceDays;
}

/**
 * Calculates duplicate score between two transactions.
 * Returns score details with percentage.
 */
export function calculateDuplicateScore(
   candidate: DuplicateCandidate,
   target: DuplicateCandidate | ExistingTransaction,
): { score: number; scorePercentage: number; passed: boolean } {
   let score = 0;

   // Amount match (exact)
   if (candidate.amount === target.amount) {
      score += WEIGHTS.amount;
   }

   // Date match (within tolerance)
   if (datesWithinTolerance(candidate.date, target.date)) {
      score += WEIGHTS.date;
   }

   // Description similarity
   const candidateTokens = extractDescriptionTokens(candidate.description);
   const targetTokens = extractDescriptionTokens(target.description);
   const similarity = calculateTokenSimilarity(candidateTokens, targetTokens);

   // Add weighted description score based on similarity
   if (similarity >= 0.5) {
      score += WEIGHTS.description * similarity;
   }

   const scorePercentage = score / MAX_SCORE;
   const passed = scorePercentage >= THRESHOLD_PERCENTAGE;

   return { score, scorePercentage, passed };
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
   const existing = detectExistingDuplicates(newTransactions, existingTransactions);

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
         existingTransactionDate: existingTrn?.date.toISOString() ?? "",
         existingTransactionDescription: existingTrn?.description ?? "",
         duplicateType: match.matchType,
         matchScore: match.scorePercentage,
         matchedFileIndex: batchTrn?.fileIndex,
         matchedRowIndex: batchTrn?.rowIndex,
      };
   });
}
