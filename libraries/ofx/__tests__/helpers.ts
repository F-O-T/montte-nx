import type { OFXAccountType, OFXTransactionType } from "../src/schemas";

export interface TransactionOverrides {
   type?: OFXTransactionType;
   datePosted?: string;
   amount?: string;
   fitId?: string;
   name?: string;
   memo?: string;
   checkNum?: string;
   refNum?: string;
}

export interface HeaderOverrides {
   version?: string;
   encoding?: string;
   charset?: string;
}

export interface BankStatementOverrides {
   bankId?: string;
   accountId?: string;
   accountType?: OFXAccountType;
   currency?: string;
   startDate?: string;
   endDate?: string;
   serverDate?: string;
   language?: string;
   fiOrg?: string;
   fiFid?: string;
   ledgerBalance?: { amount: string; date: string };
   availBalance?: { amount: string; date: string };
   transactions?: TransactionOverrides[];
}

export interface CreditCardStatementOverrides {
   accountId?: string;
   currency?: string;
   startDate?: string;
   endDate?: string;
   serverDate?: string;
   language?: string;
   fiOrg?: string;
   fiFid?: string;
   ledgerBalance?: { amount: string; date: string };
   availBalance?: { amount: string; date: string };
   transactions?: TransactionOverrides[];
}

export function createOfxHeader(overrides: HeaderOverrides = {}): string {
   const version = overrides.version ?? "100";
   const encoding = overrides.encoding ?? "USASCII";
   const charset = overrides.charset ?? "1252";

   return `OFXHEADER:100
DATA:OFXSGML
VERSION:${version}
SECURITY:NONE
ENCODING:${encoding}
CHARSET:${charset}
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
`;
}

export function createTransaction(
   overrides: TransactionOverrides = {},
): string {
   const type = overrides.type ?? "DEBIT";
   const datePosted = overrides.datePosted ?? "20231215120000[-3:BRT]";
   const amount = overrides.amount ?? "-100.00";
   const fitId = overrides.fitId ?? "TXN001";

   const lines: string[] = [
      "<STMTTRN>",
      `<TRNTYPE>${type}`,
      `<DTPOSTED>${datePosted}`,
      `<TRNAMT>${amount}`,
      `<FITID>${fitId}`,
   ];

   if (overrides.name) lines.push(`<NAME>${overrides.name}`);
   if (overrides.memo) lines.push(`<MEMO>${overrides.memo}`);
   if (overrides.checkNum) lines.push(`<CHECKNUM>${overrides.checkNum}`);
   if (overrides.refNum) lines.push(`<REFNUM>${overrides.refNum}`);

   lines.push("</STMTTRN>");
   return lines.join("\n");
}

export function createBankStatement(
   overrides: BankStatementOverrides = {},
): string {
   const bankId = overrides.bankId ?? "BANK001";
   const accountId = overrides.accountId ?? "123456789";
   const accountType = overrides.accountType ?? "CHECKING";
   const currency = overrides.currency ?? "BRL";
   const startDate = overrides.startDate ?? "20231201000000[-3:BRT]";
   const endDate = overrides.endDate ?? "20231231235959[-3:BRT]";
   const serverDate = overrides.serverDate ?? "20231215120000[-3:BRT]";
   const language = overrides.language ?? "POR";

   let fiContent = "";
   if (overrides.fiOrg || overrides.fiFid) {
      fiContent = "<FI>\n";
      if (overrides.fiOrg) fiContent += `<ORG>${overrides.fiOrg}\n`;
      if (overrides.fiFid) fiContent += `<FID>${overrides.fiFid}\n`;
      fiContent += "</FI>\n";
   }

   let ledgerBalContent = "";
   if (overrides.ledgerBalance) {
      ledgerBalContent = `<LEDGERBAL>
<BALAMT>${overrides.ledgerBalance.amount}
<DTASOF>${overrides.ledgerBalance.date}
</LEDGERBAL>
`;
   }

   let availBalContent = "";
   if (overrides.availBalance) {
      availBalContent = `<AVAILBAL>
<BALAMT>${overrides.availBalance.amount}
<DTASOF>${overrides.availBalance.date}
</AVAILBAL>
`;
   }

   const transactions = overrides.transactions ?? [];
   const transactionsContent = transactions
      .map((t) => createTransaction(t))
      .join("\n");

   const header = createOfxHeader();

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
<CURDEF>${currency}
<BANKACCTFROM>
<BANKID>${bankId}
<ACCTID>${accountId}
<ACCTTYPE>${accountType}
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${startDate}
<DTEND>${endDate}
${transactionsContent}
</BANKTRANLIST>
${ledgerBalContent}${availBalContent}</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
}

export function createCreditCardStatement(
   overrides: CreditCardStatementOverrides = {},
): string {
   const accountId = overrides.accountId ?? "4111111111111111";
   const currency = overrides.currency ?? "BRL";
   const startDate = overrides.startDate ?? "20231201000000[-3:BRT]";
   const endDate = overrides.endDate ?? "20231231235959[-3:BRT]";
   const serverDate = overrides.serverDate ?? "20231215120000[-3:BRT]";
   const language = overrides.language ?? "POR";

   let fiContent = "";
   if (overrides.fiOrg || overrides.fiFid) {
      fiContent = "<FI>\n";
      if (overrides.fiOrg) fiContent += `<ORG>${overrides.fiOrg}\n`;
      if (overrides.fiFid) fiContent += `<FID>${overrides.fiFid}\n`;
      fiContent += "</FI>\n";
   }

   let ledgerBalContent = "";
   if (overrides.ledgerBalance) {
      ledgerBalContent = `<LEDGERBAL>
<BALAMT>${overrides.ledgerBalance.amount}
<DTASOF>${overrides.ledgerBalance.date}
</LEDGERBAL>
`;
   }

   let availBalContent = "";
   if (overrides.availBalance) {
      availBalContent = `<AVAILBAL>
<BALAMT>${overrides.availBalance.amount}
<DTASOF>${overrides.availBalance.date}
</AVAILBAL>
`;
   }

   const transactions = overrides.transactions ?? [];
   const transactionsContent = transactions
      .map((t) => createTransaction(t))
      .join("\n");

   const header = createOfxHeader();

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
<CURDEF>${currency}
<CCACCTFROM>
<ACCTID>${accountId}
</CCACCTFROM>
<BANKTRANLIST>
<DTSTART>${startDate}
<DTEND>${endDate}
${transactionsContent}
</BANKTRANLIST>
${ledgerBalContent}${availBalContent}</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>`;
}

export function createMinimalBankOfx(): string {
   return createBankStatement({
      transactions: [{ amount: "-50.00", fitId: "TXN001", type: "DEBIT" }],
   });
}

export function createMinimalCreditCardOfx(): string {
   return createCreditCardStatement({
      transactions: [{ amount: "-75.00", fitId: "CC001", type: "DEBIT" }],
   });
}

export function createOfxWithMultipleTransactions(count: number): string {
   const transactions: TransactionOverrides[] = [];
   for (let i = 0; i < count; i++) {
      transactions.push({
         amount: `${(i % 2 === 0 ? -1 : 1) * (100 + i * 10)}.00`,
         fitId: `TXN${String(i + 1).padStart(3, "0")}`,
         name: `Transaction ${i + 1}`,
         type: i % 2 === 0 ? "DEBIT" : "CREDIT",
      });
   }
   return createBankStatement({ transactions });
}

export function createOfxWithAllTransactionTypes(): string {
   const types: OFXTransactionType[] = [
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
   ];

   const transactions: TransactionOverrides[] = types.map((type, i) => ({
      amount: i % 2 === 0 ? "-100.00" : "100.00",
      fitId: `TXN_${type}`,
      name: `${type} Transaction`,
      type,
   }));

   return createBankStatement({ transactions });
}

export function createOfxDate(
   year: number,
   month: number,
   day: number,
   hour = 0,
   minute = 0,
   second = 0,
   offset = 0,
   tzName = "GMT",
): string {
   const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
   const sign = offset >= 0 ? "+" : "";
   return `${year}${pad(month)}${pad(day)}${pad(hour)}${pad(minute)}${pad(second)}[${sign}${offset}:${tzName}]`;
}

export function createSimpleOfxDate(
   date: Date,
   offset = 0,
   tzName = "GMT",
): string {
   return createOfxDate(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      offset,
      tzName,
   );
}

export function createInvalidOfx(): string {
   return "This is not valid OFX content";
}

export function createMalformedOfx(): string {
   return `${createOfxHeader()}<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
</STATUS>
</SONRS>
</SIGNONMSGSRSV1>
</OFX>`;
}

export function createEmptyHeaderOfx(): string {
   return `<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20231215120000[-3:BRT]
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
</OFX>`;
}
