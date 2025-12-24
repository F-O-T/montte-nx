/**
 * Banker's rounding (round half to even)
 *
 * When the value is exactly halfway between two values, rounds to the nearest even number.
 * This prevents systematic bias that would occur with traditional rounding.
 *
 * Examples:
 * - 2.5 -> 2 (rounds down to even)
 * - 3.5 -> 4 (rounds up to even)
 * - 2.4 -> 2 (normal round down)
 * - 2.6 -> 3 (normal round up)
 *
 * @param value - The value to round (numerator)
 * @param divisor - The divisor to round by
 * @returns Rounded quotient
 */
export function bankersRound(value: bigint, divisor: bigint): bigint {
	if (divisor === 0n) {
		throw new Error("Division by zero");
	}

	// Handle negative values
	const isNegative = value < 0n !== divisor < 0n;
	const absValue = value < 0n ? -value : value;
	const absDivisor = divisor < 0n ? -divisor : divisor;

	const quotient = absValue / absDivisor;
	const remainder = absValue % absDivisor;
	const half = absDivisor / 2n;

	let result: bigint;

	// If remainder is less than half, round down
	if (remainder < half) {
		result = quotient;
	}
	// If remainder is greater than half, round up
	else if (remainder > half) {
		result = quotient + 1n;
	}
	// Exactly half - round to even
	else {
		// Check if divisor is odd (which means half comparison needs adjustment)
		if (absDivisor % 2n === 1n) {
			// For odd divisors, remainder === half is impossible (floor division)
			// So we round up
			result = quotient + 1n;
		} else {
			// For even divisors, round to nearest even
			if (quotient % 2n === 0n) {
				result = quotient;
			} else {
				result = quotient + 1n;
			}
		}
	}

	return isNegative ? -result : result;
}

/**
 * Round a bigint value with extended precision back to a target scale
 *
 * @param value - Value with extended precision
 * @param fromScale - Current scale (precision) of the value
 * @param toScale - Target scale (currency's decimal places)
 * @returns Rounded value at target scale
 */
export function roundToScale(
	value: bigint,
	fromScale: number,
	toScale: number,
): bigint {
	if (fromScale <= toScale) {
		// Need to scale up - no rounding needed
		const factor = 10n ** BigInt(toScale - fromScale);
		return value * factor;
	}

	// Need to scale down with banker's rounding
	const divisor = 10n ** BigInt(fromScale - toScale);
	return bankersRound(value, divisor);
}

/**
 * Extended precision for intermediate calculations
 * Using 18 decimal places to handle even ETH-level precision
 */
export const EXTENDED_PRECISION = 18;

/**
 * Scale factor for extended precision calculations
 */
export const PRECISION_FACTOR = 10n ** BigInt(EXTENDED_PRECISION);
