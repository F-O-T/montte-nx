/**
 * Currency definition following ISO 4217 standard
 */
export interface Currency {
	/**
	 * ISO 4217 alphabetic code (e.g., "USD", "BRL", "JPY")
	 */
	code: string;

	/**
	 * ISO 4217 numeric code (e.g., 840 for USD, 986 for BRL)
	 * Use 0 for non-ISO currencies like cryptocurrencies
	 */
	numericCode: number;

	/**
	 * Full currency name (e.g., "US Dollar", "Brazilian Real")
	 */
	name: string;

	/**
	 * Number of decimal places (minor unit exponent)
	 * - 2 for most currencies (USD, EUR, BRL)
	 * - 0 for currencies like JPY, KRW
	 * - 3 for currencies like KWD, BHD
	 * - 8 for Bitcoin
	 */
	decimalPlaces: number;

	/**
	 * Currency symbol (e.g., "$", "R$", "")
	 */
	symbol?: string;

	/**
	 * Name of the minor unit (e.g., "cent", "centavo", "sen")
	 */
	subunitName?: string;
}
