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
   generateHeader,
} from "../src/generator";
import { parseOrThrow } from "../src/parser";

describe("generateHeader", () => {
   it("generates valid OFX header with defaults", () => {
      const header = generateHeader();

      expect(header).toContain("OFXHEADER:100");
      expect(header).toContain("DATA:OFXSGML");
      expect(header).toContain("VERSION:100");
      expect(header).toContain("SECURITY:NONE");
      expect(header).toContain("ENCODING:USASCII");
      expect(header).toContain("CHARSET:1252");
      expect(header).toContain("COMPRESSION:NONE");
   });

   it("allows custom version", () => {
      const header = generateHeader({ version: "220" });
      expect(header).toContain("VERSION:220");
   });

   it("allows custom encoding", () => {
      const header = generateHeader({ encoding: "UTF-8" });
      expect(header).toContain("ENCODING:UTF-8");
   });

   it("allows custom charset", () => {
      const header = generateHeader({ charset: "65001" });
      expect(header).toContain("CHARSET:65001");
   });

   it("allows all custom options", () => {
      const header = generateHeader({
         charset: "65001",
         encoding: "UTF-8",
         version: "220",
      });

      expect(header).toContain("VERSION:220");
      expect(header).toContain("ENCODING:UTF-8");
      expect(header).toContain("CHARSET:65001");
   });

   it("ends with newline", () => {
      const header = generateHeader();
      expect(header.endsWith("\n")).toBe(true);
   });
});

describe("generateBankStatement", () => {
   const baseOptions = {
      accountId: "123456789",
      accountType: "CHECKING" as const,
      bankId: "BANK001",
      currency: "BRL",
      endDate: new Date("2023-12-31"),
      startDate: new Date("2023-12-01"),
      transactions: [],
   };

   it("generates parseable OFX", () => {
      const ofx = generateBankStatement(baseOptions);
      expect(() => parseOrThrow(ofx)).not.toThrow();
   });

   it("includes bank account info", () => {
      const ofx = generateBankStatement(baseOptions);
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toHaveProperty("BANKID", "BANK001");
      expect(accounts[0]).toHaveProperty("ACCTID", "123456789");
      expect(accounts[0]).toHaveProperty("ACCTTYPE", "CHECKING");
   });

   it("includes transactions", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         transactions: [
            {
               amount: -100.5,
               datePosted: new Date("2023-12-15"),
               fitId: "TXN001",
               name: "Test Merchant",
               type: "DEBIT",
            },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.TRNTYPE).toBe("DEBIT");
      expect(transactions[0]?.TRNAMT).toBe(-100.5);
      expect(transactions[0]?.FITID).toBe("TXN001");
      expect(transactions[0]?.NAME).toBe("Test Merchant");
   });

   it("includes multiple transactions", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         transactions: [
            {
               amount: -50,
               datePosted: new Date("2023-12-15"),
               fitId: "TXN001",
               type: "DEBIT",
            },
            {
               amount: 100,
               datePosted: new Date("2023-12-16"),
               fitId: "TXN002",
               type: "CREDIT",
            },
            {
               amount: -200,
               datePosted: new Date("2023-12-17"),
               fitId: "TXN003",
               type: "ATM",
            },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(3);
   });

   it("includes ledger balance", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         ledgerBalance: {
            amount: 5000.5,
            asOfDate: new Date("2023-12-31"),
         },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.ledger?.BALAMT).toBe(5000.5);
   });

   it("includes available balance", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         availableBalance: {
            amount: 4500.25,
            asOfDate: new Date("2023-12-31"),
         },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.available?.BALAMT).toBe(4500.25);
   });

   it("includes financial institution info", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         financialInstitution: {
            fid: "12345",
            org: "Test Bank",
         },
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.FI?.ORG).toBe("Test Bank");
      expect(signOn.FI?.FID).toBe("12345");
   });

   it("uses custom language", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         language: "ENG",
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.LANGUAGE).toBe("ENG");
   });

   it("defaults to POR language", () => {
      const ofx = generateBankStatement(baseOptions);
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.LANGUAGE).toBe("POR");
   });

   it("includes currency code", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         currency: "USD",
      });

      expect(ofx).toContain("<CURDEF>USD");
   });

   it("escapes special characters in text fields", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         transactions: [
            {
               amount: -100,
               datePosted: new Date("2023-12-15"),
               fitId: "TXN<>001",
               name: "Test & Merchant",
               type: "DEBIT",
            },
         ],
      });

      expect(ofx).toContain("&amp;");
      expect(ofx).toContain("&lt;");
      expect(ofx).toContain("&gt;");
   });

   it("includes transaction memo", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         transactions: [
            {
               amount: -100,
               datePosted: new Date("2023-12-15"),
               fitId: "TXN001",
               memo: "Payment for services",
               type: "DEBIT",
            },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.MEMO).toBe("Payment for services");
   });

   it("includes check number", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         transactions: [
            {
               amount: -500,
               checkNum: "1234",
               datePosted: new Date("2023-12-15"),
               fitId: "CHK001",
               type: "CHECK",
            },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.CHECKNUM).toBe("1234");
   });

   it("supports SAVINGS account type", () => {
      const ofx = generateBankStatement({
         ...baseOptions,
         accountType: "SAVINGS",
      });
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts[0]).toHaveProperty("ACCTTYPE", "SAVINGS");
   });
});

describe("generateCreditCardStatement", () => {
   const baseOptions = {
      accountId: "4111111111111111",
      currency: "BRL",
      endDate: new Date("2023-12-31"),
      startDate: new Date("2023-12-01"),
      transactions: [],
   };

   it("generates parseable OFX", () => {
      const ofx = generateCreditCardStatement(baseOptions);
      expect(() => parseOrThrow(ofx)).not.toThrow();
   });

   it("includes credit card account info", () => {
      const ofx = generateCreditCardStatement(baseOptions);
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toHaveProperty("ACCTID", "4111111111111111");
   });

   it("does not include BANKID", () => {
      const ofx = generateCreditCardStatement(baseOptions);
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts[0]).not.toHaveProperty("BANKID");
   });

   it("includes transactions", () => {
      const ofx = generateCreditCardStatement({
         ...baseOptions,
         transactions: [
            {
               amount: -75.99,
               datePosted: new Date("2023-12-15"),
               fitId: "CC001",
               name: "Online Store",
               type: "DEBIT",
            },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.TRNAMT).toBe(-75.99);
   });

   it("includes ledger balance", () => {
      const ofx = generateCreditCardStatement({
         ...baseOptions,
         ledgerBalance: {
            amount: -1500.5,
            asOfDate: new Date("2023-12-31"),
         },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.ledger?.BALAMT).toBe(-1500.5);
   });

   it("includes available balance", () => {
      const ofx = generateCreditCardStatement({
         ...baseOptions,
         availableBalance: {
            amount: 3500,
            asOfDate: new Date("2023-12-31"),
         },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.available?.BALAMT).toBe(3500);
   });

   it("includes financial institution info", () => {
      const ofx = generateCreditCardStatement({
         ...baseOptions,
         financialInstitution: {
            fid: "54321",
            org: "Credit Card Bank",
         },
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.FI?.ORG).toBe("Credit Card Bank");
      expect(signOn.FI?.FID).toBe("54321");
   });

   it("uses custom language", () => {
      const ofx = generateCreditCardStatement({
         ...baseOptions,
         language: "SPA",
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.LANGUAGE).toBe("SPA");
   });

   it("includes CCSTMTTRNRS element", () => {
      const ofx = generateCreditCardStatement(baseOptions);
      expect(ofx).toContain("<CCSTMTTRNRS>");
      expect(ofx).toContain("</CCSTMTTRNRS>");
   });

   it("includes CREDITCARDMSGSRSV1 element", () => {
      const ofx = generateCreditCardStatement(baseOptions);
      expect(ofx).toContain("<CREDITCARDMSGSRSV1>");
      expect(ofx).toContain("</CREDITCARDMSGSRSV1>");
   });
});
