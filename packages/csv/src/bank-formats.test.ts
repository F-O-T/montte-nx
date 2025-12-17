import { describe, expect, it } from "bun:test";
import {
   BANK_FORMATS,
   detectBankFormat,
   detectDelimiter,
   getAvailableFormats,
   getFormatById,
   suggestColumnMapping,
} from "./bank-formats";

describe("detectDelimiter", () => {
   it("should detect comma delimiter", () => {
      const content = "Data,Descrição,Valor\n15/06/2023,Compra,100";
      expect(detectDelimiter(content)).toBe(",");
   });

   it("should detect semicolon delimiter", () => {
      const content = "Data;Descrição;Valor\n15/06/2023;Compra;100";
      expect(detectDelimiter(content)).toBe(";");
   });

   it("should prefer semicolon when counts are equal or higher", () => {
      const content = "Data;Col,A;Valor";
      expect(detectDelimiter(content)).toBe(";");
   });

   it("should default to comma when no delimiters found", () => {
      const content = "DataDescriçãoValor";
      expect(detectDelimiter(content)).toBe(",");
   });

   it("should handle empty content", () => {
      expect(detectDelimiter("")).toBe(",");
   });
});

describe("detectBankFormat", () => {
   describe("Nubank", () => {
      it("should detect Nubank format with Portuguese headers", () => {
         const headers = ["Data", "Descrição", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("nubank");
      });

      it("should detect Nubank format with English headers", () => {
         const headers = ["Date", "Description", "Amount"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("nubank");
      });

      it("should detect Nubank format with accented headers", () => {
         const headers = ["DATA", "DESCRIÇÃO", "VALOR"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("nubank");
      });
   });

   describe("Itaú", () => {
      it("should detect Itaú format", () => {
         const headers = ["Data", "Lançamento", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("itau");
      });

      it("should detect Itaú format with data lancamento", () => {
         const headers = ["Data Lançamento", "Histórico", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("itau");
      });
   });

   describe("Bradesco", () => {
      it("should detect Bradesco format with data mov", () => {
         const headers = ["Data Mov", "Histórico", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("bradesco");
      });

      it("should detect Bradesco format with data and historico", () => {
         const headers = ["Data", "Histórico", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("bradesco");
      });
   });

   describe("Banco Inter", () => {
      it("should match Itaú before Inter for data lancamento headers", () => {
         // Itaú's "data lancamento" pattern matches before Inter's pattern
         const headers = ["Data Lançamento", "Tipo", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("itau");
      });

      it("should match Nubank before Inter for generic data/descricao/valor", () => {
         // Since Nubank is checked first and matches "data" + "descricao" + "valor",
         // generic headers will match Nubank before Inter
         const headers = ["Data", "Descrição", "Valor", "Saldo"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("nubank");
      });
   });

   describe("Santander", () => {
      it("should match Nubank before Santander for overlapping patterns", () => {
         // Santander requires "data" + "descricao" + "valor" + "saldo"
         // But Nubank matches "data" + "descricao" + "valor" first
         const headers = ["Data", "Descrição", "Valor", "Saldo"];
         const format = detectBankFormat(headers);
         // Nubank matches first due to order
         expect(format?.id).toBe("nubank");
      });
   });

   describe("Banco do Brasil", () => {
      it("should match Bradesco before BB for overlapping patterns", () => {
         // BB requires: "data" + "historico" + "documento" + "valor"
         // But Bradesco matches "data" + "historico" + "valor" first
         const headers = ["Data", "Histórico", "Documento", "Valor"];
         const format = detectBankFormat(headers);
         // Bradesco matches first due to order in BANK_FORMATS array
         expect(format?.id).toBe("bradesco");
      });

      it("should match Bradesco for data/historico/valor", () => {
         const headers = ["Data", "Histórico", "Valor"];
         const format = detectBankFormat(headers);
         expect(format?.id).toBe("bradesco");
      });
   });

   it("should return null for unknown format", () => {
      const headers = ["Column1", "Column2", "Column3"];
      const format = detectBankFormat(headers);
      expect(format).toBeNull();
   });

   it("should be case insensitive", () => {
      const headers = ["DATA", "DESCRICAO", "VALOR"];
      const format = detectBankFormat(headers);
      expect(format?.id).toBe("nubank");
   });

   it("should handle headers with extra whitespace", () => {
      const headers = ["  Data  ", "  Descrição  ", "  Valor  "];
      const format = detectBankFormat(headers);
      expect(format?.id).toBe("nubank");
   });
});

describe("suggestColumnMapping", () => {
   it("should suggest mapping for Portuguese headers", () => {
      const headers = ["Data", "Descrição", "Valor"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.date).toBe(0);
      expect(mapping.description).toBe(1);
      expect(mapping.amount).toBe(2);
   });

   it("should suggest mapping for English headers", () => {
      const headers = ["Date", "Description", "Amount"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.date).toBe(0);
      expect(mapping.description).toBe(1);
      expect(mapping.amount).toBe(2);
   });

   it("should handle mixed order columns", () => {
      const headers = ["Amount", "Date", "Description"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.amount).toBe(0);
      expect(mapping.date).toBe(1);
      expect(mapping.description).toBe(2);
   });

   it("should handle alternative header names", () => {
      const headers = ["DT", "Memo", "Value"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.date).toBe(0);
      expect(mapping.description).toBe(1);
      expect(mapping.amount).toBe(2);
   });

   it("should handle historico as description", () => {
      const headers = ["Data", "Histórico", "Valor"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.description).toBe(1);
   });

   it("should handle lancamento as description", () => {
      const headers = ["Data", "Lançamento", "Valor"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.description).toBe(1);
   });

   it("should return null for columns not found", () => {
      const headers = ["Col1", "Col2", "Col3"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.date).toBeNull();
      expect(mapping.description).toBeNull();
      expect(mapping.amount).toBeNull();
   });

   it("should handle VL as amount abbreviation", () => {
      const headers = ["DT", "Desc", "VL"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.amount).toBe(2);
   });

   it("should be case insensitive", () => {
      const headers = ["DATA", "DESCRICAO", "VALOR"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.date).toBe(0);
      expect(mapping.description).toBe(1);
      expect(mapping.amount).toBe(2);
   });

   it("should handle accented characters", () => {
      const headers = ["Dátá", "Descríçãó", "Válór"];
      const mapping = suggestColumnMapping(headers);

      expect(mapping.date).toBe(0);
      expect(mapping.description).toBe(1);
      expect(mapping.amount).toBe(2);
   });
});

describe("getAvailableFormats", () => {
   it("should return all available formats", () => {
      const formats = getAvailableFormats();

      expect(formats.length).toBe(BANK_FORMATS.length);
      expect(formats.every((f) => f.id && f.name)).toBe(true);
   });

   it("should include known banks", () => {
      const formats = getAvailableFormats();
      const ids = formats.map((f) => f.id);

      expect(ids).toContain("nubank");
      expect(ids).toContain("itau");
      expect(ids).toContain("bradesco");
      expect(ids).toContain("inter");
      expect(ids).toContain("santander");
      expect(ids).toContain("banco-do-brasil");
   });

   it("should include generic formats", () => {
      const formats = getAvailableFormats();
      const ids = formats.map((f) => f.id);

      expect(ids).toContain("generic-comma");
      expect(ids).toContain("generic-semicolon");
   });

   it("should return objects with only id and name", () => {
      const formats = getAvailableFormats();

      for (const format of formats) {
         expect(Object.keys(format)).toEqual(["id", "name"]);
      }
   });
});

describe("getFormatById", () => {
   it("should return format for valid id", () => {
      const format = getFormatById("nubank");

      expect(format).toBeDefined();
      expect(format?.id).toBe("nubank");
      expect(format?.name).toBe("Nubank");
   });

   it("should return full format object", () => {
      const format = getFormatById("nubank");

      expect(format?.delimiter).toBe(",");
      expect(format?.dateFormat).toBe("DD/MM/YYYY");
      expect(format?.amountFormat).toBe("decimal-comma");
      expect(format?.hasHeader).toBe(true);
      expect(format?.columnMapping).toEqual({
         date: 0,
         description: 1,
         amount: 2,
      });
   });

   it("should return undefined for invalid id", () => {
      const format = getFormatById("invalid-bank");
      expect(format).toBeUndefined();
   });

   it("should return format for all known banks", () => {
      const knownBanks = [
         "nubank",
         "itau",
         "bradesco",
         "inter",
         "santander",
         "banco-do-brasil",
         "generic-comma",
         "generic-semicolon",
      ];

      for (const bankId of knownBanks) {
         const format = getFormatById(bankId);
         expect(format).toBeDefined();
         expect(format?.id).toBe(bankId);
      }
   });
});

describe("BANK_FORMATS", () => {
   it("should have all required properties for each format", () => {
      for (const format of BANK_FORMATS) {
         expect(format.id).toBeDefined();
         expect(format.name).toBeDefined();
         expect(format.delimiter).toBeDefined();
         expect(format.dateFormat).toBeDefined();
         expect(format.amountFormat).toBeDefined();
         expect(format.hasHeader).toBeDefined();
         expect(format.columnMapping).toBeDefined();
         expect(format.detectPattern).toBeDefined();
         expect(typeof format.detectPattern).toBe("function");
      }
   });

   it("should have valid column mappings", () => {
      for (const format of BANK_FORMATS) {
         expect(typeof format.columnMapping.date).toBe("number");
         expect(typeof format.columnMapping.amount).toBe("number");
         expect(typeof format.columnMapping.description).toBe("number");
      }
   });

   it("should have valid amount formats", () => {
      for (const format of BANK_FORMATS) {
         expect(["decimal-comma", "decimal-dot"]).toContain(
            format.amountFormat,
         );
      }
   });

   it("should have unique ids", () => {
      const ids = BANK_FORMATS.map((f) => f.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
   });

   it("generic formats should never match via detectPattern", () => {
      const genericComma = BANK_FORMATS.find((f) => f.id === "generic-comma");
      const genericSemicolon = BANK_FORMATS.find(
         (f) => f.id === "generic-semicolon",
      );

      expect(genericComma?.detectPattern(["any", "headers"])).toBe(false);
      expect(genericSemicolon?.detectPattern(["any", "headers"])).toBe(false);
   });
});
