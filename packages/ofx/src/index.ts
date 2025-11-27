import { getTransactions, parse } from "@f-o-t/ofx";
import { AppError } from "@packages/utils/errors";

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

export async function parseOfxContent(content: string) {
   const result = parse(content);

   if (!result.success) {
      throw AppError.validation("Failed to parse OFX file", {
         cause: result.error,
      });
   }

   const transactions = getTransactions(result.data) as Transaction[];

   return transactions.map((trn) => {
      const amount = trn.TRNAMT;
      const date = trn.DTPOSTED.toDate();
      return {
         amount: Math.abs(amount),
         date,
         description: trn.MEMO || trn.NAME || "No description",
         fitid: trn.FITID,
         type: amount < 0 ? "expense" : "income",
      };
   });
}
