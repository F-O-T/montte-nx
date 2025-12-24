import type { Money } from "../types";

/**
 * Create an immutable Money object
 *
 * @param amount - Amount in minor units as BigInt
 * @param currency - ISO 4217 currency code (uppercase)
 * @param scale - Number of decimal places for this currency
 * @returns Frozen Money object
 */
export function createMoney(
	amount: bigint,
	currency: string,
	scale: number,
): Money {
	return Object.freeze({ amount, currency, scale });
}

/**
 * Get the scale factor for a given number of decimal places
 *
 * @param scale - Number of decimal places
 * @returns 10^scale as BigInt
 */
export function getScaleFactor(scale: number): bigint {
	return 10n ** BigInt(scale);
}

/**
 * Parse a decimal string to minor units
 *
 * @param amountStr - Decimal string (e.g., "123.45", "100", "-50.5")
 * @param scale - Target scale (decimal places)
 * @returns Amount in minor units as BigInt
 */
export function parseDecimalToMinorUnits(
	amountStr: string,
	scale: number,
): bigint {
	// Normalize the string
	const normalized = amountStr.trim();

	// Check for negative
	const isNegative = normalized.startsWith("-");
	const absStr = isNegative ? normalized.slice(1) : normalized;

	// Split by decimal point
	const parts = absStr.split(".");
	const intPart = parts[0] || "0";
	const decPart = parts[1] || "";

	// Validate format
	if (!/^\d*$/.test(intPart) || !/^\d*$/.test(decPart)) {
		throw new Error(`Invalid amount format: ${amountStr}`);
	}

	// Pad or truncate decimal part to match scale
	let adjustedDecPart: string;
	if (decPart.length <= scale) {
		// Pad with zeros
		adjustedDecPart = decPart.padEnd(scale, "0");
	} else {
		// Truncate (no rounding at this level - rounding happens in arithmetic)
		adjustedDecPart = decPart.slice(0, scale);
	}

	// Combine integer and decimal parts
	const combined = intPart + adjustedDecPart;

	// Parse as BigInt
	const amount = BigInt(combined);

	return isNegative ? -amount : amount;
}

/**
 * Convert minor units to decimal string
 *
 * @param amount - Amount in minor units
 * @param scale - Number of decimal places
 * @returns Decimal string representation
 */
export function minorUnitsToDecimal(amount: bigint, scale: number): string {
	if (scale === 0) {
		return amount.toString();
	}

	const isNegative = amount < 0n;
	const absAmount = isNegative ? -amount : amount;
	const str = absAmount.toString().padStart(scale + 1, "0");

	const intPart = str.slice(0, -scale) || "0";
	const decPart = str.slice(-scale);

	const result = `${intPart}.${decPart}`;
	return isNegative ? `-${result}` : result;
}

/**
 * Absolute value for BigInt
 */
export function absBigInt(value: bigint): bigint {
	return value < 0n ? -value : value;
}

/**
 * Maximum of two BigInt values
 */
export function maxBigInt(a: bigint, b: bigint): bigint {
	return a > b ? a : b;
}

/**
 * Minimum of two BigInt values
 */
export function minBigInt(a: bigint, b: bigint): bigint {
	return a < b ? a : b;
}
