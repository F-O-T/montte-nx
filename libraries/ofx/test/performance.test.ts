import { expect, setDefaultTimeout, test } from "bun:test";

setDefaultTimeout(120000);

import {
   getAccountInfo,
   getBalance,
   getSignOnInfo,
   getTransactions,
   parse,
   parseOrThrow,
} from "../src";

function generateTransaction(index: number): string {
   const types = ["DEBIT", "CREDIT", "XFER", "ATM", "POS", "CHECK", "PAYMENT"];
   const type = types[index % types.length];
   const amount =
      type === "CREDIT"
         ? (Math.random() * 5000).toFixed(2)
         : (-Math.random() * 500).toFixed(2);
   const day = String((index % 28) + 1).padStart(2, "0");

   return `<STMTTRN>
<TRNTYPE>${type}
<DTPOSTED>202310${day}120000[-3:BRT]
<TRNAMT>${amount}
<FITID>2023100${index.toString().padStart(6, "0")}
<NAME>TRANSACTION ${index}
<MEMO>Memo for transaction ${index}
</STMTTRN>`;
}

function generateOFX(transactionCount: number): string {
   const transactions = Array.from({ length: transactionCount }, (_, i) =>
      generateTransaction(i),
   ).join("\n");

   return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20231015120000[-3:BRT]
<LANGUAGE>POR
<FI>
<ORG>Performance Test Bank
<FID>99999
</FI>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>12345-6
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20231001
<DTEND>20231031
${transactions}
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>50000.00
<DTASOF>20231031120000[-3:BRT]
</LEDGERBAL>
<AVAILBAL>
<BALAMT>48000.00
<DTASOF>20231031120000[-3:BRT]
</AVAILBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
}

interface BenchmarkResult {
   name: string;
   iterations: number;
   totalMs: number;
   avgMs: number;
   minMs: number;
   maxMs: number;
   opsPerSec: number;
}

function benchmark(
   name: string,
   fn: () => void,
   iterations: number = 100,
): BenchmarkResult {
   const times: number[] = [];

   for (let i = 0; i < 5; i++) {
      fn();
   }

   for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
   }

   const totalMs = times.reduce((a, b) => a + b, 0);
   const avgMs = totalMs / iterations;
   const minMs = Math.min(...times);
   const maxMs = Math.max(...times);
   const opsPerSec = 1000 / avgMs;

   return { avgMs, iterations, maxMs, minMs, name, opsPerSec, totalMs };
}

function formatResult(result: BenchmarkResult): string {
   return `${result.name}: avg=${result.avgMs.toFixed(3)}ms, min=${result.minMs.toFixed(3)}ms, max=${result.maxMs.toFixed(3)}ms, ops/s=${result.opsPerSec.toFixed(2)}`;
}

test("performance: parse small OFX (10 transactions)", () => {
   const ofx = generateOFX(10);
   const result = benchmark("parse-10-transactions", () => parse(ofx), 100);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(50);
});

test("performance: parse medium OFX (100 transactions)", () => {
   const ofx = generateOFX(100);
   const result = benchmark("parse-100-transactions", () => parse(ofx), 50);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(100);
});

test("performance: parse large OFX (1000 transactions)", () => {
   const ofx = generateOFX(1000);
   const result = benchmark("parse-1000-transactions", () => parse(ofx), 20);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(500);
});

test("performance: parse very large OFX (5000 transactions)", () => {
   const ofx = generateOFX(5000);
   const result = benchmark("parse-5000-transactions", () => parse(ofx), 10);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2000);
});

test("performance: getTransactions extraction (1000 transactions)", () => {
   const ofx = generateOFX(1000);
   const doc = parseOrThrow(ofx);

   const result = benchmark(
      "getTransactions-1000",
      () => getTransactions(doc),
      1000,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(1);
});

test("performance: getAccountInfo extraction", () => {
   const ofx = generateOFX(100);
   const doc = parseOrThrow(ofx);

   const result = benchmark("getAccountInfo", () => getAccountInfo(doc), 1000);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(1);
});

test("performance: getBalance extraction", () => {
   const ofx = generateOFX(100);
   const doc = parseOrThrow(ofx);

   const result = benchmark("getBalance", () => getBalance(doc), 1000);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(1);
});

test("performance: getSignOnInfo extraction", () => {
   const ofx = generateOFX(100);
   const doc = parseOrThrow(ofx);

   const result = benchmark("getSignOnInfo", () => getSignOnInfo(doc), 1000);

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(1);
});

test("performance: full pipeline (parse + extract all)", () => {
   const ofx = generateOFX(500);

   const result = benchmark(
      "full-pipeline-500",
      () => {
         const doc = parseOrThrow(ofx);
         getTransactions(doc);
         getAccountInfo(doc);
         getBalance(doc);
         getSignOnInfo(doc);
      },
      50,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(300);
});

test("performance: memory efficiency with large dataset", () => {
   const transactionCounts = [100, 500, 1000, 2000];
   const results: { count: number; parseTime: number; memoryMB: number }[] = [];

   for (const count of transactionCounts) {
      const ofx = generateOFX(count);

      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      results.push({
         count,
         memoryMB: (endMemory - startMemory) / (1024 * 1024),
         parseTime: endTime - startTime,
      });

      expect(transactions.length).toBe(count);
   }

   console.log("\nMemory Scaling:");
   for (const r of results) {
      console.log(
         `  ${r.count} transactions: ${r.parseTime.toFixed(2)}ms, ~${r.memoryMB.toFixed(2)}MB`,
      );
   }

   const ratio =
      (results[results.length - 1]?.parseTime ?? 0) /
      (results[0]?.parseTime ?? 1);
   const countRatio =
      (results[results.length - 1]?.count ?? 0) / (results[0]?.count ?? 1);
   expect(ratio).toBeLessThan(countRatio * 2);
});

test("performance: concurrent parsing", async () => {
   const ofx = generateOFX(200);
   const concurrency = 10;

   const start = performance.now();
   const promises = Array.from({ length: concurrency }, () =>
      Promise.resolve(parse(ofx)),
   );
   const results = await Promise.all(promises);
   const end = performance.now();

   const totalTime = end - start;
   const avgTimePerParse = totalTime / concurrency;

   console.log(
      `Concurrent parsing (${concurrency}x): total=${totalTime.toFixed(2)}ms, avg=${avgTimePerParse.toFixed(2)}ms`,
   );

   expect(results.every((r) => r.success)).toBe(true);
   expect(totalTime).toBeLessThan(1000);
});

test("performance: OFX file size impact", () => {
   const sizes = [10, 50, 100, 250, 500, 1000];
   const results: { size: number; fileKB: number; parseMs: number }[] = [];

   for (const size of sizes) {
      const ofx = generateOFX(size);
      const fileKB = new Blob([ofx]).size / 1024;

      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
         const start = performance.now();
         parse(ofx);
         times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      results.push({ fileKB, parseMs: avgTime, size });
   }

   console.log("\nFile Size Impact:");
   for (const r of results) {
      const throughput = r.fileKB / r.parseMs;
      console.log(
         `  ${r.size} txns (${r.fileKB.toFixed(1)}KB): ${r.parseMs.toFixed(2)}ms (${throughput.toFixed(2)} KB/ms)`,
      );
   }

   for (const r of results) {
      expect(r.parseMs).toBeLessThan(r.size * 2);
   }
});

test("performance: date parsing overhead", () => {
   const ofx = generateOFX(500);
   const doc = parseOrThrow(ofx);
   const transactions = getTransactions(doc);

   const result = benchmark(
      "date-toDate-conversion",
      () => {
         for (const txn of transactions) {
            txn.DTPOSTED.toDate();
         }
      },
      100,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(10);
});

const BUSINESS_VENDORS = [
   "AMAZON WEB SERVICES",
   "GOOGLE CLOUD PLATFORM",
   "MICROSOFT AZURE",
   "STRIPE PAYMENTS",
   "PAYPAL TRANSFER",
   "UBER FREIGHT LOGISTICS",
   "FEDEX SHIPPING",
   "DHL EXPRESS",
   "STAPLES OFFICE SUPPLY",
   "COSTCO WHOLESALE",
   "HOME DEPOT PRO",
   "GRAINGER INDUSTRIAL",
   "SYSCO FOOD SERVICE",
   "US FOODS INC",
   "ARAMARK SERVICES",
   "ADP PAYROLL",
   "GUSTO PAYROLL",
   "QUICKBOOKS PAYMENTS",
   "SALESFORCE CRM",
   "HUBSPOT INC",
   "SLACK TECHNOLOGIES",
   "ZOOM VIDEO COMM",
   "DROPBOX BUSINESS",
   "ATLASSIAN SOFTWARE",
   "GITHUB INC",
   "DATADOG MONITORING",
   "CLOUDFLARE INC",
   "TWILIO COMMUNICATIONS",
   "SENDGRID EMAIL",
   "MAILCHIMP MARKETING",
   "INDEED HIRING",
   "LINKEDIN RECRUITER",
   "GLASSDOOR EMPLOYER",
   "INSURANCE PREMIUM CO",
   "HEALTH BENEFITS INC",
   "401K CONTRIBUTIONS",
   "EQUIPMENT LEASE CO",
   "OFFICE RENT LLC",
   "UTILITIES PROVIDER",
   "INTERNET SERVICE ISP",
   "PHONE SERVICE TELECOM",
   "LEGAL SERVICES LLP",
   "ACCOUNTING FIRM CPA",
   "CONSULTING GROUP LLC",
   "MARKETING AGENCY INC",
   "PR COMMUNICATIONS",
   "TRAVEL EXPENSE CORP",
   "HOTEL BUSINESS STAY",
   "AIRLINE BUSINESS TRAVEL",
   "CAR RENTAL SERVICE",
];

const BUSINESS_TRANSACTION_PATTERNS = [
   { frequency: 0.3, maxAmount: 500, minAmount: 50, type: "DEBIT" },
   { frequency: 0.25, maxAmount: 5000, minAmount: 500, type: "DEBIT" },
   { frequency: 0.15, maxAmount: 50000, minAmount: 5000, type: "DEBIT" },
   { frequency: 0.05, maxAmount: 500000, minAmount: 50000, type: "DEBIT" },
   { frequency: 0.1, maxAmount: 100000, minAmount: 1000, type: "CREDIT" },
   { frequency: 0.05, maxAmount: 5000000, minAmount: 100000, type: "CREDIT" },
   { frequency: 0.05, maxAmount: 1000000, minAmount: 10000, type: "XFER" },
   { frequency: 0.03, maxAmount: 500, minAmount: 10, type: "FEE" },
   { frequency: 0.02, maxAmount: 10000, minAmount: 100, type: "INT" },
];

function generateBusinessTransaction(index: number, date: Date): string {
   const rand = Math.random();
   let cumulative = 0;
   let pattern = BUSINESS_TRANSACTION_PATTERNS[0] ?? {
      frequency: 0.3,
      maxAmount: 500,
      minAmount: 50,
      type: "DEBIT",
   };

   for (const p of BUSINESS_TRANSACTION_PATTERNS) {
      cumulative += p.frequency;
      if (rand < cumulative) {
         pattern = p;
         break;
      }
   }

   const amount =
      pattern.minAmount +
      Math.random() * (pattern.maxAmount - pattern.minAmount);
   const signedAmount =
      pattern.type === "CREDIT" || pattern.type === "INT"
         ? amount.toFixed(2)
         : (-amount).toFixed(2);

   const vendor = BUSINESS_VENDORS[index % BUSINESS_VENDORS.length];
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const day = String(date.getDate()).padStart(2, "0");
   const hour = String(8 + (index % 10)).padStart(2, "0");
   const minute = String(index % 60).padStart(2, "0");
   const second = String((index * 7) % 60).padStart(2, "0");

   const checkNum =
      pattern.type === "CHECK" ? `<CHECKNUM>${1000 + (index % 9000)}` : "";
   const refNum =
      Math.random() > 0.7
         ? `<REFNUM>REF${year}${month}${String(index).padStart(8, "0")}`
         : "";
   const sic = Math.random() > 0.5 ? `<SIC>${5000 + (index % 4999)}` : "";
   const currency = Math.random() > 0.95 ? `<CURRENCY>EUR` : "";

   return `<STMTTRN>
<TRNTYPE>${pattern.type}
<DTPOSTED>${year}${month}${day}${hour}${minute}${second}[-3:BRT]
<DTUSER>${year}${month}${day}000000[-3:BRT]
<TRNAMT>${signedAmount}
<FITID>TXN${year}${month}${day}${String(index).padStart(10, "0")}
<NAME>${vendor}
<MEMO>Invoice #INV-${year}-${String(index).padStart(6, "0")} - ${vendor} - Business expense category ${(index % 20) + 1}
${checkNum}
${refNum}
${sic}
${currency}
</STMTTRN>`;
}

function generateAnnualBusinessOFX(
   transactionsPerDay: number,
   year: number = 2024,
): string {
   const transactions: string[] = [];
   const startDate = new Date(year, 0, 1);
   const endDate = new Date(year, 11, 31);

   let txnIndex = 0;
   const currentDate = new Date(startDate);

   while (currentDate <= endDate) {
      const isWeekend =
         currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const dailyCount = isWeekend
         ? Math.floor(transactionsPerDay * 0.2)
         : transactionsPerDay + Math.floor(Math.random() * 10);

      for (let i = 0; i < dailyCount; i++) {
         transactions.push(
            generateBusinessTransaction(txnIndex++, currentDate),
         );
      }

      currentDate.setDate(currentDate.getDate() + 1);
   }

   const ledgerBalance = (Math.random() * 10000000).toFixed(2);
   const availBalance = (Number.parseFloat(ledgerBalance) * 0.85).toFixed(2);

   return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
<MESSAGE>SUCCESS
</STATUS>
<DTSERVER>${year}1231235959[-3:BRT]
<LANGUAGE>ENG
<FI>
<ORG>Big Business Commercial Bank
<FID>999888777
</FI>
<SESSCOOKIE>SESS${Date.now()}
<ACCESSKEY>AK${Math.random().toString(36).substring(2, 15)}
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>ANNUAL-${year}-001
<STATUS>
<CODE>0
<SEVERITY>INFO
<MESSAGE>Annual statement generated successfully
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<BRANCHID>0001
<ACCTID>98765432-1
<ACCTTYPE>CHECKING
<ACCTKEY>BUSINESS-PRIME
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${year}0101000000[-3:BRT]
<DTEND>${year}1231235959[-3:BRT]
${transactions.join("\n")}
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>${ledgerBalance}
<DTASOF>${year}1231235959[-3:BRT]
</LEDGERBAL>
<AVAILBAL>
<BALAMT>${availBalance}
<DTASOF>${year}1231235959[-3:BRT]
</AVAILBAL>
<MKTGINFO>Premium Business Account - Annual Statement ${year}
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
}

function formatBytes(bytes: number): string {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n: number): string {
   return n.toLocaleString("en-US");
}

test("performance: annual business statement (~10k transactions)", () => {
   console.log("\n========== ANNUAL BUSINESS STATEMENT (~10K TXN) ==========");

   const ofx = generateAnnualBusinessOFX(30);
   const fileSize = new Blob([ofx]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const parseResult = benchmark("parse-annual-10k", () => parse(ofx), 5);
   console.log(formatResult(parseResult));

   const doc = parseOrThrow(ofx);
   const transactions = getTransactions(doc);
   console.log(`Transactions parsed: ${formatNumber(transactions.length)}`);

   expect(parseResult.avgMs).toBeLessThan(5000);
   expect(transactions.length).toBeGreaterThan(8000);
});

test("performance: large business statement (~25k transactions)", () => {
   console.log("\n========== LARGE BUSINESS STATEMENT (~25K TXN) ==========");

   const ofx = generateAnnualBusinessOFX(70);
   const fileSize = new Blob([ofx]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const parseResult = benchmark("parse-large-25k", () => parse(ofx), 3);
   console.log(formatResult(parseResult));

   const doc = parseOrThrow(ofx);
   const transactions = getTransactions(doc);
   console.log(`Transactions parsed: ${formatNumber(transactions.length)}`);

   expect(parseResult.avgMs).toBeLessThan(15000);
   expect(transactions.length).toBeGreaterThan(20000);
});

test("performance: enterprise statement (~50k transactions)", () => {
   console.log("\n========== ENTERPRISE STATEMENT (~50K TXN) ==========");

   const ofx = generateAnnualBusinessOFX(140);
   const fileSize = new Blob([ofx]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const parseResult = benchmark("parse-enterprise-50k", () => parse(ofx), 2);
   console.log(formatResult(parseResult));

   const doc = parseOrThrow(ofx);
   const transactions = getTransactions(doc);
   console.log(`Transactions parsed: ${formatNumber(transactions.length)}`);

   expect(parseResult.avgMs).toBeLessThan(45000);
   expect(transactions.length).toBeGreaterThan(40000);
});

test("performance: mega corporation statement (~100k transactions)", () => {
   console.log(
      "\n========== MEGA CORPORATION STATEMENT (~100K TXN) ==========",
   );

   const ofx = generateAnnualBusinessOFX(280);
   const fileSize = new Blob([ofx]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const startMem = process.memoryUsage();
   const startTime = performance.now();

   const result = parse(ofx);
   expect(result.success).toBe(true);
   if (!result.success) return;

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage();

   const transactions = getTransactions(result.data);
   const accounts = getAccountInfo(result.data);
   const balances = getBalance(result.data);

   const heapUsedMB = (endMem.heapUsed - startMem.heapUsed) / (1024 * 1024);
   const rssUsedMB = (endMem.rss - startMem.rss) / (1024 * 1024);

   console.log(`File size: ${formatBytes(fileSize)}`);
   console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Transactions: ${formatNumber(transactions.length)}`);
   console.log(`Accounts: ${accounts.length}`);
   console.log(`Balances: ${balances.length}`);
   console.log(`Heap memory delta: ${heapUsedMB.toFixed(2)} MB`);
   console.log(`RSS memory delta: ${rssUsedMB.toFixed(2)} MB`);
   console.log(
      `Throughput: ${(fileSize / (1024 * 1024) / (parseTime / 1000)).toFixed(2)} MB/s`,
   );
   console.log(
      `Transactions/sec: ${formatNumber(Math.round(transactions.length / (parseTime / 1000)))}`,
   );

   expect(parseTime).toBeLessThan(120000);
   expect(transactions.length).toBeGreaterThan(80000);
});

test("performance: extraction operations on large dataset", () => {
   console.log("\n========== EXTRACTION BENCHMARK (50K TXN) ==========");

   const ofx = generateAnnualBusinessOFX(140);
   const doc = parseOrThrow(ofx);

   const txnResult = benchmark(
      "getTransactions-50k",
      () => getTransactions(doc),
      100,
   );
   console.log(formatResult(txnResult));

   const accResult = benchmark(
      "getAccountInfo-50k",
      () => getAccountInfo(doc),
      1000,
   );
   console.log(formatResult(accResult));

   const balResult = benchmark("getBalance-50k", () => getBalance(doc), 1000);
   console.log(formatResult(balResult));

   const signOnResult = benchmark(
      "getSignOnInfo-50k",
      () => getSignOnInfo(doc),
      1000,
   );
   console.log(formatResult(signOnResult));

   expect(txnResult.avgMs).toBeLessThan(5);
   expect(accResult.avgMs).toBeLessThan(1);
   expect(balResult.avgMs).toBeLessThan(1);
   expect(signOnResult.avgMs).toBeLessThan(1);
});

test("performance: date conversion on large dataset", () => {
   console.log("\n========== DATE CONVERSION BENCHMARK (50K TXN) ==========");

   const ofx = generateAnnualBusinessOFX(140);
   const doc = parseOrThrow(ofx);
   const transactions = getTransactions(doc);

   console.log(`Converting ${formatNumber(transactions.length)} dates...`);

   const result = benchmark(
      "date-conversion-50k",
      () => {
         for (const txn of transactions) {
            txn.DTPOSTED.toDate();
            txn.DTUSER?.toDate();
         }
      },
      20,
   );

   console.log(formatResult(result));
   console.log(
      `Dates/ms: ${formatNumber(Math.round((transactions.length * 2) / result.avgMs))}`,
   );

   expect(result.avgMs).toBeLessThan(500);
});

test("performance: memory pressure with multiple large files", () => {
   console.log("\n========== MEMORY PRESSURE TEST ==========");

   const fileCount = 5;
   const docs: ReturnType<typeof parseOrThrow>[] = [];

   const startMem = process.memoryUsage().heapUsed;
   const startTime = performance.now();

   for (let i = 0; i < fileCount; i++) {
      const ofx = generateAnnualBusinessOFX(60, 2020 + i);
      docs.push(parseOrThrow(ofx));
      console.log(`Parsed file ${i + 1}/${fileCount}`);
   }

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage().heapUsed;
   const memUsedMB = (endMem - startMem) / (1024 * 1024);

   let totalTransactions = 0;
   for (const doc of docs) {
      totalTransactions += getTransactions(doc).length;
   }

   console.log(`Total files: ${fileCount}`);
   console.log(`Total transactions: ${formatNumber(totalTransactions)}`);
   console.log(`Total parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Memory used: ${memUsedMB.toFixed(2)} MB`);
   console.log(`Avg memory per file: ${(memUsedMB / fileCount).toFixed(2)} MB`);

   expect(totalTransactions).toBeGreaterThan(50000);
   expect(parseTime).toBeLessThan(60000);
});

test("performance: worst case - maximum field density", () => {
   console.log("\n========== WORST CASE - MAX FIELD DENSITY ==========");

   function generateDenseTransaction(index: number): string {
      const year = 2024;
      const month = String((index % 12) + 1).padStart(2, "0");
      const day = String((index % 28) + 1).padStart(2, "0");

      return `<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${year}${month}${day}120000[-3:BRT]
<DTUSER>${year}${month}${day}080000[-3:BRT]
<DTAVAIL>${year}${month}${day}235959[-3:BRT]
<TRNAMT>-${(Math.random() * 10000).toFixed(2)}
<FITID>DENSE${String(index).padStart(12, "0")}
<CORRECTFITID>CORR${String(index).padStart(12, "0")}
<CORRECTACTION>REPLACE
<SRVRTID>SRV${String(index).padStart(10, "0")}
<CHECKNUM>${1000 + (index % 9000)}
<REFNUM>REF${year}${month}${String(index).padStart(10, "0")}
<SIC>${5000 + (index % 4999)}
<PAYEEID>PAYEE${String(index).padStart(8, "0")}
<NAME>DENSE VENDOR NAME WITH LONG DESCRIPTION ${index}
<MEMO>This is a very detailed memo field containing extensive information about the transaction including reference numbers, dates, and other metadata that might be present in real-world OFX files from financial institutions - Transaction ${index}
<CURRENCY>BRL
</STMTTRN>`;
   }

   const transactionCount = 20000;
   const transactions = Array.from({ length: transactionCount }, (_, i) =>
      generateDenseTransaction(i),
   ).join("\n");

   const ofx = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
<MESSAGE>Dense test file
</STATUS>
<DTSERVER>20241231235959[-3:BRT]
<LANGUAGE>ENG
<FI>
<ORG>Dense Test Bank
<FID>111222333
</FI>
<SESSCOOKIE>DENSE${Date.now()}
<ACCESSKEY>DENSEKEY123
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>DENSE-TEST-001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<BRANCHID>0001
<ACCTID>DENSE-ACCT-001
<ACCTTYPE>CHECKING
<ACCTKEY>DENSE-KEY
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20240101000000[-3:BRT]
<DTEND>20241231235959[-3:BRT]
${transactions}
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>1000000.00
<DTASOF>20241231235959[-3:BRT]
</LEDGERBAL>
<AVAILBAL>
<BALAMT>950000.00
<DTASOF>20241231235959[-3:BRT]
</AVAILBAL>
<MKTGINFO>Dense field test - all optional fields populated
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

   const fileSize = new Blob([ofx]).size;
   console.log(`File size: ${formatBytes(fileSize)}`);
   console.log(`Transactions: ${formatNumber(transactionCount)}`);
   console.log(
      `Avg bytes/transaction: ${Math.round(fileSize / transactionCount)}`,
   );

   const result = benchmark("parse-dense-20k", () => parse(ofx), 3);
   console.log(formatResult(result));

   const doc = parseOrThrow(ofx);
   const txns = getTransactions(doc);

   const hasAllFields = txns.every(
      (t) =>
         t.CHECKNUM &&
         t.REFNUM &&
         t.SIC &&
         t.PAYEEID &&
         t.MEMO &&
         t.DTUSER &&
         t.DTAVAIL,
   );

   console.log(`All optional fields present: ${hasAllFields}`);

   expect(txns.length).toBe(transactionCount);
   expect(hasAllFields).toBe(true);
   expect(result.avgMs).toBeLessThan(30000);
});
