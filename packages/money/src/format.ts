import {
	format,
	formatCompact,
	formatAmount,
	of,
	fromMinorUnits,
} from "@f-o-t/money";
import type { Money, FormatOptions } from "@f-o-t/money";

const DEFAULT_CURRENCY = "BRL";
const DEFAULT_LOCALE = "pt-BR";

/**
 * Format cents as BRL currency string
 *
 * @param cents - Amount in cents (minor units)
 * @param currency - Currency code (default: BRL)
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 *
 * @example
 * formatCurrency(123456) // "R$ 1.234,56"
 * formatCurrency(100, "USD") // "$1.00"
 */
export function formatCurrency(
	cents: number,
	currency = DEFAULT_CURRENCY,
): string {
	return format(fromMinorUnits(cents, currency), DEFAULT_LOCALE);
}

/**
 * Format decimal amount as BRL currency string
 *
 * @param amount - Decimal amount (e.g., 1234.56)
 * @param currency - Currency code (default: BRL)
 * @returns Formatted currency string
 *
 * @example
 * formatDecimalCurrency(1234.56) // "R$ 1.234,56"
 */
export function formatDecimalCurrency(
	amount: number,
	currency = DEFAULT_CURRENCY,
): string {
	return format(of(String(amount), currency), DEFAULT_LOCALE);
}

/**
 * Format cents in compact notation
 *
 * @param cents - Amount in cents (minor units)
 * @param currency - Currency code (default: BRL)
 * @returns Compact formatted string (e.g., "R$ 1,2K")
 *
 * @example
 * formatCompactCurrency(123456789) // "R$ 1,2M"
 */
export function formatCompactCurrency(
	cents: number,
	currency = DEFAULT_CURRENCY,
): string {
	return formatCompact(fromMinorUnits(cents, currency), DEFAULT_LOCALE);
}

/**
 * Format Money value as BRL string
 *
 * @param money - Money object
 * @param options - Optional formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatMoney(of("1234.56", "BRL")) // "R$ 1.234,56"
 */
export function formatMoney(money: Money, options?: FormatOptions): string {
	return format(money, DEFAULT_LOCALE, options);
}

/**
 * Format amount without currency symbol
 *
 * @param money - Money object
 * @returns Formatted amount without symbol (e.g., "1.234,56")
 */
export function formatAmountOnly(money: Money): string {
	return formatAmount(money, DEFAULT_LOCALE);
}
