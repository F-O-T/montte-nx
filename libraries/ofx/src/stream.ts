import { getEncodingFromCharset } from "./parser";
import {
   balanceSchema,
   bankAccountSchema,
   creditCardAccountSchema,
   type OFXBalance,
   type OFXBankAccount,
   type OFXCreditCardAccount,
   type OFXHeader,
   type OFXTransaction,
   ofxHeaderSchema,
   transactionSchema,
} from "./schemas";

export interface StreamOptions {
   encoding?: string;
}

export type StreamEvent =
   | { type: "header"; data: OFXHeader }
   | { type: "transaction"; data: OFXTransaction }
   | { type: "account"; data: OFXBankAccount | OFXCreditCardAccount }
   | { type: "balance"; data: { ledger?: OFXBalance; available?: OFXBalance } }
   | { type: "complete"; transactionCount: number };

const ENTITY_MAP: Record<string, string> = {
   "&amp;": "&",
   "&apos;": "'",
   "&gt;": ">",
   "&lt;": "<",
   "&quot;": '"',
};

const ENTITY_REGEX = /&(?:amp|lt|gt|quot|apos);/g;

function decodeEntities(text: string): string {
   if (!text.includes("&")) return text;
   return text.replace(ENTITY_REGEX, (match) => ENTITY_MAP[match] ?? match);
}

interface ParserState {
   buffer: string;
   inHeader: boolean;
   headerParsed: boolean;
   transactionCount: number;
   currentPath: string[];
   currentObject: Record<string, unknown>;
   objectStack: Record<string, unknown>[];
}

function parseHeaderFromBuffer(
   buffer: string,
): { header: OFXHeader; bodyStart: number } | null {
   const lines = buffer.split(/\r?\n/);
   const header: Record<string, string> = {};
   let bodyStartIndex = 0;

   for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? "";

      if (line.startsWith("<?xml") || line.startsWith("<OFX>")) {
         bodyStartIndex = i;
         break;
      }

      const match = line.match(/^(\w+):(.*)$/);
      if (match?.[1] && match[2] !== undefined) {
         header[match[1]] = match[2];
      }

      if (line === "" && Object.keys(header).length > 0) {
         bodyStartIndex = i + 1;
         break;
      }
   }

   if (Object.keys(header).length === 0) return null;

   const headerResult = ofxHeaderSchema.safeParse(header);
   if (!headerResult.success) return null;

   const bodyStartChar = lines.slice(0, bodyStartIndex).join("\n").length + 1;
   return { bodyStart: bodyStartChar, header: headerResult.data };
}

function tryParseTransaction(obj: unknown): OFXTransaction | null {
   const result = transactionSchema.safeParse(obj);
   return result.success ? result.data : null;
}

function tryParseBankAccount(obj: unknown): OFXBankAccount | null {
   const result = bankAccountSchema.safeParse(obj);
   return result.success ? result.data : null;
}

function tryParseCreditCardAccount(obj: unknown): OFXCreditCardAccount | null {
   const result = creditCardAccountSchema.safeParse(obj);
   return result.success ? result.data : null;
}

function tryParseBalance(obj: unknown): OFXBalance | null {
   const result = balanceSchema.safeParse(obj);
   return result.success ? result.data : null;
}

export async function* parseStream(
   input: ReadableStream<Uint8Array> | AsyncIterable<string>,
   options?: StreamOptions,
): AsyncGenerator<StreamEvent> {
   const state: ParserState = {
      buffer: "",
      currentObject: {},
      currentPath: [],
      headerParsed: false,
      inHeader: true,
      objectStack: [{}],
      transactionCount: 0,
   };

   let detectedEncoding: string | undefined = options?.encoding;
   let decoder = new TextDecoder(detectedEncoding ?? "utf-8");
   const tagRegex = /<(\/?)([\w.]+)>([^<]*)/g;

   let pendingLedgerBalance: OFXBalance | undefined;
   let pendingAvailableBalance: OFXBalance | undefined;
   let emittedBalanceForCurrentStatement = false;

   async function* processChunk(
      chunk: string,
      isLast = false,
   ): AsyncGenerator<StreamEvent> {
      state.buffer += chunk;

      if (!state.headerParsed) {
         const headerResult = parseHeaderFromBuffer(state.buffer);
         if (headerResult) {
            state.headerParsed = true;
            state.inHeader = false;

            if (!detectedEncoding && headerResult.header.CHARSET) {
               detectedEncoding = getEncodingFromCharset(
                  headerResult.header.CHARSET,
               );
               decoder = new TextDecoder(detectedEncoding);
            }

            yield { data: headerResult.header, type: "header" };
            state.buffer = state.buffer.slice(headerResult.bodyStart);
         } else {
            return;
         }
      }

      const lastLt = state.buffer.lastIndexOf("<");
      const safeEnd = isLast ? state.buffer.length : lastLt;
      if (safeEnd <= 0) return;

      const safeBuffer = state.buffer.slice(0, safeEnd);
      let processedUpTo = 0;

      tagRegex.lastIndex = 0;
      for (
         let match = tagRegex.exec(safeBuffer);
         match !== null;
         match = tagRegex.exec(safeBuffer)
      ) {
         const isClosing = match[1] === "/";
         const tagName = match[2];
         const textContent = match[3]?.trim() ?? "";

         if (!tagName) continue;

         const currentObj = state.objectStack[state.objectStack.length - 1];
         if (!currentObj) continue;

         if (isClosing) {
            if (tagName === "STMTTRN") {
               const txn = tryParseTransaction(currentObj);
               if (txn) {
                  state.transactionCount++;
                  yield { data: txn, type: "transaction" };
               }
            } else if (tagName === "BANKACCTFROM") {
               const account = tryParseBankAccount(currentObj);
               if (account) {
                  yield { data: account, type: "account" };
               }
            } else if (tagName === "CCACCTFROM") {
               const account = tryParseCreditCardAccount(currentObj);
               if (account) {
                  yield { data: account, type: "account" };
               }
            } else if (tagName === "LEDGERBAL") {
               pendingLedgerBalance = tryParseBalance(currentObj) ?? undefined;
            } else if (tagName === "AVAILBAL") {
               pendingAvailableBalance =
                  tryParseBalance(currentObj) ?? undefined;
            } else if (
               (tagName === "STMTRS" || tagName === "CCSTMTRS") &&
               !emittedBalanceForCurrentStatement
            ) {
               if (pendingLedgerBalance || pendingAvailableBalance) {
                  yield {
                     data: {
                        available: pendingAvailableBalance,
                        ledger: pendingLedgerBalance,
                     },
                     type: "balance",
                  };
                  emittedBalanceForCurrentStatement = true;
               }
            } else if (tagName === "STMTTRNRS" || tagName === "CCSTMTTRNRS") {
               pendingLedgerBalance = undefined;
               pendingAvailableBalance = undefined;
               emittedBalanceForCurrentStatement = false;
            }

            const pathIndex = state.currentPath.lastIndexOf(tagName);
            if (pathIndex !== -1) {
               state.currentPath.length = pathIndex;
               state.objectStack.length = Math.max(pathIndex + 1, 1);
            }
         } else if (textContent) {
            const decoded = decodeEntities(textContent);
            const existing = currentObj[tagName];
            if (existing !== undefined) {
               if (Array.isArray(existing)) {
                  existing.push(decoded);
               } else {
                  currentObj[tagName] = [existing, decoded];
               }
            } else {
               currentObj[tagName] = decoded;
            }
         } else {
            const newObj: Record<string, unknown> = {};
            const existing = currentObj[tagName];
            if (existing !== undefined) {
               if (Array.isArray(existing)) {
                  existing.push(newObj);
               } else {
                  currentObj[tagName] = [existing, newObj];
               }
            } else {
               currentObj[tagName] = newObj;
            }
            state.currentPath.push(tagName);
            state.objectStack.push(newObj);
         }

         processedUpTo = tagRegex.lastIndex;
      }

      if (processedUpTo > 0) {
         state.buffer = state.buffer.slice(processedUpTo);
      }
      tagRegex.lastIndex = 0;
   }

   if (input instanceof ReadableStream) {
      const reader = input.getReader();
      const initialChunks: Uint8Array[] = [];
      let headerFound = false;

      try {
         while (!headerFound) {
            const { done, value } = await reader.read();
            if (done) break;
            initialChunks.push(value);

            const combined = new Uint8Array(
               initialChunks.reduce((sum, chunk) => sum + chunk.length, 0),
            );
            let offset = 0;
            for (const chunk of initialChunks) {
               combined.set(chunk, offset);
               offset += chunk.length;
            }

            const headerSection = new TextDecoder("ascii").decode(
               combined.slice(0, Math.min(combined.length, 1000)),
            );

            if (
               headerSection.includes("<OFX") ||
               headerSection.includes("<?xml")
            ) {
               const charsetMatch = headerSection.match(/CHARSET:(\S+)/i);
               if (charsetMatch && !detectedEncoding) {
                  detectedEncoding = getEncodingFromCharset(charsetMatch[1]);
                  decoder = new TextDecoder(detectedEncoding);
               }
               headerFound = true;

               const content = decoder.decode(combined);
               yield* processChunk(content);
            }
         }

         while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield* processChunk(decoder.decode(value, { stream: true }));
         }
         yield* processChunk(decoder.decode(), true);
      } finally {
         reader.releaseLock();
      }
   } else {
      const chunks: string[] = [];
      for await (const chunk of input) {
         chunks.push(chunk);
      }
      for (let i = 0; i < chunks.length; i++) {
         yield* processChunk(chunks[i] ?? "", i === chunks.length - 1);
      }
   }

   yield { transactionCount: state.transactionCount, type: "complete" };
}

export async function parseStreamToArray(
   input: ReadableStream<Uint8Array> | AsyncIterable<string>,
   options?: StreamOptions,
): Promise<{
   header?: OFXHeader;
   transactions: OFXTransaction[];
   accounts: (OFXBankAccount | OFXCreditCardAccount)[];
   balances: { ledger?: OFXBalance; available?: OFXBalance }[];
}> {
   const result: {
      header?: OFXHeader;
      transactions: OFXTransaction[];
      accounts: (OFXBankAccount | OFXCreditCardAccount)[];
      balances: { ledger?: OFXBalance; available?: OFXBalance }[];
   } = {
      accounts: [],
      balances: [],
      transactions: [],
   };

   for await (const event of parseStream(input, options)) {
      switch (event.type) {
         case "header":
            result.header = event.data;
            break;
         case "transaction":
            result.transactions.push(event.data);
            break;
         case "account":
            result.accounts.push(event.data);
            break;
         case "balance":
            result.balances.push(event.data);
            break;
      }
   }

   return result;
}
