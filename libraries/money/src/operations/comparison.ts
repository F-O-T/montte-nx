import { createOperator } from "@f-o-t/condition-evaluator";
import { z } from "zod";
import { CurrencyMismatchError } from "../errors";
import type { Money, MoneyJSON } from "../types";
import { of } from "../core/money";
import { minorUnitsToDecimal } from "../core/internal";

/**
 * Zod schema for Money JSON representation
 */
const MoneyJSONSchema = z.object({
	amount: z.string(),
	currency: z.string().length(3),
});

/**
 * Convert a value to Money
 * Handles Money objects, MoneyJSON, and serialized objects
 */
function toMoney(value: unknown): Money {
	if (value === null || value === undefined) {
		throw new Error("Cannot convert null/undefined to Money");
	}

	// Already a Money object
	if (
		typeof value === "object" &&
		"amount" in value &&
		"currency" in value &&
		"scale" in value &&
		typeof (value as Money).amount === "bigint"
	) {
		return value as Money;
	}

	// MoneyJSON format
	if (
		typeof value === "object" &&
		"amount" in value &&
		"currency" in value &&
		typeof (value as MoneyJSON).amount === "string"
	) {
		const json = value as MoneyJSON;
		return of(json.amount, json.currency);
	}

	throw new Error(`Cannot convert value to Money: ${JSON.stringify(value)}`);
}

/**
 * Convert Money to JSON for operator comparison
 */
export function toJSON(money: Money): MoneyJSON {
	return {
		amount: minorUnitsToDecimal(money.amount, money.scale),
		currency: money.currency,
	};
}

/**
 * Assert that two Money values have the same currency
 */
function assertSameCurrency(a: Money, b: Money): void {
	if (a.currency !== b.currency) {
		throw CurrencyMismatchError.create(a.currency, b.currency);
	}
}

// =============================================================================
// Operators using createOperator from condition-evaluator
// =============================================================================

/**
 * Money equals operator
 */
export const moneyEqualsOperator = createOperator({
	name: "money_eq",
	type: "custom",
	description: "Check if two Money values are equal",
	evaluate: (actual: unknown, expected: unknown): boolean => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		assertSameCurrency(a, b);
		return a.amount === b.amount;
	},
	valueSchema: MoneyJSONSchema,
	reasonGenerator: (passed, actual, expected, field) => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		if (passed) {
			return `${field} equals ${minorUnitsToDecimal(b.amount, b.scale)} ${b.currency}`;
		}
		return `${field} (${minorUnitsToDecimal(a.amount, a.scale)} ${a.currency}) does not equal ${minorUnitsToDecimal(b.amount, b.scale)} ${b.currency}`;
	},
});

/**
 * Money not equals operator
 */
export const moneyNotEqualsOperator = createOperator({
	name: "money_neq",
	type: "custom",
	description: "Check if two Money values are not equal",
	evaluate: (actual: unknown, expected: unknown): boolean => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		assertSameCurrency(a, b);
		return a.amount !== b.amount;
	},
	valueSchema: MoneyJSONSchema,
});

/**
 * Money greater than operator
 */
export const moneyGreaterThanOperator = createOperator({
	name: "money_gt",
	type: "custom",
	description: "Check if Money value is greater than expected",
	evaluate: (actual: unknown, expected: unknown): boolean => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		assertSameCurrency(a, b);
		return a.amount > b.amount;
	},
	valueSchema: MoneyJSONSchema,
});

/**
 * Money greater than or equal operator
 */
export const moneyGreaterThanOrEqualOperator = createOperator({
	name: "money_gte",
	type: "custom",
	description: "Check if Money value is greater than or equal to expected",
	evaluate: (actual: unknown, expected: unknown): boolean => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		assertSameCurrency(a, b);
		return a.amount >= b.amount;
	},
	valueSchema: MoneyJSONSchema,
});

/**
 * Money less than operator
 */
export const moneyLessThanOperator = createOperator({
	name: "money_lt",
	type: "custom",
	description: "Check if Money value is less than expected",
	evaluate: (actual: unknown, expected: unknown): boolean => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		assertSameCurrency(a, b);
		return a.amount < b.amount;
	},
	valueSchema: MoneyJSONSchema,
});

/**
 * Money less than or equal operator
 */
export const moneyLessThanOrEqualOperator = createOperator({
	name: "money_lte",
	type: "custom",
	description: "Check if Money value is less than or equal to expected",
	evaluate: (actual: unknown, expected: unknown): boolean => {
		const a = toMoney(actual);
		const b = toMoney(expected);
		assertSameCurrency(a, b);
		return a.amount <= b.amount;
	},
	valueSchema: MoneyJSONSchema,
});

/**
 * Money between operator (inclusive)
 */
export const moneyBetweenOperator = createOperator({
	name: "money_between",
	type: "custom",
	description: "Check if Money value is between two values (inclusive)",
	evaluate: (
		actual: unknown,
		expected: unknown,
	): boolean => {
		if (!Array.isArray(expected) || expected.length !== 2) {
			throw new Error("Expected value must be an array of two Money values");
		}
		const a = toMoney(actual);
		const min = toMoney(expected[0]);
		const max = toMoney(expected[1]);
		assertSameCurrency(a, min);
		assertSameCurrency(a, max);
		return a.amount >= min.amount && a.amount <= max.amount;
	},
	valueSchema: z.tuple([MoneyJSONSchema, MoneyJSONSchema]),
});

/**
 * Money is positive operator
 */
export const moneyPositiveOperator = createOperator({
	name: "money_positive",
	type: "custom",
	description: "Check if Money value is positive (> 0)",
	evaluate: (actual: unknown): boolean => {
		const a = toMoney(actual);
		return a.amount > 0n;
	},
});

/**
 * Money is negative operator
 */
export const moneyNegativeOperator = createOperator({
	name: "money_negative",
	type: "custom",
	description: "Check if Money value is negative (< 0)",
	evaluate: (actual: unknown): boolean => {
		const a = toMoney(actual);
		return a.amount < 0n;
	},
});

/**
 * Money is zero operator
 */
export const moneyZeroOperator = createOperator({
	name: "money_zero",
	type: "custom",
	description: "Check if Money value is zero",
	evaluate: (actual: unknown): boolean => {
		const a = toMoney(actual);
		return a.amount === 0n;
	},
});

// =============================================================================
// Convenience functions that wrap the operators
// =============================================================================

/**
 * Check if two Money values are equal
 */
export function equals(a: Money, b: Money): boolean {
	return moneyEqualsOperator.evaluate(a, toJSON(b));
}

/**
 * Check if first Money is greater than second
 */
export function greaterThan(a: Money, b: Money): boolean {
	return moneyGreaterThanOperator.evaluate(a, toJSON(b));
}

/**
 * Check if first Money is greater than or equal to second
 */
export function greaterThanOrEqual(a: Money, b: Money): boolean {
	return moneyGreaterThanOrEqualOperator.evaluate(a, toJSON(b));
}

/**
 * Check if first Money is less than second
 */
export function lessThan(a: Money, b: Money): boolean {
	return moneyLessThanOperator.evaluate(a, toJSON(b));
}

/**
 * Check if first Money is less than or equal to second
 */
export function lessThanOrEqual(a: Money, b: Money): boolean {
	return moneyLessThanOrEqualOperator.evaluate(a, toJSON(b));
}

/**
 * Check if Money is positive (amount > 0)
 */
export function isPositive(money: Money): boolean {
	return moneyPositiveOperator.evaluate(money, undefined);
}

/**
 * Check if Money is negative (amount < 0)
 */
export function isNegative(money: Money): boolean {
	return moneyNegativeOperator.evaluate(money, undefined);
}

/**
 * Check if Money is zero (amount === 0)
 */
export function isZero(money: Money): boolean {
	return moneyZeroOperator.evaluate(money, undefined);
}

/**
 * Compare two Money values
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
	assertSameCurrency(a, b);
	if (a.amount < b.amount) return -1;
	if (a.amount > b.amount) return 1;
	return 0;
}
