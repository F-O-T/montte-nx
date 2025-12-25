import { assertSameCurrency } from "../core/assertions";
import { createMoney, parseDecimalToMinorUnits } from "../core/internal";
import {
   bankersRound,
   EXTENDED_PRECISION,
   PRECISION_FACTOR,
} from "../core/rounding";
import { DivisionByZeroError } from "../errors";
import type { Money } from "../types";

/**
 * Add two Money values
 *
 * @param a - First Money value
 * @param b - Second Money value (must be same currency)
 * @returns Sum of a and b
 * @throws CurrencyMismatchError if currencies don't match
 *
 * @example
 * add(of("10.50", "USD"), of("5.25", "USD")) // $15.75
 */
export function add(a: Money, b: Money): Money {
   assertSameCurrency(a, b);
   return createMoney(a.amount + b.amount, a.currency, a.scale);
}

/**
 * Subtract one Money value from another
 *
 * @param a - Money value to subtract from
 * @param b - Money value to subtract (must be same currency)
 * @returns Difference of a - b
 * @throws CurrencyMismatchError if currencies don't match
 *
 * @example
 * subtract(of("10.50", "USD"), of("5.25", "USD")) // $5.25
 */
export function subtract(a: Money, b: Money): Money {
   assertSameCurrency(a, b);
   return createMoney(a.amount - b.amount, a.currency, a.scale);
}

/**
 * Multiply Money by a factor
 *
 * Uses banker's rounding for the final result.
 *
 * @param money - Money value to multiply
 * @param factor - Multiplication factor (number or string for precision)
 * @returns Product with banker's rounding applied
 *
 * @example
 * multiply(of("10.00", "USD"), 1.5)    // $15.00
 * multiply(of("10.00", "USD"), "1.5")  // $15.00 (string for precision)
 * multiply(of("33.33", "USD"), 3)      // $99.99
 */
export function multiply(money: Money, factor: number | string): Money {
   const factorStr = typeof factor === "number" ? factor.toString() : factor;

   // Parse factor with extended precision
   const factorMinorUnits = parseDecimalToMinorUnits(
      factorStr,
      EXTENDED_PRECISION,
   );

   // Multiply: result has (scale + EXTENDED_PRECISION) precision
   const rawResult = money.amount * factorMinorUnits;

   // Round back to currency scale using banker's rounding
   const rounded = bankersRound(rawResult, PRECISION_FACTOR);

   return createMoney(rounded, money.currency, money.scale);
}

/**
 * Divide Money by a divisor
 *
 * Uses banker's rounding for the final result.
 *
 * @param money - Money value to divide
 * @param divisor - Division factor (number or string for precision)
 * @returns Quotient with banker's rounding applied
 * @throws DivisionByZeroError if divisor is zero
 *
 * @example
 * divide(of("10.00", "USD"), 3)    // $3.33 (banker's rounding)
 * divide(of("100.00", "USD"), 4)   // $25.00
 */
export function divide(money: Money, divisor: number | string): Money {
   const divisorStr =
      typeof divisor === "number" ? divisor.toString() : divisor;

   // Parse divisor with extended precision
   const divisorMinorUnits = parseDecimalToMinorUnits(
      divisorStr,
      EXTENDED_PRECISION,
   );

   if (divisorMinorUnits === 0n) {
      throw new DivisionByZeroError();
   }

   // Scale up the dividend for precision before dividing
   const scaledDividend = money.amount * PRECISION_FACTOR;

   // Divide using banker's rounding
   const result = bankersRound(scaledDividend, divisorMinorUnits);

   return createMoney(result, money.currency, money.scale);
}

/**
 * Calculate a percentage of Money
 *
 * @param money - Money value
 * @param percent - Percentage (e.g., 15 for 15%)
 * @returns Percentage amount with banker's rounding
 *
 * @example
 * percentage(of("100.00", "USD"), 15)   // $15.00
 * percentage(of("200.00", "USD"), 7.5)  // $15.00
 */
export function percentage(money: Money, percent: number): Money {
   return multiply(money, percent / 100);
}

/**
 * Negate a Money value
 *
 * @param money - Money value to negate
 * @returns Money with opposite sign
 *
 * @example
 * negate(of("10.00", "USD"))   // -$10.00
 * negate(of("-5.00", "USD"))   // $5.00
 */
export function negate(money: Money): Money {
   return createMoney(-money.amount, money.currency, money.scale);
}

/**
 * Get absolute value of Money
 *
 * @param money - Money value
 * @returns Money with positive amount
 *
 * @example
 * absolute(of("-10.00", "USD"))  // $10.00
 * absolute(of("10.00", "USD"))   // $10.00
 */
export function absolute(money: Money): Money {
   const absAmount = money.amount < 0n ? -money.amount : money.amount;
   return createMoney(absAmount, money.currency, money.scale);
}
