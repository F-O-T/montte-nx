import { minorUnitsToDecimal } from "../core/internal";
import { OverflowError } from "../errors";
import type { Money } from "../types";

/**
 * Convert Money to minor units as a number
 *
 * Use this when you need to store the amount in a database column
 * that doesn't support BigInt, or when interfacing with APIs that
 * expect number types.
 *
 * @param money - Money value
 * @returns Amount in minor units (cents) as a number
 * @throws OverflowError if the value exceeds Number.MAX_SAFE_INTEGER
 *
 * @example
 * toMinorUnits(of("123.45", "USD"))  // 12345
 * toMinorUnits(of("100", "JPY"))     // 100
 */
export function toMinorUnits(money: Money): number {
   // Check if the value exceeds safe integer range
   if (
      money.amount > BigInt(Number.MAX_SAFE_INTEGER) ||
      money.amount < BigInt(Number.MIN_SAFE_INTEGER)
   ) {
      throw new OverflowError(
         `Money amount ${money.amount} exceeds safe integer range (${Number.MIN_SAFE_INTEGER} to ${Number.MAX_SAFE_INTEGER})`,
      );
   }

   return Number(money.amount);
}

/**
 * Convert Money to minor units as a BigInt
 *
 * Use this when you need the raw BigInt value without any conversion.
 *
 * @param money - Money value
 * @returns Amount in minor units (cents) as BigInt
 *
 * @example
 * toMinorUnitsBigInt(of("123.45", "USD"))  // 12345n
 */
export function toMinorUnitsBigInt(money: Money): bigint {
   return money.amount;
}

/**
 * Convert Money to major units as a number
 *
 * @deprecated Use toMajorUnitsString() for precision-safe conversion.
 * This function may lose precision for large amounts.
 *
 * @param money - Money value
 * @returns Amount in major units (dollars, reais, etc.) as a number
 *
 * @example
 * toMajorUnits(of("123.45", "USD"))  // 123.45
 * toMajorUnits(of("100", "JPY"))     // 100
 */
export function toMajorUnits(money: Money): number {
   const decimal = minorUnitsToDecimal(money.amount, money.scale);

   // Warn if precision may be lost
   if (
      money.amount > BigInt(Number.MAX_SAFE_INTEGER) ||
      money.amount < BigInt(Number.MIN_SAFE_INTEGER)
   ) {
      console.warn(
         `toMajorUnits may lose precision for amount ${decimal}. ` +
            `Consider using toMajorUnitsString() instead.`,
      );
   }

   return Number.parseFloat(decimal);
}

/**
 * Convert Money to major units as a string (precision-safe)
 *
 * Use this for precise decimal representation without precision loss.
 *
 * @param money - Money value
 * @returns Amount in major units as a string (e.g., "123.45")
 *
 * @example
 * toMajorUnitsString(of("123.45", "USD"))  // "123.45"
 * toMajorUnitsString(of("999999999999999.99", "USD"))  // "999999999999999.99"
 */
export function toMajorUnitsString(money: Money): string {
   return minorUnitsToDecimal(money.amount, money.scale);
}

/**
 * Convert Money to a string of minor units
 *
 * Useful for database storage or APIs that accept string representations.
 *
 * @param money - Money value
 * @returns Amount in minor units as a string
 *
 * @example
 * toMinorUnitsString(of("123.45", "USD"))  // "12345"
 */
export function toMinorUnitsString(money: Money): string {
   return money.amount.toString();
}
