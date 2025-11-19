import * as OFX from "ofx-data-extractor";

export interface OfxTransaction {
   fitid: string;
   date: Date;
   amount: number;
   description: string;
   type: "income" | "expense";
}

interface RawOfxTransaction {
   TRNAMT: string | number;
   DTPOSTED: string;
   FITID: string;
   MEMO?: string;
   NAME?: string;
}

interface OfxStructure {
   OFX?: {
      BANKMSGSRSV1?: {
         STMTTRNRS?: {
            STMTRS?: {
               BANKTRANLIST?: {
                  STMTTRN?: RawOfxTransaction | RawOfxTransaction[];
               };
            };
         };
      };
      CREDITCARDMSGSRSV1?: {
         CCSTMTTRNRS?: {
            CCSTMTRS?: {
               BANKTRANLIST?: {
                  STMTTRN?: RawOfxTransaction | RawOfxTransaction[];
               };
            };
         };
      };
   };
}

interface OfxParserInstance {
   getBankTransferList?: () => Promise<RawOfxTransaction[]>;
   getContent: () => Promise<OfxStructure>;
}

export async function parseOfxContent(
   content: string,
): Promise<OfxTransaction[]> {
   try {
      const parser = new OFX.Ofx(content) as unknown as OfxParserInstance;

      if (typeof parser.getBankTransferList === "function") {
         const transfers = await parser.getBankTransferList();

         if (transfers && Array.isArray(transfers)) {
            return transfers.map((trn) => {
               const amount =
                  typeof trn.TRNAMT === "string"
                     ? parseFloat(trn.TRNAMT)
                     : (trn.TRNAMT as number);
               const dateParts = trn.DTPOSTED.split("-");
               const date = new Date(
                  parseInt(dateParts[0], 10),
                  parseInt(dateParts[1], 10) - 1,
                  parseInt(dateParts[2], 10),
               );

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

      const result = await parser.getContent();

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
