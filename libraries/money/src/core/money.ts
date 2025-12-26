import { getCurrency } from "../currency/registry";
import { InvalidAmountError } from "../errors";
import type { Money, RoundingMode } from "../types";
import { createMoney, parseDecimalToMinorUnits } from "./internal";

/**
 * Detect if a number might have floating-point precision issues.
 *
 * Checks for common indicators:
 * - Has decimal places AND
 * - String representation shows likely float artifacts (long decimals, trailing 0000 or 9999)
 */
function hasLikelyPrecisionIssue(num: number): boolean {
   if (!Number.isFinite(num)) return false;
   if (Number.isInteger(num)) return false;

   const str = num.toString();
   const decimalPart = str.split(".")[1];

   if (!decimalPart) return false;

   // If decimal part is very long (>10 digits), likely from float arithmetic
   if (decimalPart.length > 10) {
      return true;
   }

   // If number includes common precision errors (repeated 0s or 9s)
   if (/0{4,}|9{4,}/.test(decimalPart)) {
      return true;
   }

   return false;
}

/**
 * Create Money from a decimal amount
 *
 * By default, excess decimal places are TRUNCATED, not rounded.
 * Use roundingMode parameter or ofRounded() for rounding behavior.
 *
 * IMPORTANT: Always pass strings for amounts to avoid floating-point precision issues.
 * Passing numbers like (0.1 + 0.2) will produce incorrect results due to JavaScript
 * floating-point arithmetic limitations.
 *
 * @param amount - Decimal amount as STRING (preferred) or number
 * @param currency - ISO 4217 currency code
 * @param roundingMode - How to handle excess decimal places (default: "truncate")
 * @returns Money instance
 *
 * @example
 * // CORRECT - String amounts are precise
 * of("123.45", "USD")
 * of("0.1", "USD")
 *
 * // AVOID - Number literals work but strings are safer
 * of(123.45, "USD")
 *
 * // WRONG - Computed numbers lose precision
 * of(0.1 + 0.2, "USD")  // Results in 0.30000000000000004
 */
export function of(
   amount: number | string,
   currency: string,
   roundingMode?: RoundingMode,
): Money {
   const curr = getCurrency(currency);
   const scale = curr.decimalPlaces;

   // Convert to string for precise parsing
   let amountStr: string;
   if (typeof amount === "number") {
      if (hasLikelyPrecisionIssue(amount)) {
         console.warn(
            `Money.of() received number ${amount} which may have precision issues. ` +
               `Consider using string amounts: of("${amount}", "${currency}") instead.`,
         );
      }
      amountStr = amount.toString();
   } else {
      amountStr = amount;
   }

   try {
      const minorUnits = parseDecimalToMinorUnits(
         amountStr,
         scale,
         roundingMode ?? "truncate",
      );
      return createMoney(minorUnits, currency.toUpperCase(), scale);
   } catch {
      throw new InvalidAmountError(`Invalid amount format: ${amountStr}`);
   }
}

/**
 * Create Money from a decimal amount with rounding
 *
 * Convenience function that rounds excess decimal places using banker's rounding.
 * Equivalent to: of(amount, currency, "round")
 *
 * @param amount - Decimal amount as string or number
 * @param currency - ISO 4217 currency code
 * @returns Money instance with rounded amount
 *
 * @example
 * ofRounded("10.999", "USD")  // $11.00
 * ofRounded("10.995", "USD")  // $11.00 (rounds to even)
 * ofRounded("10.994", "USD")  // $10.99
 */
export function ofRounded(amount: number | string, currency: string): Money {
   return of(amount, currency, "round");
}

/**
 * Create Money from minor units (cents, pence, etc.)
 *
 * Use this when you already have the amount in the smallest currency unit.
 *
 * @param minorUnits - Amount in minor units (e.g., cents)
 * @param currency - ISO 4217 currency code
 * @returns Money instance
 *
 * @example
 * fromMinorUnits(12345, "USD")  // $123.45
 * fromMinorUnits(12345n, "USD") // Same, using BigInt
 * fromMinorUnits(100, "JPY")    // ¥100 (no decimal places)
 */
export function fromMinorUnits(
   minorUnits: number | bigint,
   currency: string,
): Money {
   const curr = getCurrency(currency);

   if (typeof minorUnits === "number") {
      if (!Number.isInteger(minorUnits)) {
         throw new InvalidAmountError(
            `Minor units must be an integer, got: ${minorUnits}`,
         );
      }
      if (!Number.isFinite(minorUnits)) {
         throw new InvalidAmountError("Minor units must be finite");
      }
   }

   const amount =
      typeof minorUnits === "number" ? BigInt(minorUnits) : minorUnits;
   return createMoney(amount, currency.toUpperCase(), curr.decimalPlaces);
}

/**
 * Create zero Money for a currency
 *
 * @param currency - ISO 4217 currency code
 * @returns Money instance with zero amount
 *
 * @example
 * zero("USD") // $0.00
 * zero("JPY") // ¥0
 */
export function zero(currency: string): Money {
   const curr = getCurrency(currency);
   return createMoney(0n, currency.toUpperCase(), curr.decimalPlaces);
}

/**
 * Create Money from major units (dollars, reais, etc.)
 *
 * Convenience alias for `of` to make intent clearer.
 *
 * @param amount - Amount in major units
 * @param currency - ISO 4217 currency code
 * @returns Money instance
 */
export function fromMajorUnits(
   amount: number | string,
   currency: string,
): Money {
   return of(amount, currency);
}
