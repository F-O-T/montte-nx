import { of } from "../core/money";
import { getCurrency } from "../currency/registry";
import { InvalidAmountError } from "../errors";
import type { Money } from "../types";

/**
 * Parse a formatted currency string into Money
 *
 * Handles locale-specific formatting including:
 * - Different decimal separators (. or ,)
 * - Different grouping separators (, or . or space)
 * - Currency symbols and codes
 * - Negative amounts in various formats
 *
 * @param formatted - Formatted currency string (e.g., "R$ 1.234,56", "$1,234.56")
 * @param locale - Locale used for formatting (e.g., "pt-BR", "en-US")
 * @param currency - ISO 4217 currency code
 * @returns Money instance
 *
 * @example
 * parse("R$ 1.234,56", "pt-BR", "BRL")  // 1234.56 BRL
 * parse("$1,234.56", "en-US", "USD")    // 1234.56 USD
 * parse("(€1.234,56)", "de-DE", "EUR")  // -1234.56 EUR
 * parse("-¥1,234", "ja-JP", "JPY")      // -1234 JPY
 */
export function parse(
   formatted: string,
   locale: string,
   currency: string,
): Money {
   // Validate currency exists
   getCurrency(currency);

   // Detect locale-specific separators using Intl.NumberFormat
   const parts = new Intl.NumberFormat(locale).formatToParts(12345.67);
   const decimalSep = parts.find((p) => p.type === "decimal")?.value || ".";
   const groupSep = parts.find((p) => p.type === "group")?.value || ",";

   // Detect if negative is in parentheses format
   const hasParenthesesNegative =
      formatted.includes("(") && formatted.includes(")");
   const isNegative = hasParenthesesNegative || formatted.includes("-");

   // Clean the string
   let cleanStr = formatted;

   // Remove parentheses for negative
   if (hasParenthesesNegative) {
      cleanStr = cleanStr.replace(/[()]/g, "");
   }

   // Remove currency symbols and codes (keep digits, minus, and separators)
   // First remove known currency symbols
   const currencyInfo = getCurrency(currency);
   if (currencyInfo.symbol) {
      cleanStr = cleanStr.replace(
         new RegExp(escapeRegex(currencyInfo.symbol), "g"),
         "",
      );
   }
   cleanStr = cleanStr.replace(new RegExp(currency, "gi"), "");

   // Remove all non-numeric characters except decimal separator, grouping separator, and minus
   const safeDecimalSep = escapeRegex(decimalSep);
   const safeGroupSep = escapeRegex(groupSep);
   cleanStr = cleanStr.replace(
      new RegExp(`[^\\d${safeDecimalSep}${safeGroupSep}\\-]`, "g"),
      "",
   );

   // Remove grouping separators
   cleanStr = cleanStr.replace(new RegExp(safeGroupSep, "g"), "");

   // Validate: should have at most one decimal separator
   const decimalSepRegex = new RegExp(safeDecimalSep, "g");
   const decimalMatches = cleanStr.match(decimalSepRegex);
   if (decimalMatches && decimalMatches.length > 1) {
      throw new InvalidAmountError(
         `Multiple decimal separators found in: ${formatted}`,
      );
   }

   // Normalize decimal separator to dot (single replacement now guaranteed)
   cleanStr = cleanStr.replace(new RegExp(safeDecimalSep), ".");

   // Handle minus sign
   cleanStr = cleanStr.replace(/-/g, "");

   // Trim whitespace
   cleanStr = cleanStr.trim();

   if (!cleanStr || cleanStr === ".") {
      throw new InvalidAmountError(`Could not parse amount from: ${formatted}`);
   }

   // Prepend minus if negative
   if (isNegative) {
      cleanStr = `-${cleanStr}`;
   }

   return of(cleanStr, currency);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
