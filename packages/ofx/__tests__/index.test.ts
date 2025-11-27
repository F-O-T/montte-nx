import { describe, expect, it } from "bun:test";
import { parseOfxContent } from "../src/index";

const createValidOfxContent = (transactions: string = "") => `
OFXHEADER:100
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
<DTSERVER>20231215120000
<LANGUAGE>ENG
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
<CURDEF>USD
<BANKACCTFROM>
<BANKID>123456789
<ACCTID>987654321
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20231201000000
<DTEND>20231231235959
${transactions}
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const createTransaction = (opts: {
   fitid: string;
   amount: string;
   date: string;
   type: string;
   memo?: string;
   name?: string;
}) => `
<STMTTRN>
<TRNTYPE>${opts.type}
<DTPOSTED>${opts.date}
<TRNAMT>${opts.amount}
<FITID>${opts.fitid}
${opts.memo ? `<MEMO>${opts.memo}` : ""}
${opts.name ? `<NAME>${opts.name}` : ""}
</STMTTRN>
`;

describe("ofx parser", () => {
   describe("parseOfxContent", () => {
      it("should parse a single expense transaction", async () => {
         const transaction = createTransaction({
            fitid: "TXN001",
            amount: "-100.50",
            date: "20231215120000",
            type: "DEBIT",
            memo: "Coffee Shop Purchase",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result).toHaveLength(1);
         expect(result[0]).toMatchObject({
            amount: 100.5,
            description: "Coffee Shop Purchase",
            fitid: "TXN001",
            type: "expense",
         });
         expect(result[0]?.date).toBeInstanceOf(Date);
      });

      it("should parse a single income transaction", async () => {
         const transaction = createTransaction({
            fitid: "TXN002",
            amount: "2500.00",
            date: "20231201090000",
            type: "CREDIT",
            memo: "Salary Deposit",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result).toHaveLength(1);
         expect(result[0]).toMatchObject({
            amount: 2500.0,
            description: "Salary Deposit",
            fitid: "TXN002",
            type: "income",
         });
      });

      it("should parse multiple transactions", async () => {
         const transactions = [
            createTransaction({
               fitid: "TXN001",
               amount: "-50.00",
               date: "20231210100000",
               type: "DEBIT",
               memo: "Grocery Store",
            }),
            createTransaction({
               fitid: "TXN002",
               amount: "1000.00",
               date: "20231211120000",
               type: "CREDIT",
               memo: "Payment Received",
            }),
            createTransaction({
               fitid: "TXN003",
               amount: "-25.99",
               date: "20231212150000",
               type: "POS",
               name: "Gas Station",
            }),
         ].join("");
         const ofxContent = createValidOfxContent(transactions);

         const result = await parseOfxContent(ofxContent);

         expect(result).toHaveLength(3);
         expect(result[0]?.type).toBe("expense");
         expect(result[1]?.type).toBe("income");
         expect(result[2]?.type).toBe("expense");
      });

      it("should use NAME when MEMO is not available", async () => {
         const transaction = createTransaction({
            fitid: "TXN003",
            amount: "-75.00",
            date: "20231220140000",
            type: "DEBIT",
            name: "Restaurant Payment",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.description).toBe("Restaurant Payment");
      });

      it("should use 'No description' when neither MEMO nor NAME is available", async () => {
         const transaction = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231220140000
<TRNAMT>-50.00
<FITID>TXN004
</STMTTRN>
`;
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.description).toBe("No description");
      });

      it("should prefer MEMO over NAME for description", async () => {
         const transaction = createTransaction({
            fitid: "TXN005",
            amount: "-30.00",
            date: "20231218110000",
            type: "DEBIT",
            memo: "Memo Description",
            name: "Name Description",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.description).toBe("Memo Description");
      });

      it("should convert negative amounts to positive for expenses", async () => {
         const transaction = createTransaction({
            fitid: "TXN006",
            amount: "-999.99",
            date: "20231225000000",
            type: "DEBIT",
            memo: "Large Purchase",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.amount).toBe(999.99);
         expect(result[0]?.type).toBe("expense");
      });

      it("should handle zero amount transactions", async () => {
         const transaction = createTransaction({
            fitid: "TXN007",
            amount: "0.00",
            date: "20231225120000",
            type: "OTHER",
            memo: "Zero Transaction",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.amount).toBe(0);
         expect(result[0]?.type).toBe("income");
      });

      it("should parse date correctly from DTPOSTED", async () => {
         const transaction = createTransaction({
            fitid: "TXN008",
            amount: "-10.00",
            date: "20231215143022",
            type: "DEBIT",
            memo: "Test",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         const date = result[0]?.date;
         expect(date?.getUTCFullYear()).toBe(2023);
         expect(date?.getUTCMonth()).toBe(11);
         expect(date?.getUTCDate()).toBe(15);
         expect(date?.getUTCHours()).toBe(14);
         expect(date?.getUTCMinutes()).toBe(30);
         expect(date?.getUTCSeconds()).toBe(22);
      });

      it("should handle empty transaction list", async () => {
         const ofxContent = createValidOfxContent("");

         const result = await parseOfxContent(ofxContent);

         expect(result).toHaveLength(0);
         expect(result).toEqual([]);
      });

      it("should handle various transaction types", async () => {
         const transactionTypes = [
            { type: "CREDIT", expected: "income", amount: "100.00" },
            { type: "DEBIT", expected: "expense", amount: "-100.00" },
            { type: "ATM", expected: "expense", amount: "-50.00" },
            { type: "POS", expected: "expense", amount: "-25.00" },
            { type: "XFER", expected: "income", amount: "200.00" },
            { type: "CHECK", expected: "expense", amount: "-75.00" },
         ];

         for (let i = 0; i < transactionTypes.length; i++) {
            const txnType = transactionTypes[i];
            if (!txnType) continue;
            const transaction = createTransaction({
               fitid: `TXN${i}`,
               amount: txnType.amount,
               date: "20231215120000",
               type: txnType.type,
               memo: `${txnType.type} transaction`,
            });
            const ofxContent = createValidOfxContent(transaction);

            const result = await parseOfxContent(ofxContent);

            expect(result[0]?.type).toBe(txnType.expected);
         }
      });

      it("should throw AppError for invalid OFX content", () => {
         const invalidContent = "This is not valid OFX content";

         expect(parseOfxContent(invalidContent)).rejects.toThrow(
            "Failed to parse OFX file",
         );
      });

      it("should throw AppError for malformed OFX structure", () => {
         const malformedContent = `
OFXHEADER:100
DATA:OFXSGML

<OFX>
<INVALID>
</INVALID>
</OFX>
`;

         expect(parseOfxContent(malformedContent)).rejects.toThrow(
            "Failed to parse OFX file",
         );
      });

      it("should handle decimal amounts correctly", async () => {
         const transactions = [
            createTransaction({
               fitid: "TXN001",
               amount: "-0.01",
               date: "20231215120000",
               type: "DEBIT",
               memo: "Tiny expense",
            }),
            createTransaction({
               fitid: "TXN002",
               amount: "123456.78",
               date: "20231215120000",
               type: "CREDIT",
               memo: "Large income",
            }),
         ].join("");
         const ofxContent = createValidOfxContent(transactions);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.amount).toBe(0.01);
         expect(result[1]?.amount).toBe(123456.78);
      });

      it("should handle date with timezone offset", async () => {
         const transaction = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231215120000[-3:BRT]
<TRNAMT>-100.00
<FITID>TXN_TZ
<MEMO>Timezone Test
</STMTTRN>
`;
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.date).toBeInstanceOf(Date);
         expect(result[0]?.fitid).toBe("TXN_TZ");
      });
   });
});
