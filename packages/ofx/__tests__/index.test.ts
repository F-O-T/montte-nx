import { describe, expect, it } from "bun:test";
import { parseOfxBuffer, parseOfxContent } from "../src/index";

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
            amount: "-100.50",
            date: "20231215120000",
            fitid: "TXN001",
            memo: "Coffee Shop Purchase",
            type: "DEBIT",
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
            amount: "2500.00",
            date: "20231201090000",
            fitid: "TXN002",
            memo: "Salary Deposit",
            type: "CREDIT",
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
               amount: "-50.00",
               date: "20231210100000",
               fitid: "TXN001",
               memo: "Grocery Store",
               type: "DEBIT",
            }),
            createTransaction({
               amount: "1000.00",
               date: "20231211120000",
               fitid: "TXN002",
               memo: "Payment Received",
               type: "CREDIT",
            }),
            createTransaction({
               amount: "-25.99",
               date: "20231212150000",
               fitid: "TXN003",
               name: "Gas Station",
               type: "POS",
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
            amount: "-75.00",
            date: "20231220140000",
            fitid: "TXN003",
            name: "Restaurant Payment",
            type: "DEBIT",
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
            amount: "-30.00",
            date: "20231218110000",
            fitid: "TXN005",
            memo: "Memo Description",
            name: "Name Description",
            type: "DEBIT",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.description).toBe("Memo Description");
      });

      it("should convert negative amounts to positive for expenses", async () => {
         const transaction = createTransaction({
            amount: "-999.99",
            date: "20231225000000",
            fitid: "TXN006",
            memo: "Large Purchase",
            type: "DEBIT",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.amount).toBe(999.99);
         expect(result[0]?.type).toBe("expense");
      });

      it("should handle zero amount transactions", async () => {
         const transaction = createTransaction({
            amount: "0.00",
            date: "20231225120000",
            fitid: "TXN007",
            memo: "Zero Transaction",
            type: "OTHER",
         });
         const ofxContent = createValidOfxContent(transaction);

         const result = await parseOfxContent(ofxContent);

         expect(result[0]?.amount).toBe(0);
         expect(result[0]?.type).toBe("income");
      });

      it("should parse date correctly from DTPOSTED", async () => {
         const transaction = createTransaction({
            amount: "-10.00",
            date: "20231215143022",
            fitid: "TXN008",
            memo: "Test",
            type: "DEBIT",
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
         const transactionTypes: Array<{
            amount: string;
            expected: "income" | "expense";
            type: string;
         }> = [
            { amount: "100.00", expected: "income", type: "CREDIT" },
            { amount: "-100.00", expected: "expense", type: "DEBIT" },
            { amount: "-50.00", expected: "expense", type: "ATM" },
            { amount: "-25.00", expected: "expense", type: "POS" },
            { amount: "200.00", expected: "income", type: "XFER" },
            { amount: "-75.00", expected: "expense", type: "CHECK" },
         ];

         for (let i = 0; i < transactionTypes.length; i++) {
            const txnType = transactionTypes[i];
            if (!txnType) continue;
            const transaction = createTransaction({
               amount: txnType.amount,
               date: "20231215120000",
               fitid: `TXN${i}`,
               memo: `${txnType.type} transaction`,
               type: txnType.type,
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
               amount: "-0.01",
               date: "20231215120000",
               fitid: "TXN001",
               memo: "Tiny expense",
               type: "DEBIT",
            }),
            createTransaction({
               amount: "123456.78",
               date: "20231215120000",
               fitid: "TXN002",
               memo: "Large income",
               type: "CREDIT",
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

   describe("parseOfxBuffer", () => {
      const createValidOfxBuffer = (transactions: string, charset = "1252") => {
         const content = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:${charset}
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
<LANGUAGE>POR
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
         return content;
      };

      it("should parse Portuguese characters with Windows-1252 encoding", async () => {
         const portugueseText = "Pagamento de água e eletricidade";
         const transaction = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231215120000[-3:BRT]
<TRNAMT>-150.00
<FITID>BR001
<MEMO>${portugueseText}
</STMTTRN>
`;
         const ofxContent = createValidOfxBuffer(transaction);
         const encoder = new TextEncoder();
         const buffer = encoder.encode(ofxContent);

         const result = await parseOfxBuffer(buffer);

         expect(result).toHaveLength(1);
         expect(result[0]?.description).toContain("Pagamento");
         expect(result[0]?.fitid).toBe("BR001");
         expect(result[0]?.type).toBe("expense");
      });

      it("should parse Brazilian bank transaction with accented characters", async () => {
         const transaction = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231215120000[-3:BRT]
<TRNAMT>-89.90
<FITID>BR002
<MEMO>Compra no cartão - São Paulo
</STMTTRN>
`;
         const ofxContent = createValidOfxBuffer(transaction);
         const buffer = new TextEncoder().encode(ofxContent);

         const result = await parseOfxBuffer(buffer);

         expect(result).toHaveLength(1);
         expect(result[0]?.description).toContain("Paulo");
         expect(result[0]?.amount).toBe(89.9);
      });

      it("should parse multiple Portuguese transactions", async () => {
         const transactions = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231210100000[-3:BRT]
<TRNAMT>-45.00
<FITID>BR003
<MEMO>Farmácia - medicação
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20231211120000[-3:BRT]
<TRNAMT>3500.00
<FITID>BR004
<MEMO>Salário mensal - Proventos
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231212150000[-3:BRT]
<TRNAMT>-120.50
<FITID>BR005
<MEMO>Supermercado - alimentação
</STMTTRN>
`;
         const ofxContent = createValidOfxBuffer(transactions);
         const buffer = new TextEncoder().encode(ofxContent);

         const result = await parseOfxBuffer(buffer);

         expect(result).toHaveLength(3);
         expect(result[0]?.type).toBe("expense");
         expect(result[1]?.type).toBe("income");
         expect(result[2]?.type).toBe("expense");
      });

      it("should handle common Portuguese special characters", async () => {
         const transaction = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231215120000[-3:BRT]
<TRNAMT>-200.00
<FITID>BR006
<MEMO>Ação promocional - João e Maria Ltda
</STMTTRN>
`;
         const ofxContent = createValidOfxBuffer(transaction);
         const buffer = new TextEncoder().encode(ofxContent);

         const result = await parseOfxBuffer(buffer);

         expect(result).toHaveLength(1);
         expect(result[0]?.fitid).toBe("BR006");
      });

      it("should parse buffer with UTF-8 encoding", async () => {
         const transaction = `
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231215120000[-3:BRT]
<TRNAMT>-75.00
<FITID>BR007
<MEMO>Café e pão de queijo
</STMTTRN>
`;
         const ofxContent = createValidOfxBuffer(transaction, "UTF-8");
         const buffer = new TextEncoder().encode(ofxContent);

         const result = await parseOfxBuffer(buffer);

         expect(result).toHaveLength(1);
         expect(result[0]?.amount).toBe(75);
      });

      it("should throw AppError for invalid buffer content", () => {
         const invalidContent = "This is not valid OFX content";
         const buffer = new TextEncoder().encode(invalidContent);

         expect(parseOfxBuffer(buffer)).rejects.toThrow(
            "Failed to parse OFX file",
         );
      });

      it("should throw AppError for empty buffer", () => {
         const buffer = new Uint8Array(0);

         expect(parseOfxBuffer(buffer)).rejects.toThrow(
            "Failed to parse OFX file",
         );
      });
   });
});
