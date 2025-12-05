import { describe, expect, it } from "bun:test";
import {
   getAccountInfo,
   getBalance,
   getSignOnInfo,
   getTransactions,
} from "../src/extractors";
import { parseOrThrow } from "../src/parser";
import {
   createBankStatement,
   createCreditCardStatement,
   createOfxWithMultipleTransactions,
} from "./helpers";

describe("getTransactions", () => {
   it("extracts transactions from bank statement", () => {
      const ofx = createBankStatement({
         transactions: [
            { amount: "-100.00", fitId: "TXN001", type: "DEBIT" },
            { amount: "200.00", fitId: "TXN002", type: "CREDIT" },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(2);
      expect(transactions[0]?.FITID).toBe("TXN001");
      expect(transactions[1]?.FITID).toBe("TXN002");
   });

   it("extracts transactions from credit card statement", () => {
      const ofx = createCreditCardStatement({
         transactions: [{ amount: "-50.00", fitId: "CC001", type: "DEBIT" }],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.FITID).toBe("CC001");
   });

   it("returns empty array when no transactions", () => {
      const ofx = createBankStatement({ transactions: [] });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toEqual([]);
   });

   it("extracts multiple transactions", () => {
      const ofx = createOfxWithMultipleTransactions(10);
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions).toHaveLength(10);
   });

   it("extracts transaction amount as number", () => {
      const ofx = createBankStatement({
         transactions: [{ amount: "-123.45", fitId: "TXN001" }],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.TRNAMT).toBe(-123.45);
      expect(typeof transactions[0]?.TRNAMT).toBe("number");
   });

   it("extracts transaction type", () => {
      const ofx = createBankStatement({
         transactions: [{ fitId: "TXN001", type: "ATM" }],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.TRNTYPE).toBe("ATM");
   });

   it("extracts transaction date as parsed object", () => {
      const ofx = createBankStatement({
         transactions: [
            { datePosted: "20231225140000[-3:BRT]", fitId: "TXN001" },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.DTPOSTED.year).toBe(2023);
      expect(transactions[0]?.DTPOSTED.month).toBe(12);
      expect(transactions[0]?.DTPOSTED.day).toBe(25);
   });

   it("extracts optional transaction fields", () => {
      const ofx = createBankStatement({
         transactions: [
            {
               checkNum: "1234",
               fitId: "TXN001",
               memo: "Payment memo",
               name: "Test Merchant",
            },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.NAME).toBe("Test Merchant");
      expect(transactions[0]?.MEMO).toBe("Payment memo");
      expect(transactions[0]?.CHECKNUM).toBe("1234");
   });

   it("maintains transaction order", () => {
      const ofx = createBankStatement({
         transactions: [
            { fitId: "FIRST" },
            { fitId: "SECOND" },
            { fitId: "THIRD" },
         ],
      });
      const doc = parseOrThrow(ofx);
      const transactions = getTransactions(doc);

      expect(transactions[0]?.FITID).toBe("FIRST");
      expect(transactions[1]?.FITID).toBe("SECOND");
      expect(transactions[2]?.FITID).toBe("THIRD");
   });
});

describe("getAccountInfo", () => {
   it("extracts bank account info", () => {
      const ofx = createBankStatement({
         accountId: "ACC456",
         accountType: "CHECKING",
         bankId: "BANK123",
      });
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toHaveProperty("BANKID", "BANK123");
      expect(accounts[0]).toHaveProperty("ACCTID", "ACC456");
      expect(accounts[0]).toHaveProperty("ACCTTYPE", "CHECKING");
   });

   it("extracts credit card account info", () => {
      const ofx = createCreditCardStatement({
         accountId: "4111111111111111",
      });
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toHaveProperty("ACCTID", "4111111111111111");
   });

   it("credit card account has no BANKID", () => {
      const ofx = createCreditCardStatement({
         accountId: "4111111111111111",
      });
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts[0]).not.toHaveProperty("BANKID");
   });

   it("extracts savings account type", () => {
      const ofx = createBankStatement({
         accountType: "SAVINGS",
      });
      const doc = parseOrThrow(ofx);
      const accounts = getAccountInfo(doc);

      expect(accounts[0]).toHaveProperty("ACCTTYPE", "SAVINGS");
   });

   it("returns empty array for missing account info", () => {
      const ofx = createBankStatement({});
      const doc = parseOrThrow(ofx);
      doc.OFX.BANKMSGSRSV1 = undefined;
      const accounts = getAccountInfo(doc);

      expect(accounts).toEqual([]);
   });
});

describe("getBalance", () => {
   it("extracts ledger balance", () => {
      const ofx = createBankStatement({
         ledgerBalance: { amount: "1234.56", date: "20231215120000" },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances).toHaveLength(1);
      expect(balances[0]?.ledger?.BALAMT).toBe(1234.56);
   });

   it("extracts available balance", () => {
      const ofx = createBankStatement({
         availBalance: { amount: "1000.00", date: "20231215120000" },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances).toHaveLength(1);
      expect(balances[0]?.available?.BALAMT).toBe(1000);
   });

   it("extracts both ledger and available balances", () => {
      const ofx = createBankStatement({
         availBalance: { amount: "4500.00", date: "20231215120000" },
         ledgerBalance: { amount: "5000.00", date: "20231215120000" },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.ledger?.BALAMT).toBe(5000);
      expect(balances[0]?.available?.BALAMT).toBe(4500);
   });

   it("extracts balance date as parsed object", () => {
      const ofx = createBankStatement({
         ledgerBalance: { amount: "100", date: "20231225140000[-3:BRT]" },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.ledger?.DTASOF.year).toBe(2023);
      expect(balances[0]?.ledger?.DTASOF.month).toBe(12);
      expect(balances[0]?.ledger?.DTASOF.day).toBe(25);
   });

   it("extracts credit card balance", () => {
      const ofx = createCreditCardStatement({
         ledgerBalance: { amount: "-500.00", date: "20231215120000" },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.ledger?.BALAMT).toBe(-500);
   });

   it("handles negative balance amounts", () => {
      const ofx = createBankStatement({
         ledgerBalance: { amount: "-123.45", date: "20231215120000" },
      });
      const doc = parseOrThrow(ofx);
      const balances = getBalance(doc);

      expect(balances[0]?.ledger?.BALAMT).toBe(-123.45);
   });

   it("returns empty array when no balances", () => {
      const ofx = createBankStatement({});
      const doc = parseOrThrow(ofx);
      doc.OFX.BANKMSGSRSV1 = undefined;
      const balances = getBalance(doc);

      expect(balances).toEqual([]);
   });
});

describe("getSignOnInfo", () => {
   it("extracts sign-on response", () => {
      const ofx = createBankStatement({
         language: "POR",
         serverDate: "20231215120000[-3:BRT]",
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn).toBeDefined();
      expect(signOn.LANGUAGE).toBe("POR");
   });

   it("extracts server date", () => {
      const ofx = createBankStatement({
         serverDate: "20231225140000[-3:BRT]",
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.DTSERVER.year).toBe(2023);
      expect(signOn.DTSERVER.month).toBe(12);
      expect(signOn.DTSERVER.day).toBe(25);
   });

   it("extracts status code", () => {
      const ofx = createBankStatement({});
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.STATUS.CODE).toBe("0");
      expect(signOn.STATUS.SEVERITY).toBe("INFO");
   });

   it("extracts FI organization info", () => {
      const ofx = createBankStatement({
         fiFid: "12345",
         fiOrg: "Test Bank",
      });
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.FI?.ORG).toBe("Test Bank");
      expect(signOn.FI?.FID).toBe("12345");
   });

   it("handles missing FI info", () => {
      const ofx = createBankStatement({});
      const doc = parseOrThrow(ofx);
      const signOn = getSignOnInfo(doc);

      expect(signOn.FI).toBeUndefined();
   });
});
