import type { Money, RoundingMode } from "../types";
import { bankersRound } from "./rounding";

/**
 * Create an immutable Money object
 *
 * @param amount - Amount in minor units as BigInt
 * @param currency - ISO 4217 currency code (uppercase)
 * @param scale - Number of decimal places for this currency
 * @returns Frozen Money object
 */
export function createMoney(
   amount: bigint,
   currency: string,
   scale: number,
): Money {
   return Object.freeze({ amount, currency, scale });
}

/**
 * Parse a decimal string to minor units
 *
 * @param amountStr - Decimal string (e.g., "123.45", "100", "-50.5")
 * @param scale - Target scale (decimal places)
 * @param roundingMode - How to handle excess decimal places (default: "truncate")
 * @returns Amount in minor units as BigInt
 */
export function parseDecimalToMinorUnits(
   amountStr: string,
   scale: number,
   roundingMode: RoundingMode = "truncate",
): bigint {
   // Normalize the string
   const normalized = amountStr.trim();

   // Check for negative
   const isNegative = normalized.startsWith("-");
   const absStr = isNegative ? normalized.slice(1) : normalized;

   // Split by decimal point
   const parts = absStr.split(".");
   const intPart = parts[0] || "0";
   const decPart = parts[1] || "";

   // Validate format
   if (!/^\d*$/.test(intPart) || !/^\d*$/.test(decPart)) {
      throw new Error(`Invalid amount format: ${amountStr}`);
   }

   // Pad or truncate/round decimal part to match scale
   let amount: bigint;

   if (decPart.length <= scale) {
      // Pad with zeros
      const adjustedDecPart = decPart.padEnd(scale, "0");
      const combined = intPart + adjustedDecPart;
      amount = BigInt(combined);
   } else if (roundingMode === "truncate") {
      // Truncate excess digits (default behavior)
      const adjustedDecPart = decPart.slice(0, scale);
      const combined = intPart + adjustedDecPart;
      amount = BigInt(combined);
   } else {
      // Round using banker's rounding
      // Parse with full precision, then round
      const fullAmount = BigInt(intPart + decPart);
      const extraDigits = decPart.length - scale;
      const divisor = 10n ** BigInt(extraDigits);
      amount = bankersRound(fullAmount, divisor);
   }

   return isNegative ? -amount : amount;
}

/**
 * Convert minor units to decimal string
 *
 * @param amount - Amount in minor units
 * @param scale - Number of decimal places
 * @returns Decimal string representation
 */
export function minorUnitsToDecimal(amount: bigint, scale: number): string {
   if (scale === 0) {
      return amount.toString();
   }

   const isNegative = amount < 0n;
   const absAmount = isNegative ? -amount : amount;
   const str = absAmount.toString().padStart(scale + 1, "0");

   const intPart = str.slice(0, -scale) || "0";
   const decPart = str.slice(-scale);

   const result = `${intPart}.${decPart}`;
   return isNegative ? `-${result}` : result;
}

/**
 * Maximum of two BigInt values
 */
export function maxBigInt(a: bigint, b: bigint): bigint {
   return a > b ? a : b;
}

/**
 * Minimum of two BigInt values
 */
export function minBigInt(a: bigint, b: bigint): bigint {
   return a < b ? a : b;
}
