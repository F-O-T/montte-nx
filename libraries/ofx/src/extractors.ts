import type {
   OFXBalance,
   OFXBankAccount,
   OFXCreditCardAccount,
   OFXDocument,
   OFXSignOnResponse,
   OFXTransaction,
} from "./schemas";
import { toArray } from "./utils";

export interface BalanceInfo {
   ledger?: OFXBalance;
   available?: OFXBalance;
}

export function getTransactions(document: OFXDocument): OFXTransaction[] {
   const results: OFXTransaction[] = [];

   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (bankResponse) {
      for (const r of toArray(bankResponse)) {
         const txns = r.STMTRS?.BANKTRANLIST?.STMTTRN;
         if (txns) results.push(...txns);
      }
   }

   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (ccResponse) {
      for (const r of toArray(ccResponse)) {
         const txns = r.CCSTMTRS?.BANKTRANLIST?.STMTTRN;
         if (txns) results.push(...txns);
      }
   }

   return results;
}

export function getAccountInfo(
   document: OFXDocument,
): (OFXBankAccount | OFXCreditCardAccount)[] {
   const results: (OFXBankAccount | OFXCreditCardAccount)[] = [];

   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (bankResponse) {
      for (const r of toArray(bankResponse)) {
         const account = r.STMTRS?.BANKACCTFROM;
         if (account) results.push(account);
      }
   }

   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (ccResponse) {
      for (const r of toArray(ccResponse)) {
         const account = r.CCSTMTRS?.CCACCTFROM;
         if (account) results.push(account);
      }
   }

   return results;
}

export function getBalance(document: OFXDocument): BalanceInfo[] {
   const results: BalanceInfo[] = [];

   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (bankResponse) {
      for (const r of toArray(bankResponse)) {
         if (r.STMTRS) {
            results.push({
               available: r.STMTRS.AVAILBAL,
               ledger: r.STMTRS.LEDGERBAL,
            });
         }
      }
   }

   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (ccResponse) {
      for (const r of toArray(ccResponse)) {
         if (r.CCSTMTRS) {
            results.push({
               available: r.CCSTMTRS.AVAILBAL,
               ledger: r.CCSTMTRS.LEDGERBAL,
            });
         }
      }
   }

   return results;
}

export function getSignOnInfo(document: OFXDocument): OFXSignOnResponse {
   return document.OFX.SIGNONMSGSRSV1.SONRS;
}
