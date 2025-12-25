import { createOperator } from "@f-o-t/condition-evaluator";
import { z } from "zod";
import { assertSameCurrency } from "../core/assertions";
import { minorUnitsToDecimal } from "../core/internal";
import { of } from "../core/money";
import { MoneySchema } from "../schemas";
import type { Money, MoneyJSON } from "../types";

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
   valueSchema: MoneySchema,
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
   valueSchema: MoneySchema,
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
   valueSchema: MoneySchema,
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
   valueSchema: MoneySchema,
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
   valueSchema: MoneySchema,
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
   valueSchema: MoneySchema,
});

/**
 * Money between operator (inclusive)
 */
export const moneyBetweenOperator = createOperator({
   name: "money_between",
   type: "custom",
   description: "Check if Money value is between two values (inclusive)",
   evaluate: (actual: unknown, expected: unknown): boolean => {
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
   valueSchema: z.tuple([MoneySchema, MoneySchema]),
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
// Optimized convenience functions (direct BigInt comparison)
// =============================================================================

/**
 * Check if two Money values are equal
 *
 * @example
 * equals(of("10.00", "USD"), of("10.00", "USD")) // true
 */
export function equals(a: Money, b: Money): boolean {
   assertSameCurrency(a, b);
   return a.amount === b.amount;
}

/**
 * Check if first Money is greater than second
 *
 * @example
 * greaterThan(of("20.00", "USD"), of("10.00", "USD")) // true
 */
export function greaterThan(a: Money, b: Money): boolean {
   assertSameCurrency(a, b);
   return a.amount > b.amount;
}

/**
 * Check if first Money is greater than or equal to second
 */
export function greaterThanOrEqual(a: Money, b: Money): boolean {
   assertSameCurrency(a, b);
   return a.amount >= b.amount;
}

/**
 * Check if first Money is less than second
 *
 * @example
 * lessThan(of("10.00", "USD"), of("20.00", "USD")) // true
 */
export function lessThan(a: Money, b: Money): boolean {
   assertSameCurrency(a, b);
   return a.amount < b.amount;
}

/**
 * Check if first Money is less than or equal to second
 */
export function lessThanOrEqual(a: Money, b: Money): boolean {
   assertSameCurrency(a, b);
   return a.amount <= b.amount;
}

/**
 * Check if Money is positive (amount > 0)
 *
 * @example
 * isPositive(of("10.00", "USD")) // true
 * isPositive(of("-10.00", "USD")) // false
 */
export function isPositive(money: Money): boolean {
   return money.amount > 0n;
}

/**
 * Check if Money is negative (amount < 0)
 *
 * @example
 * isNegative(of("-10.00", "USD")) // true
 * isNegative(of("10.00", "USD")) // false
 */
export function isNegative(money: Money): boolean {
   return money.amount < 0n;
}

/**
 * Check if Money is zero (amount === 0)
 *
 * @example
 * isZero(of("0.00", "USD")) // true
 */
export function isZero(money: Money): boolean {
   return money.amount === 0n;
}

/**
 * Compare two Money values
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 *
 * @example
 * compare(of("10.00", "USD"), of("20.00", "USD")) // -1
 * compare(of("20.00", "USD"), of("10.00", "USD")) // 1
 * compare(of("10.00", "USD"), of("10.00", "USD")) // 0
 */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
   assertSameCurrency(a, b);
   if (a.amount < b.amount) return -1;
   if (a.amount > b.amount) return 1;
   return 0;
}
