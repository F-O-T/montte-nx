import { expect, test } from "bun:test";
import {
   getAccountInfo,
   getBalance,
   getSignOnInfo,
   getTransactions,
   parse,
   parseOrThrow,
} from "../src";

const sampleOFX = `OFXHEADER:100
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
<ORG>Test Bank
<FID>12345
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
<DTEND>20231015
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231005120000[-3:BRT]
<TRNAMT>-150.00
<FITID>202310050001
<NAME>SUPERMARKET
<MEMO>Purchase at supermarket
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20231010120000[-3:BRT]
<TRNAMT>3500.00
<FITID>202310100001
<NAME>SALARY
<MEMO>Monthly salary
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>5000.00
<DTASOF>20231015120000[-3:BRT]
</LEDGERBAL>
<AVAILBAL>
<BALAMT>4800.00
<DTASOF>20231015120000[-3:BRT]
</AVAILBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

test("parse should return success with valid OFX", () => {
   const result = parse(sampleOFX);

   expect(result.success).toBe(true);
   if (result.success) {
      expect(result.data.header.OFXHEADER).toBe("100");
      expect(result.data.header.VERSION).toBe("102");
   }
});

test("parseOrThrow should return document with valid OFX", () => {
   const doc = parseOrThrow(sampleOFX);

   expect(doc.header.OFXHEADER).toBe("100");
   expect(doc.OFX.SIGNONMSGSRSV1.SONRS.STATUS.CODE).toBe("0");
});

test("getTransactions should extract all transactions", () => {
   const doc = parseOrThrow(sampleOFX);
   const transactions = getTransactions(doc);

   expect(transactions).toHaveLength(2);
   expect(transactions[0]?.TRNTYPE).toBe("DEBIT");
   expect(transactions[0]?.TRNAMT).toBe(-150.0);
   expect(transactions[1]?.TRNTYPE).toBe("CREDIT");
   expect(transactions[1]?.TRNAMT).toBe(3500.0);
});

test("getAccountInfo should extract account information", () => {
   const doc = parseOrThrow(sampleOFX);
   const accounts = getAccountInfo(doc);

   expect(accounts).toHaveLength(1);
   expect(accounts[0]).toHaveProperty("BANKID", "001");
   expect(accounts[0]).toHaveProperty("ACCTID", "12345-6");
   expect(accounts[0]).toHaveProperty("ACCTTYPE", "CHECKING");
});

test("getBalance should extract balance information", () => {
   const doc = parseOrThrow(sampleOFX);
   const balances = getBalance(doc);

   expect(balances).toHaveLength(1);
   expect(balances[0]?.ledger?.BALAMT).toBe(5000.0);
   expect(balances[0]?.available?.BALAMT).toBe(4800.0);
});

test("getSignOnInfo should extract sign-on information", () => {
   const doc = parseOrThrow(sampleOFX);
   const signOn = getSignOnInfo(doc);

   expect(signOn.STATUS.CODE).toBe("0");
   expect(signOn.STATUS.SEVERITY).toBe("INFO");
   expect(signOn.LANGUAGE).toBe("POR");
   expect(signOn.FI?.ORG).toBe("Test Bank");
   expect(signOn.FI?.FID).toBe("12345");
});

test("OFX date should parse correctly with timezone", () => {
   const doc = parseOrThrow(sampleOFX);
   const transactions = getTransactions(doc);

   const date = transactions[0]?.DTPOSTED;
   expect(date?.year).toBe(2023);
   expect(date?.month).toBe(10);
   expect(date?.day).toBe(5);
   expect(date?.timezone.offset).toBe(-3);
   expect(date?.timezone.name).toBe("BRT");
});

test("parse should return error with invalid OFX", () => {
   const result = parse("<OFX><INVALID></INVALID></OFX>");

   expect(result.success).toBe(false);
});
