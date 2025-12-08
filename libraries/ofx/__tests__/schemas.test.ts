import { describe, expect, it } from "bun:test";
import {
   accountTypeSchema,
   balanceSchema,
   bankAccountSchema,
   creditCardAccountSchema,
   ofxDateSchema,
   statusSchema,
   transactionSchema,
   transactionTypeSchema,
} from "../src/schemas";

describe("ofxDateSchema", () => {
   it("parses complete date with timezone", () => {
      const result = ofxDateSchema.parse("20231215143025[-3:BRT]");
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(15);
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.second).toBe(25);
      expect(result.timezone.offset).toBe(-3);
      expect(result.timezone.name).toBe("BRT");
   });

   it("parses date without time", () => {
      const result = ofxDateSchema.parse("20230601");
      expect(result.year).toBe(2023);
      expect(result.month).toBe(6);
      expect(result.day).toBe(1);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
      expect(result.second).toBe(0);
   });

   it("provides toDate() function", () => {
      const result = ofxDateSchema.parse("20231215120000[0:GMT]");
      const date = result.toDate();
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(11);
      expect(date.getUTCDate()).toBe(15);
   });

   it("toDate() handles timezone offset", () => {
      const result = ofxDateSchema.parse("20231215150000[-3:BRT]");
      const date = result.toDate();
      expect(date.getUTCHours()).toBe(18);
   });

   it("preserves raw value", () => {
      const raw = "20231215143025[-3:BRT]";
      const result = ofxDateSchema.parse(raw);
      expect(result.raw).toBe(raw);
   });

   it("parses positive timezone offset", () => {
      const result = ofxDateSchema.parse("20231215120000[+5:IST]");
      expect(result.timezone.offset).toBe(5);
      expect(result.timezone.name).toBe("IST");
   });

   it("defaults to UTC for missing timezone", () => {
      const result = ofxDateSchema.parse("20231215120000");
      expect(result.timezone.offset).toBe(0);
      expect(result.timezone.name).toBe("UTC");
   });
});

describe("statusSchema", () => {
   it("parses INFO status", () => {
      const result = statusSchema.parse({ CODE: "0", SEVERITY: "INFO" });
      expect(result.CODE).toBe("0");
      expect(result.SEVERITY).toBe("INFO");
   });

   it("parses WARN status", () => {
      const result = statusSchema.parse({ CODE: "1", SEVERITY: "WARN" });
      expect(result.SEVERITY).toBe("WARN");
   });

   it("parses ERROR status", () => {
      const result = statusSchema.parse({ CODE: "2000", SEVERITY: "ERROR" });
      expect(result.SEVERITY).toBe("ERROR");
   });

   it("parses status with message", () => {
      const result = statusSchema.parse({
         CODE: "0",
         MESSAGE: "Success",
         SEVERITY: "INFO",
      });
      expect(result.MESSAGE).toBe("Success");
   });

   it("rejects invalid severity", () => {
      expect(() =>
         statusSchema.parse({ CODE: "0", SEVERITY: "INVALID" }),
      ).toThrow();
   });

   it("requires CODE", () => {
      expect(() => statusSchema.parse({ SEVERITY: "INFO" })).toThrow();
   });

   it("requires SEVERITY", () => {
      expect(() => statusSchema.parse({ CODE: "0" })).toThrow();
   });
});

describe("transactionTypeSchema", () => {
   const validTypes = [
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
   ] as const;

   for (const type of validTypes) {
      it(`accepts ${type} transaction type`, () => {
         expect(transactionTypeSchema.parse(type)).toBe(type);
      });
   }

   it("rejects invalid transaction type", () => {
      expect(() => transactionTypeSchema.parse("INVALID")).toThrow();
   });

   it("rejects lowercase type", () => {
      expect(() => transactionTypeSchema.parse("credit")).toThrow();
   });
});

describe("accountTypeSchema", () => {
   const validTypes = [
      "CHECKING",
      "SAVINGS",
      "MONEYMRKT",
      "CREDITLINE",
      "CD",
   ] as const;

   for (const type of validTypes) {
      it(`accepts ${type} account type`, () => {
         expect(accountTypeSchema.parse(type)).toBe(type);
      });
   }

   it("rejects invalid account type", () => {
      expect(() => accountTypeSchema.parse("INVESTMENT")).toThrow();
   });
});

describe("transactionSchema", () => {
   const minimalTransaction = {
      DTPOSTED: "20231215120000",
      FITID: "TXN001",
      TRNAMT: "-100.00",
      TRNTYPE: "DEBIT",
   };

   it("parses minimal transaction", () => {
      const result = transactionSchema.parse(minimalTransaction);
      expect(result.TRNTYPE).toBe("DEBIT");
      expect(result.TRNAMT).toBe(-100);
      expect(result.FITID).toBe("TXN001");
   });

   it("transforms TRNAMT to number", () => {
      const result = transactionSchema.parse(minimalTransaction);
      expect(typeof result.TRNAMT).toBe("number");
   });

   it("parses optional NAME field", () => {
      const result = transactionSchema.parse({
         ...minimalTransaction,
         NAME: "Test Merchant",
      });
      expect(result.NAME).toBe("Test Merchant");
   });

   it("parses optional MEMO field", () => {
      const result = transactionSchema.parse({
         ...minimalTransaction,
         MEMO: "Payment memo",
      });
      expect(result.MEMO).toBe("Payment memo");
   });

   it("parses optional CHECKNUM field", () => {
      const result = transactionSchema.parse({
         ...minimalTransaction,
         CHECKNUM: "1234",
      });
      expect(result.CHECKNUM).toBe("1234");
   });

   it("parses CORRECTACTION DELETE", () => {
      const result = transactionSchema.parse({
         ...minimalTransaction,
         CORRECTACTION: "DELETE",
         CORRECTFITID: "ORIG001",
      });
      expect(result.CORRECTACTION).toBe("DELETE");
   });

   it("parses CORRECTACTION REPLACE", () => {
      const result = transactionSchema.parse({
         ...minimalTransaction,
         CORRECTACTION: "REPLACE",
         CORRECTFITID: "ORIG001",
      });
      expect(result.CORRECTACTION).toBe("REPLACE");
   });

   it("parses optional date fields", () => {
      const result = transactionSchema.parse({
         ...minimalTransaction,
         DTAVAIL: "20231216120000",
         DTUSER: "20231214120000",
      });
      expect(result.DTUSER?.day).toBe(14);
      expect(result.DTAVAIL?.day).toBe(16);
   });

   it("requires TRNTYPE", () => {
      const { TRNTYPE: _, ...withoutType } = minimalTransaction;
      expect(() => transactionSchema.parse(withoutType)).toThrow();
   });

   it("requires DTPOSTED", () => {
      const { DTPOSTED: _, ...withoutDate } = minimalTransaction;
      expect(() => transactionSchema.parse(withoutDate)).toThrow();
   });

   it("requires TRNAMT", () => {
      const { TRNAMT: _, ...withoutAmount } = minimalTransaction;
      expect(() => transactionSchema.parse(withoutAmount)).toThrow();
   });

   it("allows optional FITID", () => {
      const { FITID: _, ...withoutFitId } = minimalTransaction;
      const result = transactionSchema.parse(withoutFitId);
      expect(result.FITID).toBeUndefined();
   });
});

describe("balanceSchema", () => {
   it("parses balance with amount and date", () => {
      const result = balanceSchema.parse({
         BALAMT: "1234.56",
         DTASOF: "20231215120000",
      });
      expect(result.BALAMT).toBe(1234.56);
      expect(result.DTASOF.year).toBe(2023);
   });

   it("transforms BALAMT to number", () => {
      const result = balanceSchema.parse({
         BALAMT: "-500.00",
         DTASOF: "20231215",
      });
      expect(result.BALAMT).toBe(-500);
   });

   it("requires BALAMT", () => {
      expect(() => balanceSchema.parse({ DTASOF: "20231215" })).toThrow();
   });

   it("requires DTASOF", () => {
      expect(() => balanceSchema.parse({ BALAMT: "100" })).toThrow();
   });
});

describe("bankAccountSchema", () => {
   const minimalAccount = {
      ACCTID: "123456789",
      ACCTTYPE: "CHECKING",
      BANKID: "BANK001",
   };

   it("parses minimal bank account", () => {
      const result = bankAccountSchema.parse(minimalAccount);
      expect(result.BANKID).toBe("BANK001");
      expect(result.ACCTID).toBe("123456789");
      expect(result.ACCTTYPE).toBe("CHECKING");
   });

   it("parses optional BRANCHID", () => {
      const result = bankAccountSchema.parse({
         ...minimalAccount,
         BRANCHID: "BRANCH01",
      });
      expect(result.BRANCHID).toBe("BRANCH01");
   });

   it("parses optional ACCTKEY", () => {
      const result = bankAccountSchema.parse({
         ...minimalAccount,
         ACCTKEY: "KEY123",
      });
      expect(result.ACCTKEY).toBe("KEY123");
   });

   it("requires BANKID", () => {
      const { BANKID: _, ...withoutBank } = minimalAccount;
      expect(() => bankAccountSchema.parse(withoutBank)).toThrow();
   });

   it("validates ACCTTYPE enum", () => {
      expect(() =>
         bankAccountSchema.parse({ ...minimalAccount, ACCTTYPE: "INVALID" }),
      ).toThrow();
   });
});

describe("creditCardAccountSchema", () => {
   it("parses minimal credit card account", () => {
      const result = creditCardAccountSchema.parse({
         ACCTID: "4111111111111111",
      });
      expect(result.ACCTID).toBe("4111111111111111");
   });

   it("parses optional ACCTKEY", () => {
      const result = creditCardAccountSchema.parse({
         ACCTID: "4111111111111111",
         ACCTKEY: "KEY123",
      });
      expect(result.ACCTKEY).toBe("KEY123");
   });

   it("requires ACCTID", () => {
      expect(() => creditCardAccountSchema.parse({})).toThrow();
   });
});
