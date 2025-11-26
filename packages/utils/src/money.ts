/**
 * Money and currency utility functions
 * Handles currency formatting, conversion, and monetary calculations
 */

export interface CurrencyInfo {
   code: string;
   symbol: string;
   decimalDigits: number;
   name: string;
}

export interface MoneyOptions {
   currency?: string;
   locale?: Intl.LocalesArgument;
   showCurrency?: boolean;
   minimumFractionDigits?: number;
   maximumFractionDigits?: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
   BRL: { code: "BRL", decimalDigits: 2, name: "Brazilian Real", symbol: "R$" },
};

/**
 * Converts an integer amount (cents) to decimal amount (reais)
 */
export function centsToReais(cents: number): number {
   return cents / 100;
}

/**
 * Converts a decimal amount (reais) to integer amount (cents)
 */
export function reaisToCents(reais: number): number {
   return Math.round(reais * 100);
}

/**
 * Formats an amount (in cents) as a currency string
 */
export function formatCurrency(
   amount: number,
   currency: string = "BRL",
   locale: Intl.LocalesArgument = "pt-BR",
   options: Partial<MoneyOptions> = {},
): string {
   if (typeof amount !== "number" || Number.isNaN(amount)) {
      return "";
   }

   const currencyInfo = SUPPORTED_CURRENCIES[currency.toUpperCase()];
   const actualCurrency = currencyInfo?.code || currency.toUpperCase();

   try {
      return new Intl.NumberFormat(locale, {
         currency: actualCurrency,
         maximumFractionDigits:
            options.maximumFractionDigits ?? currencyInfo?.decimalDigits ?? 2,
         minimumFractionDigits:
            options.minimumFractionDigits ?? currencyInfo?.decimalDigits ?? 2,
         style: "currency",
      }).format(amount / 100);
   } catch (error) {
      console.error("Error formatting currency:", error);
      const formattedAmount = (amount / 100).toFixed(
         currencyInfo?.decimalDigits ?? 2,
      );
      return `${currencyInfo?.symbol || actualCurrency} ${formattedAmount}`;
   }
}

/**
 * Formats an amount (in cents) as a compact currency string (e.g., $1.2K, $3.4M)
 */
export function formatCompactCurrency(
   amount: number,
   currency: string = "BRL",
   locale: Intl.LocalesArgument = "pt-BR",
): string {
   if (typeof amount !== "number" || Number.isNaN(amount)) {
      return "";
   }

   const currencyInfo = SUPPORTED_CURRENCIES[currency.toUpperCase()];
   const actualCurrency = currencyInfo?.code || currency.toUpperCase();

   try {
      return new Intl.NumberFormat(locale, {
         compactDisplay: "short",
         currency: actualCurrency,
         notation: "compact",
         style: "currency",
      }).format(amount / 100);
   } catch (error) {
      console.error("Error formatting compact currency:", error);
      // Fallback to regular format
      return formatCurrency(amount, currency, locale);
   }
}

/**
 * Formats a decimal amount as currency
 */
export function formatDecimalCurrency(
   amount: number,
   currency: string = "BRL",
   locale: Intl.LocalesArgument = "pt-BR",
   options: Partial<MoneyOptions> = {},
): string {
   if (typeof amount !== "number" || Number.isNaN(amount)) {
      return "";
   }

   const currencyInfo = SUPPORTED_CURRENCIES[currency.toUpperCase()];
   const actualCurrency = currencyInfo?.code || currency.toUpperCase();

   try {
      return new Intl.NumberFormat(locale, {
         currency: actualCurrency,
         maximumFractionDigits:
            options.maximumFractionDigits ?? currencyInfo?.decimalDigits ?? 2,
         minimumFractionDigits:
            options.minimumFractionDigits ?? currencyInfo?.decimalDigits ?? 2,
         style: "currency",
      }).format(amount);
   } catch (error) {
      console.error("Error formatting decimal currency:", error);
      // Fallback to basic formatting
      const formattedAmount = amount.toFixed(currencyInfo?.decimalDigits ?? 2);
      return `${currencyInfo?.symbol || actualCurrency} ${formattedAmount}`;
   }
}

/**
 * Parses a currency string back to amount in cents
 * Note: This is a basic parser and may not handle all locale formats
 */
export function parseCurrencyToCents(
   currencyString: string,
   _currency: string = "BRL",
): number | null {
   if (typeof currencyString !== "string" || !currencyString.trim()) {
      return null;
   }

   try {
      // Remove currency symbols and common formatting characters
      const cleanString = currencyString
         .replace(/[^\d.,-]/g, "")
         .replace(/,/g, "")
         .trim();

      const decimalAmount = parseFloat(cleanString);
      if (Number.isNaN(decimalAmount)) {
         return null;
      }

      return reaisToCents(decimalAmount);
   } catch {
      return null;
   }
}

/**
 * Validates if a currency code is supported
 */
export function isValidCurrency(currency: string): boolean {
   return currency.toUpperCase() in SUPPORTED_CURRENCIES;
}

/**
 * Gets currency information for a given currency code
 */
export function getCurrencyInfo(currency: string): CurrencyInfo | null {
   return SUPPORTED_CURRENCIES[currency.toUpperCase()] || null;
}

/**
 * Adds two monetary amounts (in cents) safely
 */
export function addMoney(amount1: number, amount2: number): number {
   return Math.round((amount1 + amount2) * 100) / 100;
}

/**
 * Subtracts two monetary amounts (in cents) safely
 */
export function subtractMoney(amount1: number, amount2: number): number {
   return Math.round((amount1 - amount2) * 100) / 100;
}

/**
 * Multiplies a monetary amount (in cents) by a factor safely
 */
export function multiplyMoney(amount: number, factor: number): number {
   return Math.round(amount * factor * 100) / 100;
}

/**
 * Divides a monetary amount (in cents) by a divisor safely
 */
export function divideMoney(amount: number, divisor: number): number {
   if (divisor === 0) throw new Error("Cannot divide by zero");
   return Math.round((amount / divisor) * 100) / 100;
}

/**
 * Calculates percentage of a monetary amount
 */
export function calculatePercentage(
   amount: number,
   percentage: number,
): number {
   return Math.round(((amount * percentage) / 100) * 100) / 100;
}

/**
 * Rounds an amount (in cents) to the nearest cent
 */
export function roundToCents(amount: number): number {
   return Math.round(amount * 100) / 100;
}

/**
 * Compares two monetary amounts (in cents)
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareMoney(amount1: number, amount2: number): number {
   const diff = amount1 - amount2;
   return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/**
 * Checks if two monetary amounts are equal
 */
export function moneyEquals(amount1: number, amount2: number): boolean {
   return compareMoney(amount1, amount2) === 0;
}

/**
 * Formats an amount without currency symbol
 */
export function formatAmountWithoutCurrency(
   amount: number,
   currency: string = "BRL",
   locale: Intl.LocalesArgument = "pt-BR",
): string {
   const currencyInfo = SUPPORTED_CURRENCIES[currency.toUpperCase()];

   try {
      return new Intl.NumberFormat(locale, {
         maximumFractionDigits: currencyInfo?.decimalDigits ?? 2,
         minimumFractionDigits: currencyInfo?.decimalDigits ?? 2,
      }).format(amount / 100);
   } catch (error) {
      console.error("Error formatting amount without currency:", error);
      return (amount / 100).toFixed(currencyInfo?.decimalDigits ?? 2);
   }
}
