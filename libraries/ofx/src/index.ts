import { z } from "zod";

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

const ofxDateSchema = z.string().transform((val): OFXDateValue => {
   const year = val.substring(0, 4);
   const month = val.substring(4, 6);
   const day = val.substring(6, 8);
   const hour = val.substring(8, 10) || "00";
   const minute = val.substring(10, 12) || "00";
   const second = val.substring(12, 14) || "00";

   const tzMatch = val.match(/\[([+-]?\d+):(\w+)\]/);
   const tzOffset = tzMatch ? Number.parseInt(tzMatch[1] ?? "0", 10) : 0;
   const tzName = tzMatch?.[2] ?? "UTC";

   return {
      day: Number.parseInt(day, 10),
      hour: Number.parseInt(hour, 10),
      minute: Number.parseInt(minute, 10),
      month: Number.parseInt(month, 10),
      raw: val,
      second: Number.parseInt(second, 10),
      timezone: { name: tzName, offset: tzOffset },
      toDate(): Date {
         const offsetMs = tzOffset * 60 * 60 * 1000;
         return new Date(
            Date.UTC(
               Number.parseInt(year, 10),
               Number.parseInt(month, 10) - 1,
               Number.parseInt(day, 10),
               Number.parseInt(hour, 10),
               Number.parseInt(minute, 10),
               Number.parseInt(second, 10),
            ) - offsetMs,
         );
      },
      year: Number.parseInt(year, 10),
   };
});

export type OFXDate = z.infer<typeof ofxDateSchema>;

const statusSchema = z.object({
   CODE: z.string(),
   MESSAGE: z.string().optional(),
   SEVERITY: z.enum(["INFO", "WARN", "ERROR"]),
});

export type OFXStatus = z.infer<typeof statusSchema>;

const financialInstitutionSchema = z.object({
   FID: z.string().optional(),
   ORG: z.string().optional(),
});

export type OFXFinancialInstitution = z.infer<
   typeof financialInstitutionSchema
>;

const transactionTypeSchema = z.enum([
   "CREDIT",
   "DEBIT",
   "INT",
   "DIV",
   "FEE",
   "SRVCHG",
   "DEP",
   "ATM",
   "POS",
   "XFER",
   "CHECK",
   "PAYMENT",
   "CASH",
   "DIRECTDEP",
   "DIRECTDEBIT",
   "REPEATPMT",
   "HOLD",
   "OTHER",
]);

export type OFXTransactionType = z.infer<typeof transactionTypeSchema>;

const transactionSchema = z.object({
   CHECKNUM: z.string().optional(),
   CORRECTACTION: z.enum(["DELETE", "REPLACE"]).optional(),
   CORRECTFITID: z.string().optional(),
   CURRENCY: z.string().optional(),
   DTAVAIL: ofxDateSchema.optional(),
   DTPOSTED: ofxDateSchema,
   DTUSER: ofxDateSchema.optional(),
   FITID: z.string(),
   MEMO: z.string().optional(),
   NAME: z.string().optional(),
   PAYEEID: z.string().optional(),
   REFNUM: z.string().optional(),
   SIC: z.string().optional(),
   SRVRTID: z.string().optional(),
   TRNAMT: z.string().transform((val) => Number.parseFloat(val)),
   TRNTYPE: transactionTypeSchema,
});

export type OFXTransaction = z.infer<typeof transactionSchema>;

const accountTypeSchema = z.enum([
   "CHECKING",
   "SAVINGS",
   "MONEYMRKT",
   "CREDITLINE",
   "CD",
]);

export type OFXAccountType = z.infer<typeof accountTypeSchema>;

const bankAccountSchema = z.object({
   ACCTID: z.string(),
   ACCTKEY: z.string().optional(),
   ACCTTYPE: accountTypeSchema,
   BANKID: z.string(),
   BRANCHID: z.string().optional(),
});

export type OFXBankAccount = z.infer<typeof bankAccountSchema>;

const creditCardAccountSchema = z.object({
   ACCTID: z.string(),
   ACCTKEY: z.string().optional(),
});

export type OFXCreditCardAccount = z.infer<typeof creditCardAccountSchema>;

const balanceSchema = z.object({
   BALAMT: z.string().transform((val) => Number.parseFloat(val)),
   DTASOF: ofxDateSchema,
});

export type OFXBalance = z.infer<typeof balanceSchema>;

const transactionListSchema = z.object({
   DTEND: ofxDateSchema,
   DTSTART: ofxDateSchema,
   STMTTRN: z.array(transactionSchema).default([]),
});

export type OFXTransactionList = z.infer<typeof transactionListSchema>;

const bankStatementResponseSchema = z.object({
   AVAILBAL: balanceSchema.optional(),
   BANKACCTFROM: bankAccountSchema,
   BANKTRANLIST: transactionListSchema.optional(),
   CURDEF: z.string().default("USD"),
   LEDGERBAL: balanceSchema.optional(),
   MKTGINFO: z.string().optional(),
});

export type OFXBankStatementResponse = z.infer<
   typeof bankStatementResponseSchema
>;

const creditCardStatementResponseSchema = z.object({
   AVAILBAL: balanceSchema.optional(),
   BANKTRANLIST: transactionListSchema.optional(),
   CCACCTFROM: creditCardAccountSchema,
   CURDEF: z.string().default("USD"),
   LEDGERBAL: balanceSchema.optional(),
   MKTGINFO: z.string().optional(),
});

export type OFXCreditCardStatementResponse = z.infer<
   typeof creditCardStatementResponseSchema
>;

const signOnResponseSchema = z.object({
   ACCESSKEY: z.string().optional(),
   DTSERVER: ofxDateSchema,
   FI: financialInstitutionSchema.optional(),
   LANGUAGE: z.string().default("ENG"),
   SESSCOOKIE: z.string().optional(),
   STATUS: statusSchema,
});

export type OFXSignOnResponse = z.infer<typeof signOnResponseSchema>;

const bankStatementTransactionResponseSchema = z.object({
   STATUS: statusSchema,
   STMTRS: bankStatementResponseSchema.optional(),
   TRNUID: z.string(),
});

export type OFXBankStatementTransactionResponse = z.infer<
   typeof bankStatementTransactionResponseSchema
>;

const creditCardStatementTransactionResponseSchema = z.object({
   CCSTMTRS: creditCardStatementResponseSchema.optional(),
   STATUS: statusSchema,
   TRNUID: z.string(),
});

export type OFXCreditCardStatementTransactionResponse = z.infer<
   typeof creditCardStatementTransactionResponseSchema
>;

const bankMessageSetResponseSchema = z.object({
   STMTTRNRS: z
      .union([
         bankStatementTransactionResponseSchema,
         z.array(bankStatementTransactionResponseSchema),
      ])
      .optional(),
});

export type OFXBankMessageSetResponse = z.infer<
   typeof bankMessageSetResponseSchema
>;

const creditCardMessageSetResponseSchema = z.object({
   CCSTMTTRNRS: z
      .union([
         creditCardStatementTransactionResponseSchema,
         z.array(creditCardStatementTransactionResponseSchema),
      ])
      .optional(),
});

export type OFXCreditCardMessageSetResponse = z.infer<
   typeof creditCardMessageSetResponseSchema
>;

const signOnMessageSetResponseSchema = z.object({
   SONRS: signOnResponseSchema,
});

export type OFXSignOnMessageSetResponse = z.infer<
   typeof signOnMessageSetResponseSchema
>;

const ofxResponseSchema = z.object({
   BANKMSGSRSV1: bankMessageSetResponseSchema.optional(),
   CREDITCARDMSGSRSV1: creditCardMessageSetResponseSchema.optional(),
   SIGNONMSGSRSV1: signOnMessageSetResponseSchema,
});

export type OFXResponse = z.infer<typeof ofxResponseSchema>;

const ofxHeaderSchema = z.object({
   CHARSET: z.string().optional(),
   COMPRESSION: z.string().optional(),
   DATA: z.string().optional(),
   ENCODING: z.string().optional(),
   NEWFILEUID: z.string().optional(),
   OFXHEADER: z.string().optional(),
   OLDFILEUID: z.string().optional(),
   SECURITY: z.string().optional(),
   VERSION: z.string().optional(),
});

export type OFXHeader = z.infer<typeof ofxHeaderSchema>;

const ofxDocumentSchema = z.object({
   header: ofxHeaderSchema,
   OFX: ofxResponseSchema,
});

export type OFXDocument = z.infer<typeof ofxDocumentSchema>;

export const schemas: {
   accountType: typeof accountTypeSchema;
   balance: typeof balanceSchema;
   bankAccount: typeof bankAccountSchema;
   bankMessageSetResponse: typeof bankMessageSetResponseSchema;
   bankStatementResponse: typeof bankStatementResponseSchema;
   bankStatementTransactionResponse: typeof bankStatementTransactionResponseSchema;
   creditCardAccount: typeof creditCardAccountSchema;
   creditCardMessageSetResponse: typeof creditCardMessageSetResponseSchema;
   creditCardStatementResponse: typeof creditCardStatementResponseSchema;
   creditCardStatementTransactionResponse: typeof creditCardStatementTransactionResponseSchema;
   financialInstitution: typeof financialInstitutionSchema;
   ofxDate: typeof ofxDateSchema;
   ofxDocument: typeof ofxDocumentSchema;
   ofxHeader: typeof ofxHeaderSchema;
   ofxResponse: typeof ofxResponseSchema;
   signOnMessageSetResponse: typeof signOnMessageSetResponseSchema;
   signOnResponse: typeof signOnResponseSchema;
   status: typeof statusSchema;
   transaction: typeof transactionSchema;
   transactionList: typeof transactionListSchema;
   transactionType: typeof transactionTypeSchema;
} = {
   accountType: accountTypeSchema,
   balance: balanceSchema,
   bankAccount: bankAccountSchema,
   bankMessageSetResponse: bankMessageSetResponseSchema,
   bankStatementResponse: bankStatementResponseSchema,
   bankStatementTransactionResponse: bankStatementTransactionResponseSchema,
   creditCardAccount: creditCardAccountSchema,
   creditCardMessageSetResponse: creditCardMessageSetResponseSchema,
   creditCardStatementResponse: creditCardStatementResponseSchema,
   creditCardStatementTransactionResponse:
      creditCardStatementTransactionResponseSchema,
   financialInstitution: financialInstitutionSchema,
   ofxDate: ofxDateSchema,
   ofxDocument: ofxDocumentSchema,
   ofxHeader: ofxHeaderSchema,
   ofxResponse: ofxResponseSchema,
   signOnMessageSetResponse: signOnMessageSetResponseSchema,
   signOnResponse: signOnResponseSchema,
   status: statusSchema,
   transaction: transactionSchema,
   transactionList: transactionListSchema,
   transactionType: transactionTypeSchema,
};

interface TagStackItem {
   name: string;
   content: Record<string, unknown>;
}

function parseHeader(content: string): { header: OFXHeader; body: string } {
   const lines = content.split(/\r?\n/);
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

   const body = lines.slice(bodyStartIndex).join("\n");
   return { body, header: ofxHeaderSchema.parse(header) };
}

function sgmlToObject(sgml: string): Record<string, unknown> {
   const result: Record<string, unknown> = {};
   const tagStack: TagStackItem[] = [{ content: result, name: "root" }];

   const cleanSgml = sgml
      .replace(/<\?.*?\?>/g, "")
      .replace(/<!--.*?-->/gs, "")
      .trim();

   const tagRegex = /<(\/?)([\w.]+)>([^<]*)/g;
   let match: RegExpExecArray | null = tagRegex.exec(cleanSgml);

   while (match !== null) {
      const isClosing = match[1];
      const tagName = match[2];
      const textContent = match[3]?.trim() ?? "";

      if (!tagName) continue;

      const current = tagStack[tagStack.length - 1];
      if (!current) continue;

      if (isClosing) {
         if (tagStack.length > 1) {
            tagStack.pop();
         }
      } else if (textContent) {
         const existing = current.content[tagName];
         if (existing !== undefined) {
            if (Array.isArray(existing)) {
               existing.push(textContent);
            } else {
               current.content[tagName] = [existing, textContent];
            }
         } else {
            current.content[tagName] = textContent;
         }
      } else {
         const newObj: Record<string, unknown> = {};
         const existing = current.content[tagName];

         if (existing !== undefined) {
            if (Array.isArray(existing)) {
               existing.push(newObj);
            } else {
               current.content[tagName] = [existing, newObj];
            }
         } else {
            current.content[tagName] = newObj;
         }

         tagStack.push({ content: newObj, name: tagName });
      }

      match = tagRegex.exec(cleanSgml);
   }

   return result;
}

function normalizeTransactions(
   data: Record<string, unknown>,
): Record<string, unknown> {
   function processObject(
      obj: Record<string, unknown>,
   ): Record<string, unknown> {
      const processed: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
         if (key === "STMTTRN") {
            processed[key] = Array.isArray(value)
               ? value.map((v) =>
                    typeof v === "object" && v !== null
                       ? processObject(v as Record<string, unknown>)
                       : v,
                 )
               : [
                    typeof value === "object" && value !== null
                       ? processObject(value as Record<string, unknown>)
                       : value,
                 ];
         } else if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
         ) {
            processed[key] = processObject(value as Record<string, unknown>);
         } else {
            processed[key] = value;
         }
      }

      return processed;
   }

   return processObject(data);
}

export type ParseResult<T> =
   | { success: true; data: T }
   | { success: false; error: z.ZodError };

export function parse(content: string): ParseResult<OFXDocument> {
   try {
      const { header, body } = parseHeader(content);
      const rawData = sgmlToObject(body);
      const normalizedData = normalizeTransactions(rawData);

      const parseResult = ofxResponseSchema.safeParse(normalizedData.OFX);

      if (!parseResult.success) {
         return { error: parseResult.error, success: false };
      }

      return {
         data: {
            header,
            OFX: parseResult.data,
         },
         success: true,
      };
   } catch (err) {
      if (err instanceof z.ZodError) {
         return { error: err, success: false };
      }
      throw err;
   }
}

export function parseOrThrow(content: string): OFXDocument {
   const result = parse(content);
   if (!result.success) {
      throw result.error;
   }
   return result.data;
}

export function getTransactions(document: OFXDocument): OFXTransaction[] {
   const transactions: OFXTransaction[] = [];

   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (bankResponse) {
      const responses = Array.isArray(bankResponse)
         ? bankResponse
         : [bankResponse];
      for (const response of responses) {
         if (response.STMTRS?.BANKTRANLIST?.STMTTRN) {
            transactions.push(...response.STMTRS.BANKTRANLIST.STMTTRN);
         }
      }
   }

   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (ccResponse) {
      const responses = Array.isArray(ccResponse) ? ccResponse : [ccResponse];
      for (const response of responses) {
         if (response.CCSTMTRS?.BANKTRANLIST?.STMTTRN) {
            transactions.push(...response.CCSTMTRS.BANKTRANLIST.STMTTRN);
         }
      }
   }

   return transactions;
}

export function getAccountInfo(
   document: OFXDocument,
): (OFXBankAccount | OFXCreditCardAccount)[] {
   const accounts: (OFXBankAccount | OFXCreditCardAccount)[] = [];

   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (bankResponse) {
      const responses = Array.isArray(bankResponse)
         ? bankResponse
         : [bankResponse];
      for (const response of responses) {
         if (response.STMTRS?.BANKACCTFROM) {
            accounts.push(response.STMTRS.BANKACCTFROM);
         }
      }
   }

   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (ccResponse) {
      const responses = Array.isArray(ccResponse) ? ccResponse : [ccResponse];
      for (const response of responses) {
         if (response.CCSTMTRS?.CCACCTFROM) {
            accounts.push(response.CCSTMTRS.CCACCTFROM);
         }
      }
   }

   return accounts;
}

export interface BalanceInfo {
   ledger?: OFXBalance;
   available?: OFXBalance;
}

export function getBalance(document: OFXDocument): BalanceInfo[] {
   const balances: BalanceInfo[] = [];

   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (bankResponse) {
      const responses = Array.isArray(bankResponse)
         ? bankResponse
         : [bankResponse];
      for (const response of responses) {
         if (response.STMTRS) {
            balances.push({
               available: response.STMTRS.AVAILBAL,
               ledger: response.STMTRS.LEDGERBAL,
            });
         }
      }
   }

   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (ccResponse) {
      const responses = Array.isArray(ccResponse) ? ccResponse : [ccResponse];
      for (const response of responses) {
         if (response.CCSTMTRS) {
            balances.push({
               available: response.CCSTMTRS.AVAILBAL,
               ledger: response.CCSTMTRS.LEDGERBAL,
            });
         }
      }
   }

   return balances;
}

export function getSignOnInfo(document: OFXDocument): OFXSignOnResponse {
   return document.OFX.SIGNONMSGSRSV1.SONRS;
}
