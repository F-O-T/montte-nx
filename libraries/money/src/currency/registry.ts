import { UnknownCurrencyError } from "../errors";
import { ISO_4217_CURRENCIES } from "./currencies";
import type { Currency } from "./types";

/**
 * Custom currencies registered at runtime
 */
const customCurrencies: Map<string, Currency> = new Map();

/**
 * Get a currency by its code
 *
 * @param code - ISO 4217 currency code (case-insensitive)
 * @returns Currency definition
 * @throws UnknownCurrencyError if currency is not found
 */
export function getCurrency(code: string): Currency {
   const upperCode = code.toUpperCase();

   // Check custom currencies first (allows overriding ISO currencies)
   const custom = customCurrencies.get(upperCode);
   if (custom) return custom;

   // Check ISO 4217 currencies
   const iso = ISO_4217_CURRENCIES[upperCode];
   if (iso) return iso;

   throw new UnknownCurrencyError(`Unknown currency: ${code}`, upperCode);
}

/**
 * Register a custom currency
 *
 * Can be used to add new currencies or override existing ones.
 *
 * @param currency - Currency definition to register
 */
export function registerCurrency(currency: Currency): void {
   customCurrencies.set(currency.code.toUpperCase(), currency);
}

/**
 * Check if a currency code is registered
 *
 * @param code - ISO 4217 currency code (case-insensitive)
 * @returns true if currency exists
 */
export function hasCurrency(code: string): boolean {
   const upperCode = code.toUpperCase();
   return customCurrencies.has(upperCode) || upperCode in ISO_4217_CURRENCIES;
}

/**
 * Get all registered currencies (both ISO and custom)
 *
 * @returns Record of all currencies keyed by code
 */
export function getAllCurrencies(): Record<string, Currency> {
   return {
      ...ISO_4217_CURRENCIES,
      ...Object.fromEntries(customCurrencies),
   };
}

/**
 * Clear all custom currencies (useful for testing)
 */
export function clearCustomCurrencies(): void {
   customCurrencies.clear();
}
