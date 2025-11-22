import { Ofx } from "ofx-data-extractor";

export async function parseOfxContent(content: string) {
   try {
      const parser = new Ofx(content);

      if (typeof parser.getBankTransferList === "function") {
         const transfers = parser.getBankTransferList();

         if (transfers && Array.isArray(transfers)) {
            return transfers.map((trn) => {
               const amount =
                  typeof trn.TRNAMT === "string"
                     ? parseFloat(trn.TRNAMT)
                     : (trn.TRNAMT as number);
               const dateString = trn.DTPOSTED;

               if (!dateString) {
                  throw new Error("Missing DTPOSTED in OFX transfer");
               }

               const [yearStr, monthStr, dayStr] = dateString.split("-");

               const year = parseInt(yearStr ?? "0", 10);
               const month = parseInt(monthStr ?? "1", 10) - 1;
               const day = parseInt(dayStr ?? "1", 10);
               const date = new Date(year, month, day);

               return {
                  amount: Math.abs(amount),
                  date,
                  description: trn.MEMO || trn.NAME || "No description",
                  fitid: trn.FITID,
                  type: amount < 0 ? "expense" : "income",
               };
            });
         }
      }

      const result = parser.getContent();

      const bankMsgs =
         result.OFX?.BANKMSGSRSV1 || result.OFX?.CREDITCARDMSGSRSV1;
      const stmtTrnRs = bankMsgs?.STMTTRNRS || bankMsgs?.CCSTMTTRNRS;
      const stmTrs = stmtTrnRs?.STMTRS || stmtTrnRs?.CCSTMTRS;
      const bankTranList = stmTrs?.BANKTRANLIST;
      const stmtTrn = bankTranList?.STMTTRN;

      if (!stmtTrn) {
         return [];
      }

      const transactionsArray = Array.isArray(stmtTrn) ? stmtTrn : [stmtTrn];

      return transactionsArray.map((trn) => {
         const amount =
            typeof trn.TRNAMT === "string"
               ? parseFloat(trn.TRNAMT)
               : (trn.TRNAMT as number);
         const dateString = trn.DTPOSTED;

         if (!dateString) {
            throw new Error("Missing DTPOSTED in OFX transaction");
         }

         const year = parseInt(dateString.substring(0, 4), 10);
         const month = parseInt(dateString.substring(4, 6), 10) - 1;
         const day = parseInt(dateString.substring(6, 8), 10);
         const date = new Date(Date.UTC(year, month, day));

         return {
            amount: Math.abs(amount),
            date,
            description: trn.MEMO || trn.NAME || "No description",
            fitid: trn.FITID,
            type: amount < 0 ? "expense" : "income",
         };
      });
   } catch (_error) {
      throw new Error("Failed to parse OFX file");
   }
}
