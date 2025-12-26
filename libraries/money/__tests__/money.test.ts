import { afterAll, describe, expect, test } from "bun:test";
import {
   AllocationRatiosSchema,
   absolute,
   add,
   allocate,
   assertAllSameCurrency,
   assertSameCurrency,
   average,
   CurrencyCodeSchema,
   CurrencyMismatchError,
   clearCustomCurrencies,
   compare,
   DivisionByZeroError,
   deserialize,
   divide,
   equals,
   FormatOptionsSchema,
   format,
   formatAmount,
   formatCompact,
   fromDatabase,
   fromJSON,
   fromMajorUnits,
   fromMinorUnits,
   getAllCurrencies,
   getCurrency,
   greaterThan,
   greaterThanOrEqual,
   hasCurrency,
   InvalidAmountError,
   isNegative,
   isPositive,
   isZero,
   lessThan,
   lessThanOrEqual,
   MoneySchema,
   max,
   median,
   min,
   multiply,
   negate,
   OverflowError,
   of,
   ofRounded,
   parse,
   percentage,
   registerCurrency,
   ScaleMismatchError,
   serialize,
   split,
   subtract,
   sum,
   sumOrZero,
   toDatabase,
   toDecimal,
   toJSON,
   toMajorUnits,
   toMajorUnitsString,
   toMinorUnits,
   toMinorUnitsBigInt,
   toMinorUnitsString,
   UnknownCurrencyError,
   zero,
} from "../src/index";

// =============================================================================
// Factory Functions
// =============================================================================

describe("Factory Functions", () => {
   describe("of", () => {
      test("creates money from string", () => {
         const money = of("123.45", "USD");
         expect(money.amount).toBe(12345n);
         expect(money.currency).toBe("USD");
         expect(money.scale).toBe(2);
      });

      test("creates money from number", () => {
         const money = of(123.45, "USD");
         expect(money.amount).toBe(12345n);
      });

      test("handles zero decimal currencies (JPY)", () => {
         const money = of("1234", "JPY");
         expect(money.amount).toBe(1234n);
         expect(money.scale).toBe(0);
      });

      test("handles three decimal currencies (KWD)", () => {
         const money = of("1.234", "KWD");
         expect(money.amount).toBe(1234n);
         expect(money.scale).toBe(3);
      });

      test("handles negative amounts", () => {
         const money = of("-50.00", "USD");
         expect(money.amount).toBe(-5000n);
      });

      test("handles case-insensitive currency codes", () => {
         const money = of("100", "usd");
         expect(money.currency).toBe("USD");
      });

      test("truncates excess decimal places", () => {
         const money = of("10.999", "USD");
         expect(money.amount).toBe(1099n); // Truncated, not rounded
      });

      test("rounds when rounding mode is 'round'", () => {
         expect(of("10.999", "USD", "round").amount).toBe(1100n);
         expect(of("10.994", "USD", "round").amount).toBe(1099n);
      });

      test("uses banker's rounding when mode is 'round'", () => {
         // Exactly .995 rounds to even
         expect(of("10.995", "USD", "round").amount).toBe(1100n); // → 11.00 (even)
         expect(of("11.995", "USD", "round").amount).toBe(1200n); // → 12.00 (even)
         expect(of("10.985", "USD", "round").amount).toBe(1098n); // → 10.98 (even)
      });
   });

   describe("ofRounded", () => {
      test("rounds excess decimal places", () => {
         expect(ofRounded("10.999", "USD").amount).toBe(1100n);
         expect(ofRounded("10.994", "USD").amount).toBe(1099n);
      });

      test("uses banker's rounding", () => {
         expect(ofRounded("10.995", "USD").amount).toBe(1100n);
         expect(ofRounded("10.985", "USD").amount).toBe(1098n);
      });

      test("works with different currencies", () => {
         expect(ofRounded("10.9", "JPY").amount).toBe(11n);
         // KWD has 3 decimal places. 1.2345 → 1234.5 rounds to 1234 (even)
         expect(ofRounded("1.2345", "KWD").amount).toBe(1234n);
         // 1.2355 → 1235.5 rounds to 1236 (even)
         expect(ofRounded("1.2355", "KWD").amount).toBe(1236n);
      });
   });

   describe("fromMinorUnits", () => {
      test("creates money from cents", () => {
         const money = fromMinorUnits(12345, "USD");
         expect(money.amount).toBe(12345n);
      });

      test("creates money from bigint", () => {
         const money = fromMinorUnits(12345n, "USD");
         expect(money.amount).toBe(12345n);
      });

      test("throws on non-integer number", () => {
         expect(() => fromMinorUnits(123.45, "USD")).toThrow(
            InvalidAmountError,
         );
      });

      test("throws on infinite number", () => {
         expect(() => fromMinorUnits(Infinity, "USD")).toThrow(
            InvalidAmountError,
         );
      });
   });

   describe("fromMajorUnits", () => {
      test("is an alias for of", () => {
         const a = of("123.45", "USD");
         const b = fromMajorUnits("123.45", "USD");
         expect(equals(a, b)).toBe(true);
      });
   });

   describe("zero", () => {
      test("creates zero money", () => {
         const money = zero("USD");
         expect(money.amount).toBe(0n);
         expect(money.currency).toBe("USD");
      });
   });
});

// =============================================================================
// Arithmetic Operations
// =============================================================================

describe("Arithmetic Operations", () => {
   describe("add", () => {
      test("adds two money values", () => {
         const a = of("10.50", "USD");
         const b = of("5.25", "USD");
         const result = add(a, b);
         expect(result.amount).toBe(1575n);
      });

      test("throws on currency mismatch", () => {
         const a = of("10.00", "USD");
         const b = of("10.00", "EUR");
         expect(() => add(a, b)).toThrow(CurrencyMismatchError);
      });

      test("handles negative values", () => {
         const a = of("10.00", "USD");
         const b = of("-5.00", "USD");
         expect(add(a, b).amount).toBe(500n);
      });
   });

   describe("subtract", () => {
      test("subtracts money values", () => {
         const a = of("10.50", "USD");
         const b = of("5.25", "USD");
         const result = subtract(a, b);
         expect(result.amount).toBe(525n);
      });

      test("allows negative results", () => {
         const a = of("5.00", "USD");
         const b = of("10.00", "USD");
         const result = subtract(a, b);
         expect(result.amount).toBe(-500n);
      });
   });

   describe("multiply", () => {
      test("multiplies by integer", () => {
         const money = of("10.00", "USD");
         const result = multiply(money, 3);
         expect(result.amount).toBe(3000n);
      });

      test("multiplies by decimal", () => {
         const money = of("10.00", "USD");
         const result = multiply(money, 1.5);
         expect(result.amount).toBe(1500n);
      });

      test("multiplies by string for precision", () => {
         const money = of("10.00", "USD");
         const result = multiply(money, "1.5");
         expect(result.amount).toBe(1500n);
      });

      test("multiplies by zero", () => {
         const money = of("10.00", "USD");
         const result = multiply(money, 0);
         expect(result.amount).toBe(0n);
      });

      test("multiplies negative", () => {
         const money = of("10.00", "USD");
         const result = multiply(money, -2);
         expect(result.amount).toBe(-2000n);
      });
   });

   describe("divide", () => {
      test("divides evenly", () => {
         const money = of("100.00", "USD");
         const result = divide(money, 4);
         expect(result.amount).toBe(2500n);
      });

      test("uses banker's rounding", () => {
         const money = of("10.00", "USD");
         const result = divide(money, 3);
         // 10.00 / 3 = 3.333... rounds to 3.33
         expect(result.amount).toBe(333n);
      });

      test("throws on division by zero", () => {
         const money = of("10.00", "USD");
         expect(() => divide(money, 0)).toThrow(DivisionByZeroError);
      });

      test("divides by string", () => {
         const money = of("100.00", "USD");
         const result = divide(money, "4");
         expect(result.amount).toBe(2500n);
      });
   });

   describe("percentage", () => {
      test("calculates percentage", () => {
         const money = of("100.00", "USD");
         const result = percentage(money, 15);
         expect(result.amount).toBe(1500n);
      });

      test("handles decimal percentages", () => {
         const money = of("200.00", "USD");
         const result = percentage(money, 7.5);
         expect(result.amount).toBe(1500n);
      });

      test("handles 0%", () => {
         const money = of("100.00", "USD");
         const result = percentage(money, 0);
         expect(result.amount).toBe(0n);
      });

      test("handles 100%", () => {
         const money = of("100.00", "USD");
         const result = percentage(money, 100);
         expect(result.amount).toBe(10000n);
      });
   });

   describe("negate", () => {
      test("negates positive", () => {
         const money = of("10.00", "USD");
         const result = negate(money);
         expect(result.amount).toBe(-1000n);
      });

      test("negates negative", () => {
         const money = of("-10.00", "USD");
         const result = negate(money);
         expect(result.amount).toBe(1000n);
      });

      test("negates zero", () => {
         const money = zero("USD");
         const result = negate(money);
         expect(result.amount).toBe(0n);
      });
   });

   describe("absolute", () => {
      test("keeps positive", () => {
         const money = of("10.00", "USD");
         const result = absolute(money);
         expect(result.amount).toBe(1000n);
      });

      test("makes negative positive", () => {
         const money = of("-10.00", "USD");
         const result = absolute(money);
         expect(result.amount).toBe(1000n);
      });
   });
});

// =============================================================================
// Comparison Operations
// =============================================================================

describe("Comparison Operations", () => {
   describe("equals", () => {
      test("returns true for equal values", () => {
         const a = of("10.00", "USD");
         const b = of("10.00", "USD");
         expect(equals(a, b)).toBe(true);
      });

      test("returns false for different values", () => {
         const a = of("10.00", "USD");
         const b = of("20.00", "USD");
         expect(equals(a, b)).toBe(false);
      });

      test("throws on currency mismatch", () => {
         const a = of("10.00", "USD");
         const b = of("10.00", "EUR");
         expect(() => equals(a, b)).toThrow(CurrencyMismatchError);
      });
   });

   describe("greaterThan", () => {
      test("returns true when a > b", () => {
         expect(greaterThan(of("20.00", "USD"), of("10.00", "USD"))).toBe(true);
      });

      test("returns false when a <= b", () => {
         expect(greaterThan(of("10.00", "USD"), of("20.00", "USD"))).toBe(
            false,
         );
         expect(greaterThan(of("10.00", "USD"), of("10.00", "USD"))).toBe(
            false,
         );
      });
   });

   describe("greaterThanOrEqual", () => {
      test("returns true when a >= b", () => {
         expect(
            greaterThanOrEqual(of("20.00", "USD"), of("10.00", "USD")),
         ).toBe(true);
         expect(
            greaterThanOrEqual(of("10.00", "USD"), of("10.00", "USD")),
         ).toBe(true);
      });

      test("returns false when a < b", () => {
         expect(
            greaterThanOrEqual(of("10.00", "USD"), of("20.00", "USD")),
         ).toBe(false);
      });
   });

   describe("lessThan", () => {
      test("returns true when a < b", () => {
         expect(lessThan(of("10.00", "USD"), of("20.00", "USD"))).toBe(true);
      });

      test("returns false when a >= b", () => {
         expect(lessThan(of("20.00", "USD"), of("10.00", "USD"))).toBe(false);
         expect(lessThan(of("10.00", "USD"), of("10.00", "USD"))).toBe(false);
      });
   });

   describe("lessThanOrEqual", () => {
      test("returns true when a <= b", () => {
         expect(lessThanOrEqual(of("10.00", "USD"), of("20.00", "USD"))).toBe(
            true,
         );
         expect(lessThanOrEqual(of("10.00", "USD"), of("10.00", "USD"))).toBe(
            true,
         );
      });

      test("returns false when a > b", () => {
         expect(lessThanOrEqual(of("20.00", "USD"), of("10.00", "USD"))).toBe(
            false,
         );
      });
   });

   describe("isPositive", () => {
      test("returns true for positive", () => {
         expect(isPositive(of("10.00", "USD"))).toBe(true);
      });

      test("returns false for negative", () => {
         expect(isPositive(of("-10.00", "USD"))).toBe(false);
      });

      test("returns false for zero", () => {
         expect(isPositive(of("0.00", "USD"))).toBe(false);
      });
   });

   describe("isNegative", () => {
      test("returns true for negative", () => {
         expect(isNegative(of("-10.00", "USD"))).toBe(true);
      });

      test("returns false for positive", () => {
         expect(isNegative(of("10.00", "USD"))).toBe(false);
      });

      test("returns false for zero", () => {
         expect(isNegative(of("0.00", "USD"))).toBe(false);
      });
   });

   describe("isZero", () => {
      test("returns true for zero", () => {
         expect(isZero(of("0.00", "USD"))).toBe(true);
      });

      test("returns false for non-zero", () => {
         expect(isZero(of("10.00", "USD"))).toBe(false);
         expect(isZero(of("-10.00", "USD"))).toBe(false);
      });
   });

   describe("compare", () => {
      test("returns -1 when a < b", () => {
         expect(compare(of("10.00", "USD"), of("20.00", "USD"))).toBe(-1);
      });

      test("returns 0 when a === b", () => {
         expect(compare(of("10.00", "USD"), of("10.00", "USD"))).toBe(0);
      });

      test("returns 1 when a > b", () => {
         expect(compare(of("20.00", "USD"), of("10.00", "USD"))).toBe(1);
      });
   });
});

// =============================================================================
// Allocation
// =============================================================================

describe("Allocation", () => {
   describe("allocate", () => {
      test("allocates evenly divisible amount", () => {
         const money = of("100.00", "USD");
         const result = allocate(money, [60, 25, 15]);
         expect(result[0]?.amount).toBe(6000n);
         expect(result[1]?.amount).toBe(2500n);
         expect(result[2]?.amount).toBe(1500n);
      });

      test("allocates with remainder using largest remainder method", () => {
         const money = of("100.00", "USD");
         const result = allocate(money, [1, 1, 1]);
         // 100 / 3 = 33.33... each, remainder distributed
         const total = result.reduce((acc, m) => acc + m.amount, 0n);
         expect(total).toBe(10000n); // Sum must equal original
      });

      test("allocates prime number correctly", () => {
         const money = of("7.00", "USD");
         const result = allocate(money, [1, 1, 1]);
         const amounts = result.map((m) => m.amount);
         expect(amounts.reduce((a, b) => a + b, 0n)).toBe(700n);
      });

      test("handles zero ratio", () => {
         const money = of("100.00", "USD");
         const result = allocate(money, [100, 0]);
         expect(result[0]?.amount).toBe(10000n);
         expect(result[1]?.amount).toBe(0n);
      });

      test("handles single ratio", () => {
         const money = of("100.00", "USD");
         const result = allocate(money, [1]);
         expect(result.length).toBe(1);
         expect(result[0]?.amount).toBe(10000n);
      });

      test("throws on empty ratios", () => {
         expect(() => allocate(of("100.00", "USD"), [])).toThrow(
            InvalidAmountError,
         );
      });

      test("throws on negative ratios", () => {
         expect(() => allocate(of("100.00", "USD"), [-1, 1])).toThrow(
            InvalidAmountError,
         );
      });

      test("throws on all-zero ratios", () => {
         expect(() => allocate(of("100.00", "USD"), [0, 0])).toThrow(
            InvalidAmountError,
         );
      });

      test("handles very small ratios", () => {
         const money = of("100.00", "USD");
         const result = allocate(money, [0.0001, 0.0001, 0.9998]);
         const total = result.reduce((acc, m) => acc + m.amount, 0n);
         expect(total).toBe(10000n);
         // Most should go to the large ratio
         expect((result[2] as { amount: bigint }).amount).toBeGreaterThan(
            9990n,
         );
      });

      test("handles very large ratios", () => {
         const money = of("1000000.00", "USD");
         const result = allocate(money, [1000000, 1000000, 1000000]);
         const total = result.reduce((acc, m) => acc + m.amount, 0n);
         expect(total).toBe(100000000n);
      });

      test("handles mixed magnitude ratios", () => {
         const money = of("1000.00", "USD");
         const result = allocate(money, [0.01, 100, 0.01]);
         const total = result.reduce((acc, m) => acc + m.amount, 0n);
         expect(total).toBe(100000n);
         // Middle ratio dominates
         expect((result[1] as { amount: bigint }).amount).toBeGreaterThan(
            99900n,
         );
      });
   });

   describe("split", () => {
      test("splits evenly", () => {
         const money = of("100.00", "USD");
         const result = split(money, 4);
         expect(result.length).toBe(4);
         const total = result.reduce((acc, m) => acc + m.amount, 0n);
         expect(total).toBe(10000n);
      });

      test("splits with remainder", () => {
         const money = of("100.00", "USD");
         const result = split(money, 3);
         expect(result.length).toBe(3);
         const total = result.reduce((acc, m) => acc + m.amount, 0n);
         expect(total).toBe(10000n);
      });

      test("throws on invalid count", () => {
         expect(() => split(of("100.00", "USD"), 0)).toThrow(
            InvalidAmountError,
         );
         expect(() => split(of("100.00", "USD"), -1)).toThrow(
            InvalidAmountError,
         );
         expect(() => split(of("100.00", "USD"), 1.5)).toThrow(
            InvalidAmountError,
         );
      });
   });
});

// =============================================================================
// Aggregation
// =============================================================================

describe("Aggregation", () => {
   describe("sum", () => {
      test("sums array of money", () => {
         const moneys = [
            of("10.00", "USD"),
            of("20.00", "USD"),
            of("30.00", "USD"),
         ];
         const result = sum(moneys);
         expect(result.amount).toBe(6000n);
      });

      test("throws on empty array", () => {
         expect(() => sum([])).toThrow(InvalidAmountError);
      });

      test("throws on currency mismatch", () => {
         const moneys = [of("10.00", "USD"), of("10.00", "EUR")];
         expect(() => sum(moneys)).toThrow(CurrencyMismatchError);
      });
   });

   describe("sumOrZero", () => {
      test("sums array of money", () => {
         const moneys = [of("10.00", "USD")];
         const result = sumOrZero(moneys, "USD");
         expect(result.amount).toBe(1000n);
      });

      test("returns zero for empty array", () => {
         const result = sumOrZero([], "USD");
         expect(result.amount).toBe(0n);
         expect(result.currency).toBe("USD");
      });
   });

   describe("min", () => {
      test("finds minimum", () => {
         const moneys = [
            of("10.00", "USD"),
            of("5.00", "USD"),
            of("20.00", "USD"),
         ];
         const result = min(moneys);
         expect(result.amount).toBe(500n);
      });

      test("throws on empty array", () => {
         expect(() => min([])).toThrow(InvalidAmountError);
      });
   });

   describe("max", () => {
      test("finds maximum", () => {
         const moneys = [
            of("10.00", "USD"),
            of("5.00", "USD"),
            of("20.00", "USD"),
         ];
         const result = max(moneys);
         expect(result.amount).toBe(2000n);
      });

      test("throws on empty array", () => {
         expect(() => max([])).toThrow(InvalidAmountError);
      });
   });

   describe("average", () => {
      test("calculates average", () => {
         const moneys = [
            of("10.00", "USD"),
            of("20.00", "USD"),
            of("30.00", "USD"),
         ];
         const result = average(moneys);
         expect(result.amount).toBe(2000n);
      });

      test("uses banker's rounding", () => {
         const moneys = [of("1.00", "USD"), of("2.00", "USD")];
         const result = average(moneys);
         expect(result.amount).toBe(150n); // 1.50
      });

      test("throws on empty array", () => {
         expect(() => average([])).toThrow(InvalidAmountError);
      });
   });

   describe("median", () => {
      test("finds median of odd-length array", () => {
         const moneys = [
            of("1.00", "USD"),
            of("2.00", "USD"),
            of("3.00", "USD"),
         ];
         const result = median(moneys);
         expect(result.amount).toBe(200n);
      });

      test("finds median of even-length array", () => {
         const moneys = [
            of("1.00", "USD"),
            of("2.00", "USD"),
            of("3.00", "USD"),
            of("4.00", "USD"),
         ];
         const result = median(moneys);
         expect(result.amount).toBe(250n); // average of 2 and 3
      });

      test("throws on empty array", () => {
         expect(() => median([])).toThrow(InvalidAmountError);
      });
   });
});

// =============================================================================
// Formatting
// =============================================================================

describe("Formatting", () => {
   describe("format", () => {
      test("formats with default locale", () => {
         const money = of("1234.56", "USD");
         const result = format(money, "en-US");
         expect(result).toContain("1,234.56");
      });

      test("formats with Brazilian locale", () => {
         const money = of("1234.56", "BRL");
         const result = format(money, "pt-BR");
         expect(result).toContain("1.234,56");
      });

      test("formats zero decimal currency", () => {
         const money = of("1234", "JPY");
         const result = format(money, "ja-JP");
         expect(result).toContain("1,234");
      });

      test("respects hideSymbol option", () => {
         const money = of("1234.56", "USD");
         const result = format(money, "en-US", { hideSymbol: true });
         expect(result).not.toContain("$");
         expect(result).toContain("1,234.56");
      });

      test("formats very large amounts without precision loss", () => {
         const money = of("999999999999999.99", "USD");
         const result = format(money, "en-US");
         // Should contain the full number without precision loss
         expect(result).toContain("999,999,999,999,999.99");
      });

      test("formats large amounts with hideSymbol", () => {
         const money = of("999999999999999.99", "USD");
         const result = format(money, "en-US", { hideSymbol: true });
         expect(result).not.toContain("$");
         expect(result).toContain("999,999,999,999,999.99");
      });
   });

   describe("formatCompact", () => {
      test("formats in compact notation", () => {
         const money = of("1234567.89", "USD");
         const result = formatCompact(money, "en-US");
         // Should contain something like "1.2M" or "1M"
         expect(result.length).toBeLessThan(15);
      });
   });

   describe("formatAmount", () => {
      test("formats without currency symbol", () => {
         const money = of("1234.56", "USD");
         const result = formatAmount(money, "en-US");
         expect(result).not.toContain("$");
      });
   });

   describe("toDecimal", () => {
      test("converts to decimal string", () => {
         expect(toDecimal(of("123.45", "USD"))).toBe("123.45");
      });

      test("includes leading zero", () => {
         expect(toDecimal(of("0.45", "USD"))).toBe("0.45");
      });

      test("handles zero decimal currency", () => {
         expect(toDecimal(of("1234", "JPY"))).toBe("1234");
      });

      test("handles negative amounts", () => {
         expect(toDecimal(of("-123.45", "USD"))).toBe("-123.45");
      });
   });
});

// =============================================================================
// Parsing
// =============================================================================

describe("Parsing", () => {
   describe("parse", () => {
      test("parses US format", () => {
         const money = parse("$1,234.56", "en-US", "USD");
         expect(money.amount).toBe(123456n);
      });

      test("parses Brazilian format", () => {
         const money = parse("R$ 1.234,56", "pt-BR", "BRL");
         expect(money.amount).toBe(123456n);
      });

      test("parses negative with parentheses", () => {
         const money = parse("($1,234.56)", "en-US", "USD");
         expect(money.amount).toBe(-123456n);
      });

      test("parses negative with minus", () => {
         const money = parse("-$1,234.56", "en-US", "USD");
         expect(money.amount).toBe(-123456n);
      });

      test("throws on invalid amount", () => {
         expect(() => parse("invalid", "en-US", "USD")).toThrow(
            InvalidAmountError,
         );
      });

      test("throws on multiple decimal separators (US format)", () => {
         expect(() => parse("$1.234.56", "en-US", "USD")).toThrow(
            InvalidAmountError,
         );
         expect(() => parse("$1.2.3", "en-US", "USD")).toThrow(
            InvalidAmountError,
         );
      });

      test("throws on multiple decimal separators (BR format)", () => {
         expect(() => parse("R$ 1,234,56", "pt-BR", "BRL")).toThrow(
            InvalidAmountError,
         );
         expect(() => parse("R$ 1,2,3", "pt-BR", "BRL")).toThrow(
            InvalidAmountError,
         );
      });

      test("accepts valid grouping separators", () => {
         // These should work (grouping vs decimal)
         expect(parse("$1,234.56", "en-US", "USD").amount).toBe(123456n);
         expect(parse("R$ 1.234,56", "pt-BR", "BRL").amount).toBe(123456n);
      });
   });
});

// =============================================================================
// Serialization
// =============================================================================

describe("Serialization", () => {
   describe("toJSON/fromJSON", () => {
      test("roundtrips correctly", () => {
         const original = of("123.45", "USD");
         const json = toJSON(original);
         const restored = fromJSON(json);
         expect(equals(original, restored)).toBe(true);
      });

      test("toJSON creates correct structure", () => {
         const money = of("123.45", "USD");
         const json = toJSON(money);
         expect(json.amount).toBe("123.45");
         expect(json.currency).toBe("USD");
      });

      test("fromJSON throws on invalid input", () => {
         expect(() => fromJSON(null as never)).toThrow(InvalidAmountError);
         expect(() => fromJSON({ amount: 123 } as never)).toThrow(
            InvalidAmountError,
         );
      });
   });

   describe("toDatabase/fromDatabase", () => {
      test("roundtrips correctly", () => {
         const original = of("123.45", "USD");
         const db = toDatabase(original);
         const restored = fromDatabase(db);
         expect(equals(original, restored)).toBe(true);
      });
   });

   describe("serialize/deserialize", () => {
      test("roundtrips correctly", () => {
         const original = of("123.45", "USD");
         const str = serialize(original);
         const restored = deserialize(str);
         expect(equals(original, restored)).toBe(true);
      });

      test("serialize creates correct format", () => {
         const money = of("123.45", "USD");
         expect(serialize(money)).toBe("123.45 USD");
      });

      test("deserialize throws on invalid format", () => {
         expect(() => deserialize("invalid")).toThrow(InvalidAmountError);
         expect(() => deserialize("123.45")).toThrow(InvalidAmountError);
      });
   });

   describe("conversion functions", () => {
      test("toMinorUnits", () => {
         expect(toMinorUnits(of("123.45", "USD"))).toBe(12345);
      });

      test("toMinorUnits throws on overflow", () => {
         const money = fromMinorUnits(
            BigInt(Number.MAX_SAFE_INTEGER) + 1n,
            "USD",
         );
         expect(() => toMinorUnits(money)).toThrow(OverflowError);
      });

      test("toMinorUnitsBigInt", () => {
         expect(toMinorUnitsBigInt(of("123.45", "USD"))).toBe(12345n);
      });

      test("toMajorUnits", () => {
         expect(toMajorUnits(of("123.45", "USD"))).toBe(123.45);
      });

      test("toMajorUnitsString returns precise string", () => {
         expect(toMajorUnitsString(of("123.45", "USD"))).toBe("123.45");
      });

      test("toMajorUnitsString handles large amounts", () => {
         const money = of("999999999999999.99", "USD");
         expect(toMajorUnitsString(money)).toBe("999999999999999.99");
      });

      test("toMajorUnitsString handles zero-decimal currencies", () => {
         expect(toMajorUnitsString(of("1234", "JPY"))).toBe("1234");
      });

      test("toMajorUnitsString handles negative amounts", () => {
         expect(toMajorUnitsString(of("-123.45", "USD"))).toBe("-123.45");
      });

      test("toMinorUnitsString", () => {
         expect(toMinorUnitsString(of("123.45", "USD"))).toBe("12345");
      });
   });
});

// =============================================================================
// Currency Registry
// =============================================================================

describe("Currency Registry", () => {
   afterAll(() => {
      clearCustomCurrencies();
   });

   test("getCurrency returns currency info", () => {
      const usd = getCurrency("USD");
      expect(usd.code).toBe("USD");
      expect(usd.decimalPlaces).toBe(2);
      expect(usd.symbol).toBe("$");
   });

   test("getCurrency is case-insensitive", () => {
      const usd = getCurrency("usd");
      expect(usd.code).toBe("USD");
   });

   test("getCurrency throws on unknown currency", () => {
      expect(() => getCurrency("XXX")).toThrow(UnknownCurrencyError);
   });

   test("hasCurrency checks existence", () => {
      expect(hasCurrency("USD")).toBe(true);
      expect(hasCurrency("XXX")).toBe(false);
   });

   test("registerCurrency adds custom currency", () => {
      registerCurrency({
         code: "TST",
         numericCode: 0,
         name: "Test Currency",
         decimalPlaces: 4,
      });
      const tst = getCurrency("TST");
      expect(tst.decimalPlaces).toBe(4);
   });

   test("getAllCurrencies returns all currencies", () => {
      const all = getAllCurrencies();
      expect(all.USD).toBeDefined();
      expect(all.EUR).toBeDefined();
   });
});

// =============================================================================
// Assertions
// =============================================================================

describe("Assertions", () => {
   test("assertSameCurrency throws on mismatch", () => {
      const a = of("10.00", "USD");
      const b = of("10.00", "EUR");
      expect(() => assertSameCurrency(a, b)).toThrow(CurrencyMismatchError);
   });

   test("assertSameCurrency passes on match", () => {
      const a = of("10.00", "USD");
      const b = of("20.00", "USD");
      expect(() => assertSameCurrency(a, b)).not.toThrow();
   });

   test("assertAllSameCurrency throws on mismatch", () => {
      const moneys = [of("10.00", "USD"), of("10.00", "EUR")];
      expect(() => assertAllSameCurrency(moneys)).toThrow(
         CurrencyMismatchError,
      );
   });

   test("assertAllSameCurrency passes on empty array", () => {
      expect(() => assertAllSameCurrency([])).not.toThrow();
   });
});

// =============================================================================
// Zod Schemas
// =============================================================================

describe("Zod Schemas", () => {
   describe("CurrencyCodeSchema", () => {
      test("validates correct codes", () => {
         expect(CurrencyCodeSchema.safeParse("USD").success).toBe(true);
         expect(CurrencyCodeSchema.safeParse("BRL").success).toBe(true);
      });

      test("rejects invalid codes", () => {
         expect(CurrencyCodeSchema.safeParse("US").success).toBe(false);
         expect(CurrencyCodeSchema.safeParse("USDD").success).toBe(false);
         expect(CurrencyCodeSchema.safeParse("usd").success).toBe(false);
         expect(CurrencyCodeSchema.safeParse("123").success).toBe(false);
      });
   });

   describe("MoneySchema", () => {
      test("validates correct structure", () => {
         expect(
            MoneySchema.safeParse({ amount: "123.45", currency: "USD" })
               .success,
         ).toBe(true);
      });

      test("rejects invalid amount format", () => {
         expect(
            MoneySchema.safeParse({ amount: "invalid", currency: "USD" })
               .success,
         ).toBe(false);
      });
   });

   describe("AllocationRatiosSchema", () => {
      test("validates correct ratios", () => {
         expect(AllocationRatiosSchema.safeParse([1, 2, 3]).success).toBe(true);
      });

      test("rejects empty array", () => {
         expect(AllocationRatiosSchema.safeParse([]).success).toBe(false);
      });

      test("rejects negative ratios", () => {
         expect(AllocationRatiosSchema.safeParse([-1, 1]).success).toBe(false);
      });

      test("rejects all-zero ratios", () => {
         expect(AllocationRatiosSchema.safeParse([0, 0]).success).toBe(false);
      });
   });

   describe("FormatOptionsSchema", () => {
      test("validates options", () => {
         expect(
            FormatOptionsSchema.safeParse({ notation: "compact" }).success,
         ).toBe(true);
         expect(
            FormatOptionsSchema.safeParse({ hideSymbol: true }).success,
         ).toBe(true);
      });

      test("rejects invalid notation", () => {
         expect(
            FormatOptionsSchema.safeParse({ notation: "invalid" }).success,
         ).toBe(false);
      });
   });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("Edge Cases", () => {
   test("0.1 + 0.2 = 0.3 (precision test)", () => {
      const a = of("0.1", "USD");
      const b = of("0.2", "USD");
      const result = add(a, b);
      expect(toDecimal(result)).toBe("0.30");
   });

   test("handles very large amounts", () => {
      const money = of("999999999999.99", "USD");
      expect(money.amount).toBe(99999999999999n);
   });

   test("handles very small amounts", () => {
      const money = of("0.01", "USD");
      expect(money.amount).toBe(1n);
   });

   test("preserves immutability", () => {
      const money = of("100.00", "USD");
      expect(() => {
         // @ts-expect-error - testing immutability
         money.amount = 200n;
      }).toThrow();
   });
});

// =============================================================================
// Scale Validation Tests
// =============================================================================

describe("Scale Validation", () => {
   test("throws ScaleMismatchError on scale mismatch in addition", () => {
      const a = of("10.00", "USD"); // scale=2
      // Manually create invalid Money (bypassing factory)
      const b = Object.freeze({ amount: 1000n, currency: "USD", scale: 4 });

      expect(() => add(a, b)).toThrow(ScaleMismatchError);
   });

   test("throws ScaleMismatchError on scale mismatch in subtraction", () => {
      const a = of("10.00", "USD");
      const b = Object.freeze({ amount: 500n, currency: "USD", scale: 3 });

      expect(() => subtract(a, b)).toThrow(ScaleMismatchError);
   });

   test("throws ScaleMismatchError in assertSameCurrency", () => {
      const a = of("10.00", "USD");
      const b = Object.freeze({ amount: 1000n, currency: "USD", scale: 4 });

      expect(() => assertSameCurrency(a, b)).toThrow(ScaleMismatchError);
   });

   test("throws ScaleMismatchError in assertAllSameCurrency", () => {
      const a = of("10.00", "USD");
      const b = of("20.00", "USD");
      const c = Object.freeze({ amount: 3000n, currency: "USD", scale: 4 });

      expect(() => assertAllSameCurrency([a, b, c])).toThrow(
         ScaleMismatchError,
      );
   });

   test("factory functions create correct scales", () => {
      expect(of("10.00", "USD").scale).toBe(2);
      expect(of("100", "JPY").scale).toBe(0);
      expect(of("1.234", "KWD").scale).toBe(3);
   });

   test("ScaleMismatchError contains proper info", () => {
      const a = of("10.00", "USD");
      const b = Object.freeze({ amount: 1000n, currency: "USD", scale: 4 });

      try {
         add(a, b);
         expect.fail("Should have thrown");
      } catch (err) {
         expect(err).toBeInstanceOf(ScaleMismatchError);
         const error = err as ScaleMismatchError;
         expect(error.currency).toBe("USD");
         expect(error.scaleA).toBe(2);
         expect(error.scaleB).toBe(4);
      }
   });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe("Performance", () => {
   const ITERATIONS = 10000;

   test(`creates ${ITERATIONS} Money objects quickly`, () => {
      const start = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
         of("123.45", "USD");
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500); // Should complete in under 500ms
   });

   test(`performs ${ITERATIONS} additions quickly`, () => {
      const a = of("100.00", "USD");
      const b = of("50.00", "USD");
      const start = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
         add(a, b);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(200);
   });

   test(`performs ${ITERATIONS} comparisons quickly`, () => {
      const a = of("100.00", "USD");
      const b = of("50.00", "USD");
      const start = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
         greaterThan(a, b);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
   });

   test(`formats ${ITERATIONS} values quickly (with caching)`, () => {
      const money = of("1234.56", "USD");
      const start = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
         format(money, "en-US");
      }
      const elapsed = performance.now() - start;
      // First call creates the formatter, subsequent calls use cache
      expect(elapsed).toBeLessThan(500);
   });

   test(`allocates ${ITERATIONS / 10} times quickly`, () => {
      const money = of("100.00", "USD");
      const ratios = [1, 1, 1];
      const start = performance.now();
      for (let i = 0; i < ITERATIONS / 10; i++) {
         allocate(money, ratios);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
   });

   test("formatter cache improves performance", () => {
      const money = of("1234.56", "USD");

      // Cold run
      const coldStart = performance.now();
      format(money, "en-US");
      const coldElapsed = performance.now() - coldStart;

      // Warm runs (should use cache)
      const warmStart = performance.now();
      for (let i = 0; i < 100; i++) {
         format(money, "en-US");
      }
      const warmElapsed = performance.now() - warmStart;

      // Average warm call should be faster than cold call
      expect(warmElapsed / 100).toBeLessThan(coldElapsed);
   });
});
