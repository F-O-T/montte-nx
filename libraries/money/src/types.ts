/**
 * Core Money type representing a monetary value with currency
 *
 * @property amount - The amount in minor units (e.g., cents) as a BigInt
 * @property currency - ISO 4217 currency code (e.g., "USD", "BRL", "JPY")
 * @property scale - Number of decimal places for this currency
 */
export interface Money {
	readonly amount: bigint;
	readonly currency: string;
	readonly scale: number;
}

/**
 * Options for formatting money values
 */
export interface FormatOptions {
	/**
	 * Locale for formatting (e.g., "en-US", "pt-BR")
	 */
	locale?: string;

	/**
	 * Notation for formatting
	 * - "standard": Normal number format
	 * - "compact": Abbreviated format (e.g., 1.2K, 3.4M)
	 */
	notation?: "standard" | "compact";

	/**
	 * How to display the sign
	 */
	signDisplay?: "auto" | "always" | "never" | "exceptZero";

	/**
	 * How to display the currency
	 * - "symbol": Currency symbol (e.g., "$", "R$")
	 * - "code": Currency code (e.g., "USD", "BRL")
	 * - "name": Currency name (e.g., "US Dollar", "Brazilian Real")
	 * - "narrowSymbol": Narrow symbol (e.g., "$" instead of "US$")
	 */
	currencyDisplay?: "symbol" | "code" | "name" | "narrowSymbol";

	/**
	 * Hide the currency symbol/code entirely
	 */
	hideSymbol?: boolean;

	/**
	 * Minimum number of fraction digits to display
	 */
	minimumFractionDigits?: number;

	/**
	 * Maximum number of fraction digits to display
	 */
	maximumFractionDigits?: number;
}

/**
 * JSON representation of Money for serialization
 */
export interface MoneyJSON {
	amount: string;
	currency: string;
}

/**
 * Database-friendly representation of Money
 */
export interface DatabaseMoney {
	amount: string;
	currency: string;
}
