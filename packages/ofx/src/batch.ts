import {
   parseBatchStream,
   type BatchFileInput,
   type OFXTransaction,
} from "@f-o-t/ofx";
import { normalizeText } from "@packages/utils/text";

import type { ParsedTransaction, TransactionType } from "./index";

// Batch progress event types
export type BatchOfxProgressEvent =
   | { type: "file_start"; fileIndex: number; filename: string }
   | {
        type: "transaction";
        fileIndex: number;
        transaction: BatchParsedTransaction;
     }
   | {
        type: "file_complete";
        fileIndex: number;
        filename: string;
        transactionCount: number;
     }
   | { type: "file_error"; fileIndex: number; filename: string; error: string }
   | {
        type: "batch_complete";
        totalFiles: number;
        totalTransactions: number;
        errorCount: number;
     };

// Extended parsed transaction with file tracking
export interface BatchParsedTransaction extends ParsedTransaction {
   fileIndex: number;
   filename: string;
}

export interface BatchOfxParseOptions {
   onProgress?: (event: BatchOfxProgressEvent) => void;
}

/**
 * Classifies a transaction amount into expense, income, or zero.
 */
function classifyTransactionType(amount: number): TransactionType {
   if (amount === 0) {
      return "zero";
   }
   return amount < 0 ? "expense" : "income";
}

/**
 * Maps an OFX transaction to our domain model with file tracking.
 */
function mapBatchTransaction(
   trn: OFXTransaction,
   fileIndex: number,
   filename: string,
): BatchParsedTransaction {
   const amount = trn.TRNAMT;
   const date = trn.DTPOSTED.toDate();
   const rawDescription = trn.MEMO || trn.NAME || "No description";
   return {
      amount: Math.abs(amount),
      date,
      description: normalizeText(rawDescription),
      fileIndex,
      filename,
      fitid: trn.FITID ?? "",
      type: classifyTransactionType(amount),
   };
}

/**
 * High-level batch OFX parser with progress callbacks.
 * Streams files for memory efficiency and UI responsiveness.
 *
 * @param files - Array of files with filename and buffer
 * @param options - Parse options with progress callback
 * @returns Array of all parsed transactions across all files
 */
export async function parseOfxBatch(
   files: BatchFileInput[],
   options?: BatchOfxParseOptions,
): Promise<BatchParsedTransaction[]> {
   const transactions: BatchParsedTransaction[] = [];

   for await (const event of parseBatchStream(files)) {
      switch (event.type) {
         case "file_start":
            options?.onProgress?.({
               type: "file_start",
               fileIndex: event.fileIndex,
               filename: event.filename,
            });
            break;

         case "transaction": {
            const file = files[event.fileIndex];
            if (file) {
               const mapped = mapBatchTransaction(
                  event.data,
                  event.fileIndex,
                  file.filename,
               );
               transactions.push(mapped);
               options?.onProgress?.({
                  type: "transaction",
                  fileIndex: event.fileIndex,
                  transaction: mapped,
               });
            }
            break;
         }

         case "file_complete":
            options?.onProgress?.({
               type: "file_complete",
               fileIndex: event.fileIndex,
               filename: event.filename,
               transactionCount: event.transactionCount,
            });
            break;

         case "file_error":
            options?.onProgress?.({
               type: "file_error",
               fileIndex: event.fileIndex,
               filename: event.filename,
               error: event.error,
            });
            break;

         case "batch_complete":
            options?.onProgress?.({
               type: "batch_complete",
               totalFiles: event.totalFiles,
               totalTransactions: event.totalTransactions,
               errorCount: event.errorCount,
            });
            break;
      }
   }

   return transactions;
}

// Re-export BatchFileInput for convenience
export type { BatchFileInput };
