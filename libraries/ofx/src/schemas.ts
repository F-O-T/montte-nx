import { z } from "zod";

const toFloat = (val: string): number => Number.parseFloat(val);

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

const dateComponentsSchema = z.object({
   year: z.number(),
   month: z.number(),
   day: z.number(),
   hour: z.number(),
   minute: z.number(),
   second: z.number(),
});

type DateComponents = z.infer<typeof dateComponentsSchema>;

const DATE_REGEX = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/;
const TIMEZONE_REGEX = /\[([+-]?\d+):(\w+)\]/;

// Exported for testing purposes only - not part of public API
export function parseDateComponents(val: string): DateComponents {
   const m = DATE_REGEX.exec(val);
   if (!m) return { day: 0, hour: 0, minute: 0, month: 0, second: 0, year: 0 };
   return {
      day: +(m[3] as string),
      hour: +(m[4] || 0),
      minute: +(m[5] || 0),
      month: +(m[2] as string),
      second: +(m[6] || 0),
      year: +(m[1] as string),
   };
}

// Exported for testing purposes only - not part of public API
export function parseTimezone(val: string): { offset: number; name: string } {
   const match = TIMEZONE_REGEX.exec(val);
   return {
      name: match?.[2] ?? "UTC",
      offset: match ? +(match[1] as string) : 0,
   };
}

export const ofxDateSchema = z.string().transform((val): OFXDateValue => {
   const components = parseDateComponents(val);
   const timezone = parseTimezone(val);

   return {
      ...components,
      raw: val,
      timezone,
      toDate(): Date {
         const offsetMs = timezone.offset * 60 * 60 * 1000;
         return new Date(
            Date.UTC(
               components.year,
               components.month - 1,
               components.day,
               components.hour,
               components.minute,
               components.second,
            ) - offsetMs,
         );
      },
   };
});

export type OFXDate = z.infer<typeof ofxDateSchema>;

export const statusSchema = z.object({
   CODE: z.string(),
   MESSAGE: z.string().optional(),
   SEVERITY: z.enum(["INFO", "WARN", "ERROR"]),
});

export type OFXStatus = z.infer<typeof statusSchema>;

export const financialInstitutionSchema = z.object({
   FID: z.string().optional(),
   ORG: z.string().optional(),
});

export type OFXFinancialInstitution = z.infer<
   typeof financialInstitutionSchema
>;

export const transactionTypeSchema = z.enum([
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

export const transactionSchema = z.object({
   CHECKNUM: z.string().optional(),
   CORRECTACTION: z.enum(["DELETE", "REPLACE"]).optional(),
   CORRECTFITID: z.string().optional(),
   CURRENCY: z.string().optional(),
   DTAVAIL: ofxDateSchema.optional(),
   DTPOSTED: ofxDateSchema,
   DTUSER: ofxDateSchema.optional(),
   FITID: z.string().optional(),
   MEMO: z.string().optional(),
   NAME: z.string().optional(),
   PAYEEID: z.string().optional(),
   REFNUM: z.string().optional(),
   SIC: z.string().optional(),
   SRVRTID: z.string().optional(),
   TRNAMT: z.string().transform(toFloat),
   TRNTYPE: transactionTypeSchema,
});

export type OFXTransaction = z.infer<typeof transactionSchema>;

export const accountTypeSchema = z.enum([
   "CHECKING",
   "SAVINGS",
   "MONEYMRKT",
   "CREDITLINE",
   "CD",
]);

export type OFXAccountType = z.infer<typeof accountTypeSchema>;

// Extended account type schema that includes CREDITCARD
// Some OFX files (especially from certain banks) include credit card accounts
// in the BANKACCTFROM tag instead of CCACCTFROM, requiring this extended schema
const extendedAccountTypeSchema = z.enum([
   "CHECKING",
   "SAVINGS",
   "MONEYMRKT",
   "CREDITLINE",
   "CD",
   "CREDITCARD",
]);

export const bankAccountSchema = z.object({
   ACCTID: z.string(),
   ACCTKEY: z.string().optional(),
   ACCTTYPE: accountTypeSchema,
   BANKID: z.string(),
   BRANCHID: z.string().optional(),
});

export type OFXBankAccount = z.infer<typeof bankAccountSchema>;

// Flexible bank account schema used for credit card statements
// that may include account info in BANKACCTFROM instead of CCACCTFROM
const flexibleBankAccountSchema = z.object({
   ACCTID: z.string(),
   ACCTKEY: z.string().optional(),
   ACCTTYPE: extendedAccountTypeSchema.optional(),
   BANKID: z.string().optional(),
   BRANCHID: z.string().optional(),
});

export const creditCardAccountSchema = z.object({
   ACCTID: z.string(),
   ACCTKEY: z.string().optional(),
});

export type OFXCreditCardAccount = z.infer<typeof creditCardAccountSchema>;

export const balanceSchema = z.object({
   BALAMT: z.string().transform(toFloat),
   DTASOF: ofxDateSchema,
});

export type OFXBalance = z.infer<typeof balanceSchema>;

export const transactionListSchema = z.object({
   DTEND: ofxDateSchema,
   DTSTART: ofxDateSchema,
   STMTTRN: z.array(transactionSchema).default([]),
});

export type OFXTransactionList = z.infer<typeof transactionListSchema>;

export const bankStatementResponseSchema = z.object({
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

export const creditCardStatementResponseSchema = z
   .object({
      AVAILBAL: balanceSchema.optional(),
      BANKACCTFROM: flexibleBankAccountSchema.optional(),
      BANKTRANLIST: transactionListSchema.optional(),
      CCACCTFROM: creditCardAccountSchema.optional(),
      CURDEF: z.string().default("USD"),
      LEDGERBAL: balanceSchema.optional(),
      MKTGINFO: z.string().optional(),
   })
   .refine((data) => data.CCACCTFROM || data.BANKACCTFROM, {
      message: "Either CCACCTFROM or BANKACCTFROM is required",
   });

export type OFXCreditCardStatementResponse = z.infer<
   typeof creditCardStatementResponseSchema
>;

export const signOnResponseSchema = z.object({
   ACCESSKEY: z.string().optional(),
   DTSERVER: ofxDateSchema,
   FI: financialInstitutionSchema.optional(),
   LANGUAGE: z.string().default("ENG"),
   SESSCOOKIE: z.string().optional(),
   STATUS: statusSchema,
});

export type OFXSignOnResponse = z.infer<typeof signOnResponseSchema>;

export const bankStatementTransactionResponseSchema = z.object({
   STATUS: statusSchema.optional(),
   STMTRS: bankStatementResponseSchema.optional(),
   TRNUID: z.string().optional(),
});

export type OFXBankStatementTransactionResponse = z.infer<
   typeof bankStatementTransactionResponseSchema
>;

export const creditCardStatementTransactionResponseSchema = z.object({
   CCSTMTRS: creditCardStatementResponseSchema.optional(),
   STATUS: statusSchema.optional(),
   TRNUID: z.string().optional(),
});

export type OFXCreditCardStatementTransactionResponse = z.infer<
   typeof creditCardStatementTransactionResponseSchema
>;

const singleOrArray = <T extends z.ZodTypeAny>(schema: T) =>
   z.union([schema, z.array(schema)]).optional();

export const bankMessageSetResponseSchema = z.object({
   STMTTRNRS: singleOrArray(bankStatementTransactionResponseSchema),
});

export type OFXBankMessageSetResponse = z.infer<
   typeof bankMessageSetResponseSchema
>;

export const creditCardMessageSetResponseSchema = z.object({
   CCSTMTTRNRS: singleOrArray(creditCardStatementTransactionResponseSchema),
});

export type OFXCreditCardMessageSetResponse = z.infer<
   typeof creditCardMessageSetResponseSchema
>;

export const signOnMessageSetResponseSchema = z.object({
   SONRS: signOnResponseSchema,
});

export type OFXSignOnMessageSetResponse = z.infer<
   typeof signOnMessageSetResponseSchema
>;

export const ofxResponseSchema = z.object({
   BANKMSGSRSV1: bankMessageSetResponseSchema.optional(),
   CREDITCARDMSGSRSV1: creditCardMessageSetResponseSchema.optional(),
   SIGNONMSGSRSV1: signOnMessageSetResponseSchema,
});

export type OFXResponse = z.infer<typeof ofxResponseSchema>;

export const ofxHeaderSchema = z.object({
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

export const ofxDocumentSchema = z.object({
   header: ofxHeaderSchema,
   OFX: ofxResponseSchema,
});

export type OFXDocument = z.infer<typeof ofxDocumentSchema>;
