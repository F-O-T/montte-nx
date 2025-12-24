import { getCurrency } from "../currency/registry";
import { InvalidAmountError } from "../errors";
import type { Money } from "../types";
import { createMoney, parseDecimalToMinorUnits } from "./internal";

/**
 * Create Money from a decimal amount
 *
 * Prefer passing strings for amounts to avoid floating-point precision issues.
 *
 * @param amount - Decimal amount as number or string (e.g., 123.45 or "123.45")
 * @param currency - ISO 4217 currency code
 * @returns Money instance
 *
 * @example
 * of("123.45", "USD") // Preferred - avoids float issues
 * of(123.45, "USD")   // Works but may have precision issues
 * of("100", "JPY")    // Zero-decimal currency
 */
export function of(amount: number | string, currency: string): Money {
	const curr = getCurrency(currency);
	const scale = curr.decimalPlaces;

	// Convert to string for precise parsing
	const amountStr = typeof amount === "number" ? amount.toString() : amount;

	try {
		const minorUnits = parseDecimalToMinorUnits(amountStr, scale);
		return createMoney(minorUnits, currency.toUpperCase(), scale);
	} catch {
		throw new InvalidAmountError(`Invalid amount format: ${amountStr}`);
	}
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

	const amount = typeof minorUnits === "number" ? BigInt(minorUnits) : minorUnits;
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
export function fromMajorUnits(amount: number | string, currency: string): Money {
	return of(amount, currency);
}
