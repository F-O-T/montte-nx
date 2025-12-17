import { describe, expect, it } from "bun:test";
import { parseAmount, parseCsvContent, parseDate, previewCsv } from "./parser";

describe("parseAmount", () => {
   describe("decimal-comma format (Brazilian)", () => {
      it("should parse positive amounts with comma decimal", () => {
         expect(parseAmount("1.234,56", "decimal-comma")).toBe(1234.56);
      });

      it("should parse negative amounts", () => {
         expect(parseAmount("-1.234,56", "decimal-comma")).toBe(-1234.56);
      });

      it("should handle amounts without thousands separator", () => {
         expect(parseAmount("123,45", "decimal-comma")).toBe(123.45);
      });

      it("should handle whole numbers", () => {
         expect(parseAmount("1.000", "decimal-comma")).toBe(1000);
      });

      it("should strip currency symbols (R$)", () => {
         expect(parseAmount("R$ 1.234,56", "decimal-comma")).toBe(1234.56);
      });

      it("should handle whitespace", () => {
         expect(parseAmount("  1.234,56  ", "decimal-comma")).toBe(1234.56);
      });

      it("should return 0 for empty string", () => {
         expect(parseAmount("", "decimal-comma")).toBe(0);
      });

      it("should return 0 for invalid input", () => {
         expect(parseAmount("invalid", "decimal-comma")).toBe(0);
      });
   });

   describe("decimal-dot format (US)", () => {
      it("should parse positive amounts with dot decimal", () => {
         expect(parseAmount("1,234.56", "decimal-dot")).toBe(1234.56);
      });

      it("should parse negative amounts", () => {
         expect(parseAmount("-1,234.56", "decimal-dot")).toBe(-1234.56);
      });

      it("should handle amounts without thousands separator", () => {
         expect(parseAmount("123.45", "decimal-dot")).toBe(123.45);
      });

      it("should handle whole numbers", () => {
         expect(parseAmount("1,000", "decimal-dot")).toBe(1000);
      });
   });
});

describe("parseDate", () => {
   describe("DD/MM/YYYY format", () => {
      it("should parse valid dates", () => {
         const date = parseDate("15/06/2023", "DD/MM/YYYY");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
         expect(date?.getMonth()).toBe(5);
         expect(date?.getFullYear()).toBe(2023);
      });

      it("should parse dates with single digit day/month", () => {
         const date = parseDate("5/6/2023", "DD/MM/YYYY");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(5);
         expect(date?.getMonth()).toBe(5);
      });

      it("should parse 2-digit year format (DD/MM/YY)", () => {
         const date = parseDate("15/06/23", "DD/MM/YYYY");
         expect(date).not.toBeNull();
         expect(date?.getFullYear()).toBe(2023);
      });

      it("should strip time suffix (Nubank format)", () => {
         const date = parseDate("15/06/2023 às 17:16:03", "DD/MM/YYYY");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
      });

      it("should strip generic time patterns", () => {
         const date = parseDate("15/06/2023 14:30", "DD/MM/YYYY");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
      });

      it("should return null for empty string", () => {
         expect(parseDate("", "DD/MM/YYYY")).toBeNull();
      });

      it("should return null for invalid date", () => {
         expect(parseDate("invalid", "DD/MM/YYYY")).toBeNull();
      });
   });

   describe("YYYY-MM-DD format", () => {
      it("should parse valid dates", () => {
         const date = parseDate("2023-06-15", "YYYY-MM-DD");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
         expect(date?.getMonth()).toBe(5);
         expect(date?.getFullYear()).toBe(2023);
      });

      it("should parse dates with single digit day/month", () => {
         const date = parseDate("2023-6-5", "YYYY-MM-DD");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(5);
         expect(date?.getMonth()).toBe(5);
      });
   });

   describe("MM/DD/YYYY format", () => {
      it("should parse valid dates", () => {
         const date = parseDate("06/15/2023", "MM/DD/YYYY");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
         expect(date?.getMonth()).toBe(5);
         expect(date?.getFullYear()).toBe(2023);
      });
   });

   describe("lowercase format variants", () => {
      it("should handle dd/mm/yyyy", () => {
         const date = parseDate("15/06/2023", "dd/mm/yyyy");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
      });

      it("should handle yyyy-mm-dd", () => {
         const date = parseDate("2023-06-15", "yyyy-mm-dd");
         expect(date).not.toBeNull();
         expect(date?.getDate()).toBe(15);
      });
   });
});

describe("parseCsvContent", () => {
   it("should parse basic CSV with default settings", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,Compra supermercado,"-123,45"
16/06/2023,Salário,"1.500,00"`;

      const result = parseCsvContent(csv);

      expect(result.headers).toEqual(["Data", "Descrição", "Valor"]);
      expect(result.rows).toHaveLength(2);
      expect(result.totalRows).toBe(2);
   });

   it("should detect Nubank format", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,PIX Recebido,100,00`;

      const result = parseCsvContent(csv);

      expect(result.detectedFormat?.id).toBe("nubank");
   });

   it("should parse with custom column mapping", () => {
      const csv = `Valor,Data,Descrição
"-50,00",20/06/2023,Pagamento conta
"200,00",21/06/2023,Transferência`;

      const result = parseCsvContent(csv, {
         columnMapping: { date: 1, amount: 0, description: 2 },
      });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.amount).toBe(50);
      expect(result.rows[0]?.type).toBe("expense");
      expect(result.rows[1]?.amount).toBe(200);
      expect(result.rows[1]?.type).toBe("income");
   });

   it("should handle semicolon delimiter", () => {
      const csv = `Data;Lançamento;Valor
15/06/2023;Compra;-100,00`;

      const result = parseCsvContent(csv, { delimiter: ";" });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.description).toBe("Compra");
   });

   it("should handle quoted fields with commas", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,"Compra em Loja, Centro","-50,00"`;

      const result = parseCsvContent(csv);

      // normalizeText removes diacritics but preserves case
      expect(result.rows[0]?.description).toBe("Compra em Loja, Centro");
   });

   it("should handle escaped quotes in fields", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,"Loja ""ABC"" Ltda","-50,00"`;

      const result = parseCsvContent(csv);

      // normalizeText preserves the case
      expect(result.rows[0]?.description).toBe('Loja "ABC" Ltda');
   });

   it("should record errors for invalid dates", () => {
      const csv = `Data,Descrição,Valor
invalid-date,Compra,-50,00
16/06/2023,Outra compra,-30,00`;

      const result = parseCsvContent(csv);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain("Invalid date");
      expect(result.rows).toHaveLength(1);
   });

   it("should record errors for invalid amounts", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,Compra,invalid
16/06/2023,Outra,-30,00`;

      const result = parseCsvContent(csv);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain("Invalid amount");
   });

   it("should throw error for empty CSV", () => {
      expect(() => parseCsvContent("")).toThrow("CSV file is empty");
   });

   it("should filter by selected rows", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,Linha 1,-10,00
16/06/2023,Linha 2,-20,00
17/06/2023,Linha 3,-30,00`;

      const result = parseCsvContent(csv, { selectedRows: [1, 3] });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.description).toBe("Linha 1");
      expect(result.rows[1]?.description).toBe("Linha 3");
   });

   it("should skip custom number of header rows", () => {
      // Note: skipRows determines how many rows to skip AFTER the headers row (line 0)
      // The first line is always used for headers. With skipRows: 2, it skips 2 data rows.
      const csv = `Data,Descrição,Valor
15/06/2023,Linha 1,-10,00
16/06/2023,Linha 2,-20,00
17/06/2023,Linha 3,-30,00`;

      const result = parseCsvContent(csv, { skipRows: 2 });

      // skipRows: 2 means skip first 2 lines (header + 1 data row)
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.description).toBe("Linha 2");
   });

   it("should detect transaction type from type column", () => {
      // Note: The type column overrides the sign-based detection
      // Using semicolon delimiter to avoid comma in amount being treated as delimiter
      const csv = `Data;Descrição;Valor;Tipo
15/06/2023;PIX;-100,00;Crédito
16/06/2023;Compra;-50,00;Débito`;

      const result = parseCsvContent(csv, {
         delimiter: ";",
         columnMapping: { date: 0, description: 1, amount: 2, type: 3 },
      });

      expect(result.rows[0]?.type).toBe("income");
      expect(result.rows[1]?.type).toBe("expense");
   });

   it("should use decimal-dot format when specified", () => {
      // Using semicolon delimiter to avoid comma in amount being treated as delimiter
      const csv = `Date;Description;Amount
06/15/2023;Purchase;-1,234.56`;

      const result = parseCsvContent(csv, {
         delimiter: ";",
         dateFormat: "MM/DD/YYYY",
         amountFormat: "decimal-dot",
         columnMapping: { date: 0, description: 1, amount: 2 },
      });

      expect(result.rows[0]?.amount).toBe(1234.56);
   });
});

describe("previewCsv", () => {
   it("should return headers and sample rows", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,Compra 1,-10,00
16/06/2023,Compra 2,-20,00
17/06/2023,Compra 3,-30,00`;

      const preview = previewCsv(csv);

      expect(preview.headers).toEqual(["Data", "Descrição", "Valor"]);
      expect(preview.sampleRows).toHaveLength(3);
      expect(preview.totalRows).toBe(3);
   });

   it("should limit sample rows", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,Compra 1,-10,00
16/06/2023,Compra 2,-20,00
17/06/2023,Compra 3,-30,00
18/06/2023,Compra 4,-40,00
19/06/2023,Compra 5,-50,00
20/06/2023,Compra 6,-60,00`;

      const preview = previewCsv(csv, { maxRows: 3 });

      expect(preview.sampleRows).toHaveLength(3);
      expect(preview.totalRows).toBe(6);
   });

   it("should detect bank format", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,PIX Recebido,100,00`;

      const preview = previewCsv(csv);

      expect(preview.detectedFormat?.id).toBe("nubank");
      expect(preview.detectedFormat?.name).toBe("Nubank");
   });

   it("should suggest column mapping", () => {
      const csv = `Data,Descrição,Valor
15/06/2023,Compra,-50,00`;

      const preview = previewCsv(csv);

      expect(preview.suggestedMapping.date).toBe(0);
      expect(preview.suggestedMapping.description).toBe(1);
      expect(preview.suggestedMapping.amount).toBe(2);
   });

   it("should detect delimiter", () => {
      const csvSemicolon = `Data;Descrição;Valor
15/06/2023;Compra;-50,00`;

      const preview = previewCsv(csvSemicolon);

      expect(preview.delimiter).toBe(";");
   });

   it("should use custom delimiter", () => {
      const csv = `Data|Descrição|Valor
15/06/2023|Compra|-50,00`;

      const preview = previewCsv(csv, { delimiter: "|" });

      expect(preview.headers).toEqual(["Data", "Descrição", "Valor"]);
   });

   it("should throw error for empty CSV", () => {
      expect(() => previewCsv("")).toThrow("CSV file is empty");
   });

   it("should return null for undetected format", () => {
      const csv = `Col1,Col2,Col3
a,b,c`;

      const preview = previewCsv(csv);

      expect(preview.detectedFormat).toBeNull();
   });
});
