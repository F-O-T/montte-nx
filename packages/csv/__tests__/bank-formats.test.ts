import { describe, expect, it } from "bun:test";
import {
	BANK_FORMATS,
	detectBankFormat,
	detectDelimiter,
	getAvailableFormats,
	getFormatById,
	suggestColumnMapping,
} from "../src/bank-formats";

describe("detectDelimiter", () => {
	describe("basic detection", () => {
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

	describe("edge cases", () => {
		it("should only analyze first line", () => {
			const content = "A,B,C\nD;E;F;G;H";
			expect(detectDelimiter(content)).toBe(",");
		});

		it("should handle single column", () => {
			const content = "SingleColumn\nValue1\nValue2";
			expect(detectDelimiter(content)).toBe(",");
		});

		it("should handle content with only newlines", () => {
			expect(detectDelimiter("\n\n\n")).toBe(",");
		});
	});
});

describe("detectBankFormat", () => {
	describe("Nubank", () => {
		it("should detect Nubank format with Portuguese headers", () => {
			const headers = ["Data", "Descrição", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
			expect(format?.delimiter).toBe(",");
		});

		it("should detect Nubank format with English headers", () => {
			const headers = ["Date", "Description", "Amount"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
		});

		it("should detect Nubank format with uppercase headers", () => {
			const headers = ["DATA", "DESCRIÇÃO", "VALOR"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
		});

		it("should detect Nubank format with lowercase headers", () => {
			const headers = ["data", "descrição", "valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
		});

		it("should have correct column mapping", () => {
			const headers = ["Data", "Descrição", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.columnMapping).toEqual({
				date: 0,
				description: 1,
				amount: 2,
			});
		});
	});

	describe("Itaú", () => {
		it("should detect Itaú format with lancamento", () => {
			const headers = ["Data", "Lançamento", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("itau");
			expect(format?.delimiter).toBe(";");
		});

		it("should detect Itaú format with data lancamento combined", () => {
			const headers = ["Data Lançamento", "Histórico", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("itau");
		});

		it("should handle Itaú without accents", () => {
			const headers = ["Data", "Lancamento", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("itau");
		});
	});

	describe("Bradesco", () => {
		it("should detect Bradesco format with data mov", () => {
			const headers = ["Data Mov", "Histórico", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("bradesco");
			expect(format?.delimiter).toBe(";");
		});

		it("should detect Bradesco format with data and historico", () => {
			const headers = ["Data", "Histórico", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("bradesco");
		});

		it("should detect Bradesco without accents", () => {
			const headers = ["Data", "Historico", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("bradesco");
		});
	});

	describe("Banco Inter", () => {
		it("should match Itaú before Inter for data lancamento with tipo", () => {
			const headers = ["Data Lançamento", "Tipo", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("itau");
		});

		it("should match Nubank before Inter for generic data/descricao/valor", () => {
			const headers = ["Data", "Descrição", "Valor", "Saldo"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
		});
	});

	describe("Santander", () => {
		it("should require all four headers to match uniquely", () => {
			// Santander requires "data" + "descricao" + "valor" + "saldo"
			// But Nubank matches first with just "data" + "descricao" + "valor"
			const headers = ["Data", "Descrição", "Valor", "Saldo"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank"); // Nubank matches first
		});
	});

	describe("Banco do Brasil", () => {
		it("should match Bradesco for similar patterns", () => {
			// BB requires documento column, but Bradesco matches historico first
			const headers = ["Data", "Histórico", "Documento", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("bradesco");
		});
	});

	describe("C6 Bank", () => {
		it("should detect C6 when c6 keyword is present", () => {
			const headers = ["Data", "Descrição C6", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("c6");
		});

		it("should not match C6 without c6 keyword", () => {
			const headers = ["Data", "Descrição", "Valor"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank"); // Falls through to Nubank
		});
	});

	describe("unknown format", () => {
		it("should return null for unrecognized headers", () => {
			const headers = ["Column1", "Column2", "Column3"];
			expect(detectBankFormat(headers)).toBeNull();
		});

		it("should return null for empty headers", () => {
			expect(detectBankFormat([])).toBeNull();
		});

		it("should return null for single column", () => {
			expect(detectBankFormat(["Data"])).toBeNull();
		});
	});

	describe("normalization", () => {
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

		it("should strip accents for matching", () => {
			const headers = ["Dátá", "Descríçãó", "Válór"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
		});

		it("should handle mixed case and accents", () => {
			const headers = ["DaTa", "DeScRiÇãO", "VaLoR"];
			const format = detectBankFormat(headers);
			expect(format?.id).toBe("nubank");
		});
	});
});

describe("suggestColumnMapping", () => {
	describe("Portuguese headers", () => {
		it("should suggest mapping for standard Portuguese headers", () => {
			const headers = ["Data", "Descrição", "Valor"];
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
	});

	describe("English headers", () => {
		it("should suggest mapping for standard English headers", () => {
			const headers = ["Date", "Description", "Amount"];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.date).toBe(0);
			expect(mapping.description).toBe(1);
			expect(mapping.amount).toBe(2);
		});

		it("should handle value as amount", () => {
			const headers = ["Date", "Description", "Value"];
			const mapping = suggestColumnMapping(headers);
			expect(mapping.amount).toBe(2);
		});

		it("should handle memo as description", () => {
			const headers = ["Date", "Memo", "Amount"];
			const mapping = suggestColumnMapping(headers);
			expect(mapping.description).toBe(1);
		});
	});

	describe("abbreviations", () => {
		it("should handle DT as date abbreviation", () => {
			const headers = ["DT", "Desc", "Valor"];
			const mapping = suggestColumnMapping(headers);
			expect(mapping.date).toBe(0);
		});

		it("should handle VL as amount abbreviation", () => {
			const headers = ["Data", "Desc", "VL"];
			const mapping = suggestColumnMapping(headers);
			expect(mapping.amount).toBe(2);
		});

		it("should handle multiple abbreviations", () => {
			const headers = ["DT", "Memo", "VL"];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.date).toBe(0);
			expect(mapping.description).toBe(1);
			expect(mapping.amount).toBe(2);
		});
	});

	describe("mixed order", () => {
		it("should handle columns in different order", () => {
			const headers = ["Amount", "Date", "Description"];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.amount).toBe(0);
			expect(mapping.date).toBe(1);
			expect(mapping.description).toBe(2);
		});

		it("should handle value before date", () => {
			const headers = ["Valor", "Data", "Descrição"];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.amount).toBe(0);
			expect(mapping.date).toBe(1);
			expect(mapping.description).toBe(2);
		});
	});

	describe("unknown headers", () => {
		it("should return null for columns not found", () => {
			const headers = ["Col1", "Col2", "Col3"];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.date).toBeNull();
			expect(mapping.description).toBeNull();
			expect(mapping.amount).toBeNull();
		});

		it("should return partial mapping when only some columns match", () => {
			const headers = ["Data", "Unknown", "Col3"];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.date).toBe(0);
			expect(mapping.description).toBeNull();
			expect(mapping.amount).toBeNull();
		});
	});

	describe("normalization", () => {
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

		it("should handle whitespace", () => {
			const headers = ["  Data  ", "  Descrição  ", "  Valor  "];
			const mapping = suggestColumnMapping(headers);

			expect(mapping.date).toBe(0);
			expect(mapping.description).toBe(1);
			expect(mapping.amount).toBe(2);
		});
	});

	describe("first match wins", () => {
		it("should use first matching column for date", () => {
			const headers = ["Data1", "Data2", "Valor"];
			const mapping = suggestColumnMapping(headers);
			expect(mapping.date).toBe(0);
		});

		it("should use first matching column for amount", () => {
			const headers = ["Data", "Valor1", "Valor2"];
			const mapping = suggestColumnMapping(headers);
			expect(mapping.amount).toBe(1);
		});
	});
});

describe("getAvailableFormats", () => {
	it("should return all available formats", () => {
		const formats = getAvailableFormats();

		expect(formats.length).toBe(BANK_FORMATS.length);
		expect(formats.every((f) => f.id && f.name)).toBe(true);
	});

	it("should include all known banks", () => {
		const formats = getAvailableFormats();
		const ids = formats.map((f) => f.id);

		expect(ids).toContain("nubank");
		expect(ids).toContain("itau");
		expect(ids).toContain("bradesco");
		expect(ids).toContain("inter");
		expect(ids).toContain("santander");
		expect(ids).toContain("banco-do-brasil");
		expect(ids).toContain("c6");
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

	it("should return full format object with all properties", () => {
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
		expect(typeof format?.detectPattern).toBe("function");
	});

	it("should return undefined for invalid id", () => {
		expect(getFormatById("invalid-bank")).toBeUndefined();
	});

	it("should return undefined for empty id", () => {
		expect(getFormatById("")).toBeUndefined();
	});

	it("should return format for all known banks", () => {
		const knownBanks = [
			"nubank",
			"itau",
			"bradesco",
			"inter",
			"santander",
			"banco-do-brasil",
			"c6",
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
	describe("structure validation", () => {
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
				expect(format.columnMapping.date).toBeGreaterThanOrEqual(0);
				expect(format.columnMapping.amount).toBeGreaterThanOrEqual(0);
				expect(format.columnMapping.description).toBeGreaterThanOrEqual(0);
			}
		});

		it("should have valid amount formats", () => {
			for (const format of BANK_FORMATS) {
				expect(["decimal-comma", "decimal-dot"]).toContain(format.amountFormat);
			}
		});

		it("should have valid delimiters", () => {
			for (const format of BANK_FORMATS) {
				expect([",", ";", "\t", "|"]).toContain(format.delimiter);
			}
		});

		it("should have unique ids", () => {
			const ids = BANK_FORMATS.map((f) => f.id);
			const uniqueIds = [...new Set(ids)];
			expect(ids.length).toBe(uniqueIds.length);
		});
	});

	describe("generic formats", () => {
		it("generic-comma should never match via detectPattern", () => {
			const genericComma = BANK_FORMATS.find((f) => f.id === "generic-comma");
			expect(genericComma?.detectPattern(["any", "headers"])).toBe(false);
			expect(genericComma?.detectPattern(["Data", "Valor"])).toBe(false);
		});

		it("generic-semicolon should never match via detectPattern", () => {
			const genericSemicolon = BANK_FORMATS.find(
				(f) => f.id === "generic-semicolon",
			);
			expect(genericSemicolon?.detectPattern(["any", "headers"])).toBe(false);
			expect(genericSemicolon?.detectPattern(["Data", "Valor"])).toBe(false);
		});

		it("generic formats should have correct delimiters", () => {
			const genericComma = getFormatById("generic-comma");
			const genericSemicolon = getFormatById("generic-semicolon");

			expect(genericComma?.delimiter).toBe(",");
			expect(genericSemicolon?.delimiter).toBe(";");
		});
	});

	describe("Brazilian bank defaults", () => {
		it("all Brazilian banks should use decimal-comma format", () => {
			const brazilianBanks = ["nubank", "itau", "bradesco", "inter", "santander", "banco-do-brasil", "c6"];

			for (const bankId of brazilianBanks) {
				const format = getFormatById(bankId);
				expect(format?.amountFormat).toBe("decimal-comma");
			}
		});

		it("all Brazilian banks should use DD/MM/YYYY date format", () => {
			const brazilianBanks = ["nubank", "itau", "bradesco", "inter", "santander", "banco-do-brasil", "c6"];

			for (const bankId of brazilianBanks) {
				const format = getFormatById(bankId);
				expect(format?.dateFormat).toBe("DD/MM/YYYY");
			}
		});

		it("all formats should have headers", () => {
			for (const format of BANK_FORMATS) {
				expect(format.hasHeader).toBe(true);
			}
		});
	});
});
