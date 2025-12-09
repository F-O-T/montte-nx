import {
   generateBankStatement,
   getTransactions,
   parse,
   parseBuffer,
} from "@f-o-t/ofx";
import { AppError } from "@packages/utils/errors";
import { normalizeText } from "@packages/utils/text";

interface OFXDateValue {
   raw: string;
   year: number;
   month: number;
   day: number;
   hour: number;
   minute: number;
   second: number;
   timezone: { offset: number; name: string };
   toDate: () => Date;
}

interface Transaction {
   CHECKNUM?: string;
   CORRECTACTION?: "DELETE" | "REPLACE";
   CORRECTFITID?: string;
   CURRENCY?: string;
   DTAVAIL?: OFXDateValue;
   DTPOSTED: OFXDateValue;
   DTUSER?: OFXDateValue;
   FITID: string;
   MEMO?: string;
   NAME?: string;
   PAYEEID?: string;
   REFNUM?: string;
   SIC?: string;
   SRVRTID?: string;
   TRNAMT: number;
   TRNTYPE: string;
}

type OFXTransactionType =
   | "CREDIT"
   | "DEBIT"
   | "INT"
   | "DIV"
   | "FEE"
   | "SRVCHG"
   | "DEP"
   | "ATM"
   | "POS"
   | "XFER"
   | "CHECK"
   | "PAYMENT"
   | "CASH"
   | "DIRECTDEP"
   | "DIRECTDEBIT"
   | "REPEATPMT"
   | "HOLD"
   | "OTHER";

type OFXAccountType =
   | "CHECKING"
   | "SAVINGS"
   | "MONEYMRKT"
   | "CREDITLINE"
   | "CD";

interface ParsedTransaction {
   amount: number;
   date: Date;
   description: string;
   fitid: string;
   type: "expense" | "income";
}

function mapTransactions(transactions: Transaction[]): ParsedTransaction[] {
   return transactions.map((trn) => {
      const amount = trn.TRNAMT;
      const date = trn.DTPOSTED.toDate();
      const rawDescription = trn.MEMO || trn.NAME || "No description";
      return {
         amount: Math.abs(amount),
         date,
         description: normalizeText(rawDescription),
         fitid: trn.FITID,
         type: amount < 0 ? "expense" : "income",
      };
   });
}

export async function parseOfxContent(content: string) {
   const result = parse(content);

   if (!result.success) {
      throw AppError.validation("Failed to parse OFX file", {
         cause: result.error,
      });
   }

   const transactions = getTransactions(result.data) as Transaction[];
   return mapTransactions(transactions);
}

export async function parseOfxBuffer(buffer: Uint8Array) {
   const result = parseBuffer(buffer);

   if (!result.success) {
      throw AppError.validation("Failed to parse OFX file", {
         cause: result.error,
      });
   }

   const transactions = getTransactions(result.data) as Transaction[];
   return mapTransactions(transactions);
}

export interface ExportTransaction {
   id: string;
   amount: string;
   date: Date;
   description: string;
   type: "income" | "expense" | "transfer";
   externalId?: string | null;
}

export interface ExportOfxOptions {
   accountId: string;
   bankId: string;
   accountType: "checking" | "savings" | "investment";
   currency?: string;
   startDate: Date;
   endDate: Date;
   organizationName?: string;
}

function mapAccountType(type: ExportOfxOptions["accountType"]): OFXAccountType {
   const mapping: Record<ExportOfxOptions["accountType"], OFXAccountType> = {
      checking: "CHECKING",
      investment: "MONEYMRKT",
      savings: "SAVINGS",
   };
   return mapping[type];
}

function mapTransactionType(
   type: ExportTransaction["type"],
   amount: number,
): OFXTransactionType {
   if (type === "transfer") {
      return "XFER";
   }
   if (type === "income") {
      return amount >= 0 ? "CREDIT" : "DEBIT";
   }
   return "DEBIT";
}

export function generateOfxContent(
   transactions: ExportTransaction[],
   options: ExportOfxOptions,
): string {
   const currency = options.currency ?? "BRL";

   const ofxTransactions = transactions.map((trn) => {
      const amount = Number.parseFloat(trn.amount);
      const signedAmount =
         trn.type === "expense" ? -Math.abs(amount) : Math.abs(amount);

      return {
         amount: signedAmount,
         datePosted: trn.date,
         fitId: trn.externalId ?? trn.id,
         memo: trn.description,
         type: mapTransactionType(trn.type, signedAmount),
      };
   });

   return generateBankStatement({
      accountId: options.accountId,
      accountType: mapAccountType(options.accountType),
      bankId: options.bankId,
      currency,
      endDate: options.endDate,
      financialInstitution: options.organizationName
         ? { org: options.organizationName }
         : undefined,
      startDate: options.startDate,
      transactions: ofxTransactions,
   });
}
