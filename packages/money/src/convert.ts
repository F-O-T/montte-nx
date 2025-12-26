import type { Money } from "@f-o-t/money";
import { fromMinorUnits, of, toDecimal, toMinorUnits } from "@f-o-t/money";

const DEFAULT_CURRENCY = "BRL";

/**
 * Convert cents (integer) to reais (decimal number)
 *
 * @param cents - Amount in cents (minor units)
 * @returns Decimal number representation
 *
 * @example
 * centsToReais(12345) // 123.45
 * centsToReais(100) // 1.00
 */
export function centsToReais(cents: number): number {
   return cents / 100;
}

/**
 * Convert cents (integer) to reais (decimal string)
 *
 * Use this when you need string representation for precision.
 *
 * @param cents - Amount in cents (minor units)
 * @returns Decimal string representation
 *
 * @example
 * centsToReaisString(12345) // "123.45"
 * centsToReaisString(100) // "1.00"
 */
export function centsToReaisString(cents: number): string {
   return toDecimal(fromMinorUnits(cents, DEFAULT_CURRENCY));
}

/**
 * Convert reais (decimal) to cents (integer)
 *
 * @param reais - Decimal amount (number or string)
 * @returns Amount in cents (minor units)
 *
 * @example
 * reaisToCents(123.45) // 12345
 * reaisToCents("1.00") // 100
 */
export function reaisToCents(reais: number | string): number {
   const amount = typeof reais === "number" ? String(reais) : reais;
   return toMinorUnits(of(amount, DEFAULT_CURRENCY));
}

/**
 * Create Money from cents
 *
 * @param cents - Amount in cents (minor units)
 * @param currency - Currency code (default: BRL)
 * @returns Money object
 *
 * @example
 * fromCents(12345) // Money { amount: 12345n, currency: "BRL", scale: 2 }
 */
export function fromCents(cents: number, currency = DEFAULT_CURRENCY): Money {
   return fromMinorUnits(cents, currency);
}

/**
 * Create Money from decimal amount
 *
 * @param amount - Decimal amount (number or string)
 * @param currency - Currency code (default: BRL)
 * @returns Money object
 *
 * @example
 * fromDecimal(123.45) // Money { amount: 12345n, currency: "BRL", scale: 2 }
 * fromDecimal("99.99", "USD") // Money { amount: 9999n, currency: "USD", scale: 2 }
 */
export function fromDecimal(
   amount: number | string,
   currency = DEFAULT_CURRENCY,
): Money {
   const amountStr = typeof amount === "number" ? String(amount) : amount;
   return of(amountStr, currency);
}

/**
 * Get cents from Money
 *
 * @param money - Money object
 * @returns Amount in cents (minor units)
 *
 * @example
 * toCents(of("123.45", "BRL")) // 12345
 */
export function toCents(money: Money): number {
   return toMinorUnits(money);
}
