import { z } from "zod";

const toInt = (val: string): number => Number.parseInt(val, 10);
const toFloat = (val: string): number => Number.parseFloat(val);
const toArray = <T>(value: T | T[]): T[] =>
   Array.isArray(value) ? value : [value];

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

interface DateComponents {
   year: number;
   month: number;
   day: number;
   hour: number;
   minute: number;
   second: number;
}

function parseDateComponents(val: string): DateComponents {
   return {
      day: toInt(val.substring(6, 8)),
      hour: toInt(val.substring(8, 10) || "0"),
      minute: toInt(val.substring(10, 12) || "0"),
      month: toInt(val.substring(4, 6)),
      second: toInt(val.substring(12, 14) || "0"),
      year: toInt(val.substring(0, 4)),
   };
}

function parseTimezone(val: string): { offset: number; name: string } {
   const match = val.match(/\[([+-]?\d+):(\w+)\]/);
   return {
      name: match?.[2] ?? "UTC",
      offset: match ? toInt(match[1] ?? "0") : 0,
   };
}

const ofxDateSchema = z.string().transform((val): OFXDateValue => {
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
   TRNAMT: z.string().transform(toFloat),
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
   BALAMT: z.string().transform(toFloat),
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

const singleOrArray = <T extends z.ZodTypeAny>(schema: T) =>
   z.union([schema, z.array(schema)]).optional();

const bankMessageSetResponseSchema = z.object({
   STMTTRNRS: singleOrArray(bankStatementTransactionResponseSchema),
});

export type OFXBankMessageSetResponse = z.infer<
   typeof bankMessageSetResponseSchema
>;

const creditCardMessageSetResponseSchema = z.object({
   CCSTMTTRNRS: singleOrArray(creditCardStatementTransactionResponseSchema),
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

export const schemas = {
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
} as const;

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

function addToContent(
   content: Record<string, unknown>,
   key: string,
   value: unknown,
): void {
   const existing = content[key];
   if (existing !== undefined) {
      if (Array.isArray(existing)) {
         existing.push(value);
      } else {
         content[key] = [existing, value];
      }
   } else {
      content[key] = value;
   }
}

function sgmlToObject(sgml: string): Record<string, unknown> {
   const result: Record<string, unknown> = {};
   const tagStack: TagStackItem[] = [{ content: result, name: "root" }];
   const stackMap = new Map<string, number>([["root", 0]]);

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

      if (!tagName) {
         match = tagRegex.exec(cleanSgml);
         continue;
      }

      const current = tagStack[tagStack.length - 1];
      if (!current) {
         match = tagRegex.exec(cleanSgml);
         continue;
      }

      if (isClosing) {
         const stackIndex = stackMap.get(tagName);
         if (stackIndex !== undefined && stackIndex > 0) {
            for (let i = tagStack.length - 1; i >= stackIndex; i--) {
               const item = tagStack[i];
               if (item) stackMap.delete(item.name);
            }
            tagStack.length = stackIndex;
         }
      } else if (textContent) {
         addToContent(current.content, tagName, textContent);
      } else {
         const newObj: Record<string, unknown> = {};
         addToContent(current.content, tagName, newObj);
         stackMap.set(tagName, tagStack.length);
         tagStack.push({ content: newObj, name: tagName });
      }

      match = tagRegex.exec(cleanSgml);
   }

   return result;
}

function processObject(obj: Record<string, unknown>): Record<string, unknown> {
   const processed: Record<string, unknown> = {};

   for (const [key, value] of Object.entries(obj)) {
      if (key === "STMTTRN") {
         processed[key] = toArray(value).map((v) =>
            typeof v === "object" && v !== null
               ? processObject(v as Record<string, unknown>)
               : v,
         );
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
         processed[key] = processObject(value as Record<string, unknown>);
      } else {
         processed[key] = value;
      }
   }

   return processed;
}

function normalizeTransactions(
   data: Record<string, unknown>,
): Record<string, unknown> {
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
         data: { header, OFX: parseResult.data },
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

function extractFromBankResponses<TResult>(
   document: OFXDocument,
   extractor: (r: OFXBankStatementTransactionResponse) => TResult | undefined,
): TResult[] {
   const bankResponse = document.OFX.BANKMSGSRSV1?.STMTTRNRS;
   if (!bankResponse) return [];

   const results: TResult[] = [];
   for (const response of toArray(bankResponse)) {
      const result = extractor(response);
      if (result !== undefined) {
         results.push(result);
      }
   }
   return results;
}

function extractFromCreditCardResponses<TResult>(
   document: OFXDocument,
   extractor: (
      r: OFXCreditCardStatementTransactionResponse,
   ) => TResult | undefined,
): TResult[] {
   const ccResponse = document.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS;
   if (!ccResponse) return [];

   const results: TResult[] = [];
   for (const response of toArray(ccResponse)) {
      const result = extractor(response);
      if (result !== undefined) {
         results.push(result);
      }
   }
   return results;
}

export function getTransactions(document: OFXDocument): OFXTransaction[] {
   const bankTransactions = extractFromBankResponses(
      document,
      (r) => r.STMTRS?.BANKTRANLIST?.STMTTRN,
   );
   const ccTransactions = extractFromCreditCardResponses(
      document,
      (r) => r.CCSTMTRS?.BANKTRANLIST?.STMTTRN,
   );

   return [...bankTransactions, ...ccTransactions].flat();
}

export function getAccountInfo(
   document: OFXDocument,
): (OFXBankAccount | OFXCreditCardAccount)[] {
   const bankAccounts = extractFromBankResponses(
      document,
      (r) => r.STMTRS?.BANKACCTFROM,
   );
   const ccAccounts = extractFromCreditCardResponses(
      document,
      (r) => r.CCSTMTRS?.CCACCTFROM,
   );

   return [...bankAccounts, ...ccAccounts];
}

export interface BalanceInfo {
   ledger?: OFXBalance;
   available?: OFXBalance;
}

export function getBalance(document: OFXDocument): BalanceInfo[] {
   const bankBalances = extractFromBankResponses(document, (r) =>
      r.STMTRS
         ? { available: r.STMTRS.AVAILBAL, ledger: r.STMTRS.LEDGERBAL }
         : undefined,
   );
   const ccBalances = extractFromCreditCardResponses(document, (r) =>
      r.CCSTMTRS
         ? { available: r.CCSTMTRS.AVAILBAL, ledger: r.CCSTMTRS.LEDGERBAL }
         : undefined,
   );

   return [...bankBalances, ...ccBalances];
}

export function getSignOnInfo(document: OFXDocument): OFXSignOnResponse {
   return document.OFX.SIGNONMSGSRSV1.SONRS;
}

const pad = (n: number, width = 2): string => n.toString().padStart(width, "0");

export function formatOfxDate(
   date: Date,
   timezone?: { offset: number; name: string },
): string {
   const tz = timezone ?? { name: "GMT", offset: 0 };
   const offsetMs = tz.offset * 60 * 60 * 1000;
   const adjustedDate = new Date(date.getTime() + offsetMs);

   const year = adjustedDate.getUTCFullYear();
   const month = pad(adjustedDate.getUTCMonth() + 1);
   const day = pad(adjustedDate.getUTCDate());
   const hour = pad(adjustedDate.getUTCHours());
   const minute = pad(adjustedDate.getUTCMinutes());
   const second = pad(adjustedDate.getUTCSeconds());

   const sign = tz.offset >= 0 ? "+" : "";
   return `${year}${month}${day}${hour}${minute}${second}[${sign}${tz.offset}:${tz.name}]`;
}

function escapeOfxText(text: string): string {
   return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
}

function formatAmount(amount: number): string {
   return amount.toFixed(2);
}

export interface GenerateHeaderOptions {
   version?: string;
   encoding?: string;
   charset?: string;
}

export function generateHeader(options?: GenerateHeaderOptions): string {
   const version = options?.version ?? "100";
   const encoding = options?.encoding ?? "USASCII";
   const charset = options?.charset ?? "1252";

   return [
      "OFXHEADER:100",
      "DATA:OFXSGML",
      `VERSION:${version}`,
      "SECURITY:NONE",
      `ENCODING:${encoding}`,
      `CHARSET:${charset}`,
      "COMPRESSION:NONE",
      "OLDFILEUID:NONE",
      "NEWFILEUID:NONE",
      "",
   ].join("\n");
}

export interface GenerateTransactionInput {
   type: OFXTransactionType;
   datePosted: Date;
   amount: number;
   fitId: string;
   name?: string;
   memo?: string;
   checkNum?: string;
   refNum?: string;
}

function generateTransaction(trn: GenerateTransactionInput): string {
   const lines: string[] = [
      "<STMTTRN>",
      `<TRNTYPE>${trn.type}`,
      `<DTPOSTED>${formatOfxDate(trn.datePosted)}`,
      `<TRNAMT>${formatAmount(trn.amount)}`,
      `<FITID>${escapeOfxText(trn.fitId)}`,
   ];

   if (trn.name) {
      lines.push(`<NAME>${escapeOfxText(trn.name)}`);
   }
   if (trn.memo) {
      lines.push(`<MEMO>${escapeOfxText(trn.memo)}`);
   }
   if (trn.checkNum) {
      lines.push(`<CHECKNUM>${escapeOfxText(trn.checkNum)}`);
   }
   if (trn.refNum) {
      lines.push(`<REFNUM>${escapeOfxText(trn.refNum)}`);
   }

   lines.push("</STMTTRN>");
   return lines.join("\n");
}

export interface GenerateBankStatementOptions {
   bankId: string;
   accountId: string;
   accountType: OFXAccountType;
   currency: string;
   startDate: Date;
   endDate: Date;
   transactions: GenerateTransactionInput[];
   ledgerBalance?: { amount: number; asOfDate: Date };
   availableBalance?: { amount: number; asOfDate: Date };
   financialInstitution?: { org?: string; fid?: string };
   language?: string;
}

export function generateBankStatement(
   options: GenerateBankStatementOptions,
): string {
   const header = generateHeader();
   const serverDate = formatOfxDate(new Date());
   const language = options.language ?? "POR";

   const transactionsContent = options.transactions
      .map((trn) => generateTransaction(trn))
      .join("\n");

   let fiContent = "";
   if (options.financialInstitution) {
      fiContent = "<FI>\n";
      if (options.financialInstitution.org) {
         fiContent += `<ORG>${escapeOfxText(options.financialInstitution.org)}\n`;
      }
      if (options.financialInstitution.fid) {
         fiContent += `<FID>${escapeOfxText(options.financialInstitution.fid)}\n`;
      }
      fiContent += "</FI>\n";
   }

   let ledgerBalContent = "";
   if (options.ledgerBalance) {
      ledgerBalContent = `<LEDGERBAL>
<BALAMT>${formatAmount(options.ledgerBalance.amount)}
<DTASOF>${formatOfxDate(options.ledgerBalance.asOfDate)}
</LEDGERBAL>
`;
   }

   let availBalContent = "";
   if (options.availableBalance) {
      availBalContent = `<AVAILBAL>
<BALAMT>${formatAmount(options.availableBalance.amount)}
<DTASOF>${formatOfxDate(options.availableBalance.asOfDate)}
</AVAILBAL>
`;
   }

   return `${header}<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${serverDate}
<LANGUAGE>${language}
${fiContent}</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>0
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>${options.currency}
<BANKACCTFROM>
<BANKID>${escapeOfxText(options.bankId)}
<ACCTID>${escapeOfxText(options.accountId)}
<ACCTTYPE>${options.accountType}
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${formatOfxDate(options.startDate)}
<DTEND>${formatOfxDate(options.endDate)}
${transactionsContent}
</BANKTRANLIST>
${ledgerBalContent}${availBalContent}</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
}

export interface GenerateCreditCardStatementOptions {
   accountId: string;
   currency: string;
   startDate: Date;
   endDate: Date;
   transactions: GenerateTransactionInput[];
   ledgerBalance?: { amount: number; asOfDate: Date };
   availableBalance?: { amount: number; asOfDate: Date };
   financialInstitution?: { org?: string; fid?: string };
   language?: string;
}

export function generateCreditCardStatement(
   options: GenerateCreditCardStatementOptions,
): string {
   const header = generateHeader();
   const serverDate = formatOfxDate(new Date());
   const language = options.language ?? "POR";

   const transactionsContent = options.transactions
      .map((trn) => generateTransaction(trn))
      .join("\n");

   let fiContent = "";
   if (options.financialInstitution) {
      fiContent = "<FI>\n";
      if (options.financialInstitution.org) {
         fiContent += `<ORG>${escapeOfxText(options.financialInstitution.org)}\n`;
      }
      if (options.financialInstitution.fid) {
         fiContent += `<FID>${escapeOfxText(options.financialInstitution.fid)}\n`;
      }
      fiContent += "</FI>\n";
   }

   let ledgerBalContent = "";
   if (options.ledgerBalance) {
      ledgerBalContent = `<LEDGERBAL>
<BALAMT>${formatAmount(options.ledgerBalance.amount)}
<DTASOF>${formatOfxDate(options.ledgerBalance.asOfDate)}
</LEDGERBAL>
`;
   }

   let availBalContent = "";
   if (options.availableBalance) {
      availBalContent = `<AVAILBAL>
<BALAMT>${formatAmount(options.availableBalance.amount)}
<DTASOF>${formatOfxDate(options.availableBalance.asOfDate)}
</AVAILBAL>
`;
   }

   return `${header}<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${serverDate}
<LANGUAGE>${language}
${fiContent}</SONRS>
</SIGNONMSGSRSV1>
<CREDITCARDMSGSRSV1>
<CCSTMTTRNRS>
<TRNUID>0
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<CCSTMTRS>
<CURDEF>${options.currency}
<CCACCTFROM>
<ACCTID>${escapeOfxText(options.accountId)}
</CCACCTFROM>
<BANKTRANLIST>
<DTSTART>${formatOfxDate(options.startDate)}
<DTEND>${formatOfxDate(options.endDate)}
${transactionsContent}
</BANKTRANLIST>
${ledgerBalContent}${availBalContent}</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>`;
}
