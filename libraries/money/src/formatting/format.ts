import { minorUnitsToDecimal } from "../core/internal";
import { getCurrency } from "../currency/registry";
import type { FormatOptions, Money } from "../types";

// =============================================================================
// Formatter Cache for Performance
// =============================================================================

/**
 * Cache for Intl.NumberFormat instances to avoid repeated creation
 *
 * Key format: `${locale}:${currency}:${options_hash}`
 */
const formatterCache = new Map<string, Intl.NumberFormat>();
const MAX_CACHE_SIZE = 100;

/**
 * Check if a decimal string can be safely converted to a JavaScript Number
 * without losing precision.
 *
 * JavaScript Numbers (IEEE 754 double-precision) have about 15-17 significant digits.
 * We use 15 as a conservative limit.
 */
function isSafeForFloat(decimalStr: string): boolean {
   const absDecimal = decimalStr.startsWith("-")
      ? decimalStr.slice(1)
      : decimalStr;
   const [intPart = "", fracPart = ""] = absDecimal.split(".");

   // Count significant digits (strip leading zeros from integer, trailing zeros from fraction)
   const trimmedInt = intPart.replace(/^0+/, "") || "0";
   const trimmedFrac = fracPart.replace(/0+$/, "");

   // Total significant digits
   const significantDigits =
      trimmedInt === "0"
         ? trimmedFrac.replace(/^0+/, "").length
         : trimmedInt.length + trimmedFrac.length;

   // Safe if total significant digits is <= 15 (conservative for double precision)
   return significantDigits <= 15;
}

/**
 * Get or create a cached NumberFormat instance
 */
function getCachedFormatter(
   locale: string,
   currency: string,
   options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
   // Create a cache key from the options
   const optionsKey = JSON.stringify(options);
   const cacheKey = `${locale}:${currency}:${optionsKey}`;

   let formatter = formatterCache.get(cacheKey);
   if (!formatter) {
      // Evict oldest entries if cache is full (simple LRU)
      if (formatterCache.size >= MAX_CACHE_SIZE) {
         const firstKey = formatterCache.keys().next().value;
         if (firstKey) {
            formatterCache.delete(firstKey);
         }
      }
      formatter = new Intl.NumberFormat(locale, options);
      formatterCache.set(cacheKey, formatter);
   }
   return formatter;
}

/**
 * Format large amounts without precision loss by formatting
 * the integer part and manually appending the decimal part.
 */
function formatLargeAmount(
   decimalStr: string,
   money: Money,
   locale: string,
   options: FormatOptions,
): string {
   const isNegative = decimalStr.startsWith("-");
   const absDecimal = isNegative ? decimalStr.slice(1) : decimalStr;
   const [intPart = "0", fracPart = ""] = absDecimal.split(".");

   const currencyInfo = getCurrency(money.currency);
   const minFrac = options.minimumFractionDigits ?? currencyInfo.decimalPlaces;
   const maxFrac = options.maximumFractionDigits ?? currencyInfo.decimalPlaces;

   // Format the integer part only (always safe for display)
   const intFormatter = getCachedFormatter(locale, money.currency, {
      style: options.hideSymbol ? undefined : "currency",
      currency: options.hideSymbol ? undefined : money.currency,
      currencyDisplay: options.hideSymbol
         ? undefined
         : (options.currencyDisplay ?? "symbol"),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
   });

   // Format integer with currency
   let formatted = intFormatter.format(Number(intPart) * (isNegative ? -1 : 1));

   // Get decimal separator from locale
   const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
   const decimalSep = parts.find((p) => p.type === "decimal")?.value || ".";

   // Pad/truncate fractional part
   const paddedFrac = fracPart.padEnd(minFrac, "0").slice(0, maxFrac);

   // Insert decimal and fractional part
   if (paddedFrac && maxFrac > 0) {
      // Find the last digit in the formatted string and append decimal part after it
      const lastDigitIndex = formatted.search(/\d(?=[^\d]*$)/);
      if (lastDigitIndex !== -1) {
         formatted =
            formatted.slice(0, lastDigitIndex + 1) +
            decimalSep +
            paddedFrac +
            formatted.slice(lastDigitIndex + 1);
      }
   }

   return formatted;
}

/**
 * Format Money as a localized currency string
 *
 * Uses Intl.NumberFormat for locale-aware formatting.
 *
 * @param money - Money value to format
 * @param locale - Locale for formatting (e.g., "en-US", "pt-BR")
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * format(of("1234.56", "USD"), "en-US")           // "$1,234.56"
 * format(of("1234.56", "BRL"), "pt-BR")           // "R$ 1.234,56"
 * format(of("1234", "JPY"), "ja-JP")              // "¥1,234"
 * format(of("1234567.89", "USD"), "en-US", { notation: "compact" }) // "$1.2M"
 */
export function format(
   money: Money,
   locale = "en-US",
   options: FormatOptions = {},
): string {
   const currencyInfo = getCurrency(money.currency);

   // Convert minor units to decimal
   const decimalStr = minorUnitsToDecimal(money.amount, money.scale);

   // Use safe formatting for large amounts to avoid precision loss
   if (!isSafeForFloat(decimalStr)) {
      return formatLargeAmount(decimalStr, money, locale, options);
   }

   const decimalValue = Number.parseFloat(decimalStr);

   // Determine fraction digits
   const minFractionDigits =
      options.minimumFractionDigits ?? currencyInfo.decimalPlaces;
   const maxFractionDigits =
      options.maximumFractionDigits ?? currencyInfo.decimalPlaces;

   if (options.hideSymbol) {
      // Format without currency, just the number
      const formatter = getCachedFormatter(locale, money.currency, {
         minimumFractionDigits: minFractionDigits,
         maximumFractionDigits: maxFractionDigits,
         notation: options.notation,
         signDisplay: options.signDisplay,
      });
      return formatter.format(decimalValue);
   }

   const formatter = getCachedFormatter(locale, money.currency, {
      style: "currency",
      currency: money.currency,
      currencyDisplay: options.currencyDisplay ?? "symbol",
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
      notation: options.notation,
      signDisplay: options.signDisplay,
   });
   return formatter.format(decimalValue);
}

/**
 * Format Money as a compact string (e.g., 1.2K, 3.4M)
 *
 * @param money - Money value to format
 * @param locale - Locale for formatting
 * @returns Compact formatted string
 *
 * @example
 * formatCompact(of("1234567.89", "USD"), "en-US") // "$1.2M"
 * formatCompact(of("1234.56", "BRL"), "pt-BR")    // "R$ 1,23 mil"
 */
export function formatCompact(money: Money, locale = "en-US"): string {
   return format(money, locale, { notation: "compact" });
}

/**
 * Convert Money to decimal string representation
 *
 * Always includes the appropriate number of decimal places.
 * Useful for JSON serialization or display without locale formatting.
 *
 * @param money - Money value
 * @returns Decimal string (e.g., "123.45", "-50.00", "100")
 *
 * @example
 * toDecimal(of("123.45", "USD"))  // "123.45"
 * toDecimal(of("-50", "USD"))     // "-50.00"
 * toDecimal(of("100", "JPY"))     // "100"
 */
export function toDecimal(money: Money): string {
   return minorUnitsToDecimal(money.amount, money.scale);
}

/**
 * Format Money without currency symbol
 *
 * @param money - Money value
 * @param locale - Locale for number formatting
 * @returns Formatted number without currency symbol
 *
 * @example
 * formatAmount(of("1234.56", "USD"), "en-US")  // "1,234.56"
 * formatAmount(of("1234.56", "BRL"), "pt-BR")  // "1.234,56"
 */
export function formatAmount(money: Money, locale = "en-US"): string {
   return format(money, locale, { hideSymbol: true });
}
