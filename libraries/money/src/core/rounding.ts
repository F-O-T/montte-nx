/**
 * Banker's rounding (round half to even)
 *
 * When the value is exactly halfway between two values, rounds to the nearest even number.
 * This prevents systematic bias that would occur with traditional rounding.
 *
 * Halfway detection: remainder * 2 == divisor (works for both odd and even divisors)
 *
 * Examples:
 * - 25 / 10 = 2.5 → 2 (rounds down to even)
 * - 35 / 10 = 3.5 → 4 (rounds up to even)
 * - 24 / 10 = 2.4 → 2 (normal round down)
 * - 26 / 10 = 2.6 → 3 (normal round up)
 * - 21 / 6  = 3.5 → 4 (halfway, round to even)
 * - 15 / 7  = 2.14... → 2 (not halfway, round down)
 *
 * @param value - The value to round (numerator)
 * @param divisor - The divisor to round by
 * @returns Rounded quotient
 */
export function bankersRound(value: bigint, divisor: bigint): bigint {
   if (divisor === 0n) {
      throw new Error("Division by zero");
   }

   // Handle negative values
   const isNegative = value < 0n !== divisor < 0n;
   const absValue = value < 0n ? -value : value;
   const absDivisor = divisor < 0n ? -divisor : divisor;

   const quotient = absValue / absDivisor;
   const remainder = absValue % absDivisor;

   let result: bigint;

   // Detect true halfway: remainder * 2 == divisor
   // This works for both even and odd divisors
   const isExactlyHalf = remainder * 2n === absDivisor;

   if (isExactlyHalf) {
      // Exactly halfway - round to even (banker's rounding)
      if (quotient % 2n === 0n) {
         // Quotient is even, round down
         result = quotient;
      } else {
         // Quotient is odd, round up to make it even
         result = quotient + 1n;
      }
   } else {
      // Not exactly halfway - use standard rounding
      const half = absDivisor / 2n;

      if (remainder <= half) {
         result = quotient;
      } else {
         result = quotient + 1n;
      }
   }

   return isNegative ? -result : result;
}

/**
 * Round a bigint value with extended precision back to a target scale
 *
 * @param value - Value with extended precision
 * @param fromScale - Current scale (precision) of the value
 * @param toScale - Target scale (currency's decimal places)
 * @returns Rounded value at target scale
 */
export function roundToScale(
   value: bigint,
   fromScale: number,
   toScale: number,
): bigint {
   if (fromScale <= toScale) {
      // Need to scale up - no rounding needed
      const factor = 10n ** BigInt(toScale - fromScale);
      return value * factor;
   }

   // Need to scale down with banker's rounding
   const divisor = 10n ** BigInt(fromScale - toScale);
   return bankersRound(value, divisor);
}

/**
 * Extended precision for intermediate calculations
 * Using 18 decimal places to handle even ETH-level precision
 */
export const EXTENDED_PRECISION = 18;

/**
 * Scale factor for extended precision calculations
 */
export const PRECISION_FACTOR = 10n ** BigInt(EXTENDED_PRECISION);
