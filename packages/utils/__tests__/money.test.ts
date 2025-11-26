import { describe, expect, it } from "bun:test";
import {
   SUPPORTED_CURRENCIES,
   addMoney,
   calculatePercentage,
   centsToReais,
   compareMoney,
   divideMoney,
   formatAmountWithoutCurrency,
   formatCompactCurrency,
   formatCurrency,
   formatDecimalCurrency,
   getCurrencyInfo,
   isValidCurrency,
   moneyEquals,
   multiplyMoney,
   parseCurrencyToCents,
   reaisToCents,
   roundToCents,
   subtractMoney,
} from "../src/money";

describe("money utilities", () => {
   describe("centsToReais", () => {
      it("should convert cents to reais", () => {
         expect(centsToReais(100)).toBe(1);
         expect(centsToReais(150)).toBe(1.5);
         expect(centsToReais(1000)).toBe(10);
      });

      it("should handle zero", () => {
         expect(centsToReais(0)).toBe(0);
      });

      it("should handle negative values", () => {
         expect(centsToReais(-100)).toBe(-1);
      });
   });

   describe("reaisToCents", () => {
      it("should convert reais to cents", () => {
         expect(reaisToCents(1)).toBe(100);
         expect(reaisToCents(1.5)).toBe(150);
         expect(reaisToCents(10)).toBe(1000);
      });

      it("should handle zero", () => {
         expect(reaisToCents(0)).toBe(0);
      });

      it("should handle negative values", () => {
         expect(reaisToCents(-1)).toBe(-100);
      });

      it("should round floating point errors", () => {
         expect(reaisToCents(1.01)).toBe(101);
      });
   });

   describe("formatCurrency", () => {
      it("should format amount in BRL", () => {
         const result = formatCurrency(10000, "BRL", "pt-BR");
         expect(result).toContain("100");
      });

      it("should handle NaN", () => {
         const result = formatCurrency(Number.NaN);
         expect(result).toBe("");
      });

      it("should handle non-number", () => {
         const result = formatCurrency("invalid" as unknown as number);
         expect(result).toBe("");
      });

      it("should use default currency and locale", () => {
         const result = formatCurrency(10000);
         expect(result).toContain("100");
      });

      it("should handle unknown currency", () => {
         const result = formatCurrency(10000, "XYZ", "en-US");
         expect(typeof result).toBe("string");
      });

      it("should handle zero amount", () => {
         const result = formatCurrency(0);
         expect(result).toContain("0");
      });

      it("should handle negative amounts", () => {
         const result = formatCurrency(-10000);
         expect(result).toContain("100");
      });

      it("should accept custom options", () => {
         const result = formatCurrency(10050, "BRL", "pt-BR", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
         });
         expect(typeof result).toBe("string");
      });
   });

   describe("formatCompactCurrency", () => {
      it("should format compact currency for small amounts", () => {
         const result = formatCompactCurrency(100000, "BRL", "pt-BR");
         expect(typeof result).toBe("string");
      });

      it("should format compact currency for large amounts", () => {
         const result = formatCompactCurrency(100000000, "BRL", "pt-BR");
         expect(typeof result).toBe("string");
      });

      it("should handle NaN", () => {
         const result = formatCompactCurrency(Number.NaN);
         expect(result).toBe("");
      });

      it("should handle non-number", () => {
         const result = formatCompactCurrency("invalid" as unknown as number);
         expect(result).toBe("");
      });

      it("should use default currency and locale", () => {
         const result = formatCompactCurrency(100000);
         expect(typeof result).toBe("string");
      });
   });

   describe("formatDecimalCurrency", () => {
      it("should format decimal amount", () => {
         const result = formatDecimalCurrency(100.5, "BRL", "pt-BR");
         expect(result).toContain("100");
      });

      it("should handle NaN", () => {
         const result = formatDecimalCurrency(Number.NaN);
         expect(result).toBe("");
      });

      it("should handle non-number", () => {
         const result = formatDecimalCurrency("invalid" as unknown as number);
         expect(result).toBe("");
      });

      it("should use default currency and locale", () => {
         const result = formatDecimalCurrency(100);
         expect(typeof result).toBe("string");
      });

      it("should accept custom options", () => {
         const result = formatDecimalCurrency(100.5, "BRL", "pt-BR", {
            maximumFractionDigits: 2,
         });
         expect(typeof result).toBe("string");
      });
   });

   describe("parseCurrencyToCents", () => {
      it("should parse currency string to cents", () => {
         const result = parseCurrencyToCents("100.00");
         expect(result).toBe(10000);
      });

      it("should handle currency symbols", () => {
         const result = parseCurrencyToCents("R$ 100.00");
         expect(result).toBe(10000);
      });

      it("should handle empty string", () => {
         const result = parseCurrencyToCents("");
         expect(result).toBe(null);
      });

      it("should handle whitespace only", () => {
         const result = parseCurrencyToCents("   ");
         expect(result).toBe(null);
      });

      it("should handle invalid string", () => {
         const result = parseCurrencyToCents("abc");
         expect(result).toBe(null);
      });

      it("should handle non-string", () => {
         const result = parseCurrencyToCents(123 as unknown as string);
         expect(result).toBe(null);
      });

      it("should handle decimal amounts", () => {
         const result = parseCurrencyToCents("50.50");
         expect(result).toBe(5050);
      });
   });

   describe("isValidCurrency", () => {
      it("should return true for BRL", () => {
         expect(isValidCurrency("BRL")).toBe(true);
      });

      it("should return true for lowercase brl", () => {
         expect(isValidCurrency("brl")).toBe(true);
      });

      it("should return false for unsupported currency", () => {
         expect(isValidCurrency("XYZ")).toBe(false);
      });
   });

   describe("getCurrencyInfo", () => {
      it("should return info for BRL", () => {
         const result = getCurrencyInfo("BRL");
         expect(result).not.toBeNull();
         expect(result?.code).toBe("BRL");
         expect(result?.symbol).toBe("R$");
         expect(result?.decimalDigits).toBe(2);
      });

      it("should return info for lowercase brl", () => {
         const result = getCurrencyInfo("brl");
         expect(result).not.toBeNull();
      });

      it("should return null for unsupported currency", () => {
         const result = getCurrencyInfo("XYZ");
         expect(result).toBeNull();
      });
   });

   describe("addMoney", () => {
      it("should add two amounts", () => {
         expect(addMoney(100, 200)).toBe(300);
      });

      it("should handle decimals", () => {
         expect(addMoney(100.5, 200.5)).toBe(301);
      });

      it("should handle negative amounts", () => {
         expect(addMoney(100, -50)).toBe(50);
      });
   });

   describe("subtractMoney", () => {
      it("should subtract two amounts", () => {
         expect(subtractMoney(200, 100)).toBe(100);
      });

      it("should handle decimals", () => {
         expect(subtractMoney(200.5, 100.5)).toBe(100);
      });

      it("should handle negative results", () => {
         expect(subtractMoney(100, 200)).toBe(-100);
      });
   });

   describe("multiplyMoney", () => {
      it("should multiply amount by factor", () => {
         expect(multiplyMoney(100, 2)).toBe(200);
      });

      it("should handle decimal factors", () => {
         expect(multiplyMoney(100, 0.5)).toBe(50);
      });

      it("should handle zero factor", () => {
         expect(multiplyMoney(100, 0)).toBe(0);
      });
   });

   describe("divideMoney", () => {
      it("should divide amount by divisor", () => {
         expect(divideMoney(200, 2)).toBe(100);
      });

      it("should handle decimal divisors", () => {
         expect(divideMoney(100, 0.5)).toBe(200);
      });

      it("should throw for division by zero", () => {
         expect(() => divideMoney(100, 0)).toThrow("Cannot divide by zero");
      });
   });

   describe("calculatePercentage", () => {
      it("should calculate percentage of amount", () => {
         expect(calculatePercentage(1000, 10)).toBe(100);
      });

      it("should handle 100%", () => {
         expect(calculatePercentage(1000, 100)).toBe(1000);
      });

      it("should handle 0%", () => {
         expect(calculatePercentage(1000, 0)).toBe(0);
      });

      it("should handle decimal percentages", () => {
         expect(calculatePercentage(1000, 2.5)).toBe(25);
      });
   });

   describe("roundToCents", () => {
      it("should round to cents", () => {
         expect(roundToCents(100.456)).toBe(100.46);
      });

      it("should handle already rounded values", () => {
         expect(roundToCents(100.5)).toBe(100.5);
      });

      it("should handle negative values", () => {
         expect(roundToCents(-100.456)).toBe(-100.46);
      });
   });

   describe("compareMoney", () => {
      it("should return -1 when first is less", () => {
         expect(compareMoney(100, 200)).toBe(-1);
      });

      it("should return 1 when first is greater", () => {
         expect(compareMoney(200, 100)).toBe(1);
      });

      it("should return 0 when equal", () => {
         expect(compareMoney(100, 100)).toBe(0);
      });
   });

   describe("moneyEquals", () => {
      it("should return true for equal amounts", () => {
         expect(moneyEquals(100, 100)).toBe(true);
      });

      it("should return false for different amounts", () => {
         expect(moneyEquals(100, 200)).toBe(false);
      });
   });

   describe("formatAmountWithoutCurrency", () => {
      it("should format amount without currency symbol", () => {
         const result = formatAmountWithoutCurrency(10000, "BRL", "pt-BR");
         expect(result).not.toContain("R$");
         expect(result).toContain("100");
      });

      it("should use default currency and locale", () => {
         const result = formatAmountWithoutCurrency(10000);
         expect(typeof result).toBe("string");
      });

      it("should handle unknown currency", () => {
         const result = formatAmountWithoutCurrency(10000, "XYZ", "en-US");
         expect(typeof result).toBe("string");
      });
   });

   describe("SUPPORTED_CURRENCIES", () => {
      it("should have BRL defined", () => {
         const brl = SUPPORTED_CURRENCIES.BRL;
         expect(brl).toBeDefined();
         if (brl) {
            expect(brl.code).toBe("BRL");
            expect(brl.symbol).toBe("R$");
            expect(brl.decimalDigits).toBe(2);
            expect(brl.name).toBe("Brazilian Real");
         }
      });
   });
});
