import type { OFXAccountType, OFXTransactionType } from "./schemas";
import { escapeOfxText, formatAmount, formatOfxDate } from "./utils";

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
   const parts: string[] = [generateHeader()];
   const serverDate = formatOfxDate(new Date());
   const language = options.language ?? "POR";

   parts.push(`<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${serverDate}
<LANGUAGE>${language}`);

   if (options.financialInstitution) {
      parts.push("<FI>");
      if (options.financialInstitution.org) {
         parts.push(`<ORG>${escapeOfxText(options.financialInstitution.org)}`);
      }
      if (options.financialInstitution.fid) {
         parts.push(`<FID>${escapeOfxText(options.financialInstitution.fid)}`);
      }
      parts.push("</FI>");
   }

   parts.push(`</SONRS>
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
<DTEND>${formatOfxDate(options.endDate)}`);

   for (const trn of options.transactions) {
      parts.push(generateTransaction(trn));
   }

   parts.push("</BANKTRANLIST>");

   if (options.ledgerBalance) {
      parts.push(`<LEDGERBAL>
<BALAMT>${formatAmount(options.ledgerBalance.amount)}
<DTASOF>${formatOfxDate(options.ledgerBalance.asOfDate)}
</LEDGERBAL>`);
   }

   if (options.availableBalance) {
      parts.push(`<AVAILBAL>
<BALAMT>${formatAmount(options.availableBalance.amount)}
<DTASOF>${formatOfxDate(options.availableBalance.asOfDate)}
</AVAILBAL>`);
   }

   parts.push(`</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`);

   return parts.join("\n");
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
   const parts: string[] = [generateHeader()];
   const serverDate = formatOfxDate(new Date());
   const language = options.language ?? "POR";

   parts.push(`<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${serverDate}
<LANGUAGE>${language}`);

   if (options.financialInstitution) {
      parts.push("<FI>");
      if (options.financialInstitution.org) {
         parts.push(`<ORG>${escapeOfxText(options.financialInstitution.org)}`);
      }
      if (options.financialInstitution.fid) {
         parts.push(`<FID>${escapeOfxText(options.financialInstitution.fid)}`);
      }
      parts.push("</FI>");
   }

   parts.push(`</SONRS>
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
<DTEND>${formatOfxDate(options.endDate)}`);

   for (const trn of options.transactions) {
      parts.push(generateTransaction(trn));
   }

   parts.push("</BANKTRANLIST>");

   if (options.ledgerBalance) {
      parts.push(`<LEDGERBAL>
<BALAMT>${formatAmount(options.ledgerBalance.amount)}
<DTASOF>${formatOfxDate(options.ledgerBalance.asOfDate)}
</LEDGERBAL>`);
   }

   if (options.availableBalance) {
      parts.push(`<AVAILBAL>
<BALAMT>${formatAmount(options.availableBalance.amount)}
<DTASOF>${formatOfxDate(options.availableBalance.asOfDate)}
</AVAILBAL>`);
   }

   parts.push(`</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>`);

   return parts.join("\n");
}
