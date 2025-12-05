import { describe, expect, it } from "bun:test";
import {
   getAccountInfo,
   getBalance,
   getSignOnInfo,
   getTransactions,
} from "../src/extractors";
import {
   generateBankStatement,
   generateCreditCardStatement,
} from "../src/generator";
import { parse, parseOrThrow } from "../src/parser";
import {
   createBankStatement,
   createCreditCardStatement,
   createOfxWithAllTransactionTypes,
   createOfxWithMultipleTransactions,
} from "./helpers";

describe("parse -> extract round trip", () => {
   it("parses and extracts bank statement correctly", () => {
      const ofx = createBankStatement({
         accountId: "ACC123",
         accountType: "CHECKING",
         bankId: "MYBANK",
         fiFid: "12345",
         fiOrg: "My Bank Corp",
         ledgerBalance: { amount: "1500.00", date: "20231215120000" },
         transactions: [
            { amount: "-100.00", fitId: "TXN001", type: "DEBIT" },
            { amount: "500.00", fitId: "TXN002", type: "CREDIT" },
         ],
      });

      const doc = parseOrThrow(ofx);

      const accounts = getAccountInfo(doc);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toHaveProperty("BANKID", "MYBANK");

      const transactions = getTransactions(doc);
      expect(transactions).toHaveLength(2);

      const balances = getBalance(doc);
      expect(balances[0]?.ledger?.BALAMT).toBe(1500);

      const signOn = getSignOnInfo(doc);
      expect(signOn.FI?.ORG).toBe("My Bank Corp");
   });

   it("parses and extracts credit card statement correctly", () => {
      const ofx = createCreditCardStatement({
         accountId: "4111111111111111",
         ledgerBalance: { amount: "-1000.00", date: "20231215120000" },
         transactions: [{ amount: "-250.00", fitId: "CC001", type: "DEBIT" }],
      });

      const doc = parseOrThrow(ofx);

      const accounts = getAccountInfo(doc);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toHaveProperty("ACCTID", "4111111111111111");

      const transactions = getTransactions(doc);
      expect(transactions).toHaveLength(1);

      const balances = getBalance(doc);
      expect(balances[0]?.ledger?.BALAMT).toBe(-1000);
   });

   it("handles all transaction types", () => {
      const ofx = createOfxWithAllTransactionTypes();
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(18);

      const types = transactions.map((t) => t.TRNTYPE);
      expect(types).toContain("CREDIT");
      expect(types).toContain("DEBIT");
      expect(types).toContain("ATM");
      expect(types).toContain("XFER");
      expect(types).toContain("CHECK");
      expect(types).toContain("PAYMENT");
   });

   it("handles large number of transactions", () => {
      const ofx = createOfxWithMultipleTransactions(100);
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(100);
   });
});

describe("generate -> parse round trip", () => {
   it("generates and parses bank statement", () => {
      const generated = generateBankStatement({
         accountId: "123456789",
         accountType: "CHECKING",
         bankId: "BANK001",
         currency: "BRL",
         endDate: new Date("2023-12-31"),
         ledgerBalance: {
            amount: 5000,
            asOfDate: new Date("2023-12-31"),
         },
         startDate: new Date("2023-12-01"),
         transactions: [
            {
               amount: -100,
               datePosted: new Date("2023-12-15"),
               fitId: "TXN001",
               name: "Test Merchant",
               type: "DEBIT",
            },
         ],
      });

      const doc = parseOrThrow(generated);

      const accounts = getAccountInfo(doc);
      expect(accounts[0]).toHaveProperty("BANKID", "BANK001");
      expect(accounts[0]).toHaveProperty("ACCTID", "123456789");

      const transactions = getTransactions(doc);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.TRNAMT).toBe(-100);

      const balances = getBalance(doc);
      expect(balances[0]?.ledger?.BALAMT).toBe(5000);
   });

   it("generates and parses credit card statement", () => {
      const generated = generateCreditCardStatement({
         accountId: "4111111111111111",
         currency: "USD",
         endDate: new Date("2023-12-31"),
         ledgerBalance: {
            amount: -1500,
            asOfDate: new Date("2023-12-31"),
         },
         startDate: new Date("2023-12-01"),
         transactions: [
            {
               amount: -75.99,
               datePosted: new Date("2023-12-15"),
               fitId: "CC001",
               type: "DEBIT",
            },
         ],
      });

      const doc = parseOrThrow(generated);

      const accounts = getAccountInfo(doc);
      expect(accounts[0]).toHaveProperty("ACCTID", "4111111111111111");

      const transactions = getTransactions(doc);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.TRNAMT).toBe(-75.99);
   });

   it("preserves special characters through round trip", () => {
      const generated = generateBankStatement({
         accountId: "ACC<>123",
         accountType: "CHECKING",
         bankId: "BANK&CO",
         currency: "BRL",
         endDate: new Date("2023-12-31"),
         startDate: new Date("2023-12-01"),
         transactions: [
            {
               amount: -100,
               datePosted: new Date("2023-12-15"),
               fitId: "TXN&001",
               memo: "Payment <memo>",
               name: "Test & Merchant",
               type: "DEBIT",
            },
         ],
      });

      const doc = parseOrThrow(generated);

      const accounts = getAccountInfo(doc);
      expect(accounts[0]).toHaveProperty("BANKID", "BANK&CO");

      const transactions = getTransactions(doc);
      expect(transactions[0]?.FITID).toBe("TXN&001");
      expect(transactions[0]?.NAME).toBe("Test & Merchant");
      expect(transactions[0]?.MEMO).toBe("Payment <memo>");
   });
});

describe("error handling", () => {
   it("parse returns error for invalid content", () => {
      const result = parse("not valid ofx");
      expect(result.success).toBe(false);
   });

   it("parse returns error for empty content", () => {
      const result = parse("");
      expect(result.success).toBe(false);
   });

   it("parseOrThrow throws for invalid content", () => {
      expect(() => parseOrThrow("not valid ofx")).toThrow();
   });

   it("parseOrThrow throws for empty content", () => {
      expect(() => parseOrThrow("")).toThrow();
   });

   it("returns success:true for valid content", () => {
      const ofx = createBankStatement({});
      const result = parse(ofx);
      expect(result.success).toBe(true);
   });
});

describe("date handling", () => {
   it("preserves date information through parsing", () => {
      const ofx = createBankStatement({
         transactions: [
            { datePosted: "20231225143025[-3:BRT]", fitId: "TXN001" },
         ],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);
      const date = transactions[0]?.DTPOSTED;

      expect(date.year).toBe(2023);
      expect(date.month).toBe(12);
      expect(date.day).toBe(25);
      expect(date.hour).toBe(14);
      expect(date.minute).toBe(30);
      expect(date.second).toBe(25);
      expect(date.timezone.offset).toBe(-3);
      expect(date.timezone.name).toBe("BRT");
   });

   it("converts date to JS Date object correctly", () => {
      const ofx = createBankStatement({
         transactions: [
            { datePosted: "20231225120000[0:GMT]", fitId: "TXN001" },
         ],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);
      const jsDate = transactions[0]?.DTPOSTED.toDate();

      expect(jsDate.getUTCFullYear()).toBe(2023);
      expect(jsDate.getUTCMonth()).toBe(11);
      expect(jsDate.getUTCDate()).toBe(25);
      expect(jsDate.getUTCHours()).toBe(12);
   });

   it("handles timezone offset in date conversion", () => {
      const ofx = createBankStatement({
         transactions: [
            { datePosted: "20231225150000[-3:BRT]", fitId: "TXN001" },
         ],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);
      const jsDate = transactions[0]?.DTPOSTED.toDate();

      expect(jsDate.getUTCHours()).toBe(18);
   });
});

describe("amount handling", () => {
   it("parses positive amounts correctly", () => {
      const ofx = createBankStatement({
         transactions: [{ amount: "500.00", fitId: "TXN001", type: "CREDIT" }],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.TRNAMT).toBe(500);
   });

   it("parses negative amounts correctly", () => {
      const ofx = createBankStatement({
         transactions: [{ amount: "-250.50", fitId: "TXN001", type: "DEBIT" }],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.TRNAMT).toBe(-250.5);
   });

   it("parses amounts with many decimal places", () => {
      const ofx = createBankStatement({
         transactions: [{ amount: "123.456789", fitId: "TXN001" }],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.TRNAMT).toBeCloseTo(123.456789, 5);
   });

   it("parses zero amounts", () => {
      const ofx = createBankStatement({
         transactions: [{ amount: "0.00", fitId: "TXN001" }],
      });

      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.TRNAMT).toBe(0);
   });
});
