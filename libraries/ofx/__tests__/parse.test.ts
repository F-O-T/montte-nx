import { describe, expect, it } from "bun:test";
import { parse, parseOrThrow } from "../src/parser";
import {
   createBankStatement,
   createCreditCardStatement,
   createMinimalBankOfx,
   createOfxWithMultipleTransactions,
} from "./helpers";

describe("parse", () => {
   describe("success cases", () => {
      it("parses minimal bank statement", () => {
         const ofx = createMinimalBankOfx();
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.OFX.SIGNONMSGSRSV1.SONRS.STATUS.CODE).toBe("0");
         }
      });

      it("parses bank statement with multiple transactions", () => {
         const ofx = createOfxWithMultipleTransactions(5);
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            const transactions = result.data.OFX.BANKMSGSRSV1?.STMTTRNRS;
            expect(transactions).toBeDefined();
         }
      });

      it("parses credit card statement", () => {
         const ofx = createCreditCardStatement({
            transactions: [
               { amount: "-100.00", fitId: "CC001", type: "DEBIT" },
            ],
         });
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.OFX.CREDITCARDMSGSRSV1).toBeDefined();
         }
      });

      it("extracts header information", () => {
         const ofx = createMinimalBankOfx();
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.header.OFXHEADER).toBe("100");
         }
      });

      it("parses statement with balances", () => {
         const ofx = createBankStatement({
            availBalance: { amount: "900.00", date: "20231215120000[-3:BRT]" },
            ledgerBalance: {
               amount: "1000.00",
               date: "20231215120000[-3:BRT]",
            },
            transactions: [{ fitId: "TXN1" }],
         });
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            const stmtrs = result.data.OFX.BANKMSGSRSV1?.STMTTRNRS;
            if (stmtrs && !Array.isArray(stmtrs)) {
               expect(stmtrs.STMTRS?.LEDGERBAL?.BALAMT).toBe(1000);
               expect(stmtrs.STMTRS?.AVAILBAL?.BALAMT).toBe(900);
            }
         }
      });

      it("parses statement with financial institution", () => {
         const ofx = createBankStatement({
            fiFid: "12345",
            fiOrg: "Test Bank",
            transactions: [],
         });
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.OFX.SIGNONMSGSRSV1.SONRS.FI?.ORG).toBe(
               "Test Bank",
            );
            expect(result.data.OFX.SIGNONMSGSRSV1.SONRS.FI?.FID).toBe("12345");
         }
      });

      it("parses dates with timezone", () => {
         const ofx = createMinimalBankOfx();
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            const dtserver = result.data.OFX.SIGNONMSGSRSV1.SONRS.DTSERVER;
            expect(dtserver.timezone.offset).toBe(-3);
            expect(dtserver.timezone.name).toBe("BRT");
         }
      });

      it("parses transaction amounts as numbers", () => {
         const ofx = createBankStatement({
            transactions: [{ amount: "-123.45", fitId: "TXN1" }],
         });
         const result = parse(ofx);
         expect(result.success).toBe(true);
         if (result.success) {
            const stmtrs = result.data.OFX.BANKMSGSRSV1?.STMTTRNRS;
            if (stmtrs && !Array.isArray(stmtrs)) {
               const txns = stmtrs.STMTRS?.BANKTRANLIST?.STMTTRN ?? [];
               expect(txns[0]?.TRNAMT).toBe(-123.45);
            }
         }
      });
   });

   describe("error cases", () => {
      it("returns error for null input", () => {
         const result = parse(null as unknown as string);
         expect(result.success).toBe(false);
         if (!result.success) {
            expect(result.error.issues.length).toBeGreaterThan(0);
         }
      });

      it("returns error for undefined input", () => {
         const result = parse(undefined as unknown as string);
         expect(result.success).toBe(false);
      });

      it("returns error for empty string", () => {
         const result = parse("");
         expect(result.success).toBe(false);
         if (!result.success) {
            expect(result.error.issues[0]?.message).toContain("empty");
         }
      });

      it("returns error for whitespace-only string", () => {
         const result = parse("   \n\t   ");
         expect(result.success).toBe(false);
      });

      it("returns error for number input", () => {
         const result = parse(123 as unknown as string);
         expect(result.success).toBe(false);
      });

      it("returns error for invalid OFX structure", () => {
         const result = parse("<OFX></OFX>");
         expect(result.success).toBe(false);
      });

      it("returns error for missing SIGNONMSGSRSV1", () => {
         const ofx = `OFXHEADER:100

<OFX>
<BANKMSGSRSV1>
</BANKMSGSRSV1>
</OFX>`;
         const result = parse(ofx);
         expect(result.success).toBe(false);
      });

      it("returns error for missing STATUS in SONRS", () => {
         const ofx = `OFXHEADER:100

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<DTSERVER>20231215120000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
</OFX>`;
         const result = parse(ofx);
         expect(result.success).toBe(false);
      });
   });

   describe("edge cases", () => {
      it("handles Windows line endings", () => {
         const ofx = createMinimalBankOfx().replace(/\n/g, "\r\n");
         const result = parse(ofx);
         expect(result.success).toBe(true);
      });

      it("handles empty transaction list", () => {
         const ofx = createBankStatement({ transactions: [] });
         const result = parse(ofx);
         expect(result.success).toBe(true);
      });

      it("handles special characters in transaction name", () => {
         const ofx = createBankStatement({
            transactions: [{ fitId: "TXN1", name: "Test & Company" }],
         });
         const result = parse(ofx);
         expect(result.success).toBe(true);
      });

      it("parses OFX with XML declaration", () => {
         const ofx = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="220"?>
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20231215120000
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
</OFX>`;
         const result = parse(ofx);
         expect(result.success).toBe(true);
      });
   });
});

describe("parseOrThrow", () => {
   it("returns document for valid OFX", () => {
      const ofx = createMinimalBankOfx();
      const doc = parseOrThrow(ofx);
      expect(doc.OFX.SIGNONMSGSRSV1.SONRS.STATUS.CODE).toBe("0");
   });

   it("throws ZodError for invalid input", () => {
      expect(() => parseOrThrow("")).toThrow();
   });

   it("throws ZodError for null input", () => {
      expect(() => parseOrThrow(null as unknown as string)).toThrow();
   });

   it("throws ZodError for malformed OFX", () => {
      expect(() => parseOrThrow("<OFX></OFX>")).toThrow();
   });

   it("returns parsed header", () => {
      const ofx = createMinimalBankOfx();
      const doc = parseOrThrow(ofx);
      expect(doc.header).toBeDefined();
      expect(doc.header.OFXHEADER).toBe("100");
   });
});
