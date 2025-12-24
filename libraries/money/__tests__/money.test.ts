import { describe, expect, test } from "bun:test";
import {
	of,
	fromMinorUnits,
	zero,
	add,
	subtract,
	multiply,
	divide,
	percentage,
	negate,
	absolute,
	equals,
	greaterThan,
	lessThan,
	isPositive,
	isNegative,
	isZero,
	compare,
	allocate,
	split,
	sum,
	min,
	max,
	average,
	format,
	toDecimal,
	toJSON,
	fromJSON,
	toMinorUnits,
	getCurrency,
	CurrencyMismatchError,
	InvalidAmountError,
	DivisionByZeroError,
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
	test("equals", () => {
		const a = of("10.00", "USD");
		const b = of("10.00", "USD");
		const c = of("20.00", "USD");
		expect(equals(a, b)).toBe(true);
		expect(equals(a, c)).toBe(false);
	});

	test("greaterThan", () => {
		const a = of("20.00", "USD");
		const b = of("10.00", "USD");
		expect(greaterThan(a, b)).toBe(true);
		expect(greaterThan(b, a)).toBe(false);
	});

	test("lessThan", () => {
		const a = of("10.00", "USD");
		const b = of("20.00", "USD");
		expect(lessThan(a, b)).toBe(true);
		expect(lessThan(b, a)).toBe(false);
	});

	test("isPositive", () => {
		expect(isPositive(of("10.00", "USD"))).toBe(true);
		expect(isPositive(of("-10.00", "USD"))).toBe(false);
		expect(isPositive(of("0.00", "USD"))).toBe(false);
	});

	test("isNegative", () => {
		expect(isNegative(of("-10.00", "USD"))).toBe(true);
		expect(isNegative(of("10.00", "USD"))).toBe(false);
		expect(isNegative(of("0.00", "USD"))).toBe(false);
	});

	test("isZero", () => {
		expect(isZero(of("0.00", "USD"))).toBe(true);
		expect(isZero(of("10.00", "USD"))).toBe(false);
	});

	test("compare", () => {
		const a = of("10.00", "USD");
		const b = of("20.00", "USD");
		const c = of("10.00", "USD");
		expect(compare(a, b)).toBe(-1);
		expect(compare(b, a)).toBe(1);
		expect(compare(a, c)).toBe(0);
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
			expect(result[0]!.amount).toBe(6000n);
			expect(result[1]!.amount).toBe(2500n);
			expect(result[2]!.amount).toBe(1500n);
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
			expect(result[0]!.amount).toBe(10000n);
			expect(result[1]!.amount).toBe(0n);
		});

		test("throws on empty ratios", () => {
			expect(() => allocate(of("100.00", "USD"), [])).toThrow(InvalidAmountError);
		});

		test("throws on negative ratios", () => {
			expect(() => allocate(of("100.00", "USD"), [-1, 1])).toThrow(InvalidAmountError);
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
	});
});

// =============================================================================
// Aggregation
// =============================================================================

describe("Aggregation", () => {
	test("sum", () => {
		const moneys = [of("10.00", "USD"), of("20.00", "USD"), of("30.00", "USD")];
		const result = sum(moneys);
		expect(result.amount).toBe(6000n);
	});

	test("min", () => {
		const moneys = [of("10.00", "USD"), of("5.00", "USD"), of("20.00", "USD")];
		const result = min(moneys);
		expect(result.amount).toBe(500n);
	});

	test("max", () => {
		const moneys = [of("10.00", "USD"), of("5.00", "USD"), of("20.00", "USD")];
		const result = max(moneys);
		expect(result.amount).toBe(2000n);
	});

	test("average", () => {
		const moneys = [of("10.00", "USD"), of("20.00", "USD"), of("30.00", "USD")];
		const result = average(moneys);
		expect(result.amount).toBe(2000n);
	});
});

// =============================================================================
// Formatting
// =============================================================================

describe("Formatting", () => {
	test("format with default locale", () => {
		const money = of("1234.56", "USD");
		const result = format(money, "en-US");
		expect(result).toContain("1,234.56");
	});

	test("format with Brazilian locale", () => {
		const money = of("1234.56", "BRL");
		const result = format(money, "pt-BR");
		expect(result).toContain("1.234,56");
	});

	test("toDecimal", () => {
		const money = of("123.45", "USD");
		expect(toDecimal(money)).toBe("123.45");
	});

	test("toDecimal with zero decimal currency", () => {
		const money = of("1234", "JPY");
		expect(toDecimal(money)).toBe("1234");
	});
});

// =============================================================================
// Serialization
// =============================================================================

describe("Serialization", () => {
	test("toJSON and fromJSON roundtrip", () => {
		const original = of("123.45", "USD");
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(equals(original, restored)).toBe(true);
	});

	test("toMinorUnits", () => {
		const money = of("123.45", "USD");
		expect(toMinorUnits(money)).toBe(12345);
	});
});

// =============================================================================
// Currency Registry
// =============================================================================

describe("Currency Registry", () => {
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

	test("getCurrency handles zero decimal currencies", () => {
		const jpy = getCurrency("JPY");
		expect(jpy.decimalPlaces).toBe(0);
	});

	test("getCurrency handles three decimal currencies", () => {
		const kwd = getCurrency("KWD");
		expect(kwd.decimalPlaces).toBe(3);
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
});
