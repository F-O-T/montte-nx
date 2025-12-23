import type { TransactionType } from "@packages/ofx";
import { useCallback } from "react";
import type {
	BatchDuplicateInfo,
	CsvPreviewDataPerFile,
	ImportedFile,
} from "@/features/import/lib/use-import-wizard";
import {
	createBatchRowKey,
	parseBatchRowKey,
} from "@/features/import/lib/use-import-wizard";

const STORAGE_KEY = "montte:pending-import";
const EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export type FileType = "csv" | "ofx";

export type ColumnMapping = {
   date: number;
   amount: number;
   description: number;
   type?: number;
};

export type CsvPreviewData = {
   headers: string[];
   sampleRows: string[][];
   detectedFormat: { id: string; name: string } | null;
   suggestedMapping: {
      date: number | null;
      amount: number | null;
      description: number | null;
   };
   totalRows: number;
   delimiter: string;
};

// Single file transaction (legacy support)
export type SerializedTransaction = {
   rowIndex: number;
   date: string; // ISO string
   amount: number;
   description: string;
   type: TransactionType;
   externalId?: string; // FITID for OFX
};

// Batch transaction with file tracking
export type SerializedBatchTransaction = SerializedTransaction & {
   fileIndex: number;
   filename: string;
};

// Single file duplicate info (legacy support)
export type DuplicateInfo = {
   rowIndex: number;
   existingTransactionId: string;
   existingTransactionDate: string;
   existingTransactionDescription: string;
};

export type PendingImport = {
   // Multi-file support
   files: ImportedFile[];
   
   timestamp: number;
   bankAccountId: string | null;

   // Parsed data (survives navigation)
   parsedTransactions: SerializedBatchTransaction[];
   selectedRowKeys: string[]; // Format: "fileIndex:rowIndex"
   duplicates: BatchDuplicateInfo[];
   duplicatesChecked: boolean;

   // CSV-specific - shared mapping for all CSVs
   csvPreviewDataList: CsvPreviewDataPerFile[];
   columnMapping: ColumnMapping | null;
};

/**
 * Creates a compound key for batch row selection
 * Format: "fileIndex:rowIndex"
 * @see createBatchRowKey from use-import-wizard.ts
 */
export const createRowKey = createBatchRowKey;

/**
 * Parses a compound batch row key
 * @see parseBatchRowKey from use-import-wizard.ts
 */
export const parseRowKey = parseBatchRowKey;

export function usePendingImport() {
   const getPending = useCallback((): PendingImport | null => {
      try {
         const data = sessionStorage.getItem(STORAGE_KEY);
         if (!data) return null;

         const parsed = JSON.parse(data) as PendingImport;

         // Check expiry
         if (Date.now() - parsed.timestamp > EXPIRY_MS) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
         }

         return parsed;
      } catch {
         return null;
      }
   }, []);

   const setPending = useCallback((data: Omit<PendingImport, "timestamp">) => {
      try {
         sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...data, timestamp: Date.now() }),
         );
      } catch {
         // sessionStorage not available or quota exceeded
      }
   }, []);

   const updatePending = useCallback((updates: Partial<PendingImport>) => {
      try {
         const current = sessionStorage.getItem(STORAGE_KEY);
         if (!current) return;

         const parsed = JSON.parse(current) as PendingImport;
         sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...parsed, ...updates, timestamp: Date.now() }),
         );
      } catch {
         // Handle error silently
      }
   }, []);

   const clearPending = useCallback(() => {
      try {
         sessionStorage.removeItem(STORAGE_KEY);
      } catch {
         // Handle error silently
      }
   }, []);

   return { getPending, setPending, updatePending, clearPending };
}
