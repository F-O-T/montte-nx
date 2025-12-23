import type { TransactionType } from "@packages/ofx";
import { useCallback } from "react";

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

// Batch duplicate info with type and score
export type BatchDuplicateInfo = DuplicateInfo & {
   fileIndex: number;
   duplicateType: "within_batch" | "existing_database";
   matchScore: number; // 0-1 weighted score
   matchedFileIndex?: number; // For within-batch duplicates
   matchedRowIndex?: number;
};

// File info for batch import
export type ImportedFileInfo = {
   fileIndex: number;
   filename: string;
   fileType: FileType;
   content: string; // base64
   status: "pending" | "parsing" | "parsed" | "error";
   transactionCount?: number;
   error?: string;
};

// CSV preview data per file (for batch imports)
export type CsvPreviewDataPerFile = {
   fileIndex: number;
   previewData: CsvPreviewData;
};

export type PendingImport = {
   // Multi-file support
   files: ImportedFileInfo[];
   
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
 */
export function createRowKey(fileIndex: number, rowIndex: number): string {
   return `${fileIndex}:${rowIndex}`;
}

/**
 * Parses a compound batch row key
 */
export function parseRowKey(key: string): {
   fileIndex: number;
   rowIndex: number;
} | null {
   const parts = key.split(":");
   if (parts.length !== 2) return null;
   const fileIndex = Number.parseInt(parts[0] ?? "", 10);
   const rowIndex = Number.parseInt(parts[1] ?? "", 10);
   if (Number.isNaN(fileIndex) || Number.isNaN(rowIndex)) return null;
   return { fileIndex, rowIndex };
}

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
