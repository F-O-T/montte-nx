/**
 * Base error class for all money-related errors
 */
export class MoneyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MoneyError";
		Error.captureStackTrace?.(this, MoneyError);
	}
}

/**
 * Error thrown when attempting operations on different currencies
 */
export class CurrencyMismatchError extends MoneyError {
	constructor(
		message: string,
		public readonly currencyA: string,
		public readonly currencyB: string,
	) {
		super(message);
		this.name = "CurrencyMismatchError";
	}

	static create(currencyA: string, currencyB: string): CurrencyMismatchError {
		return new CurrencyMismatchError(
			`Cannot operate on different currencies: ${currencyA} and ${currencyB}`,
			currencyA,
			currencyB,
		);
	}
}

/**
 * Error thrown when an invalid amount is provided
 */
export class InvalidAmountError extends MoneyError {
	constructor(message: string) {
		super(message);
		this.name = "InvalidAmountError";
	}
}

/**
 * Error thrown when attempting to divide by zero
 */
export class DivisionByZeroError extends MoneyError {
	constructor(message = "Division by zero") {
		super(message);
		this.name = "DivisionByZeroError";
	}
}

/**
 * Error thrown when a currency code is not found in the registry
 */
export class UnknownCurrencyError extends MoneyError {
	constructor(
		message: string,
		public readonly currencyCode?: string,
	) {
		super(message);
		this.name = "UnknownCurrencyError";
	}
}

/**
 * Error thrown when a value exceeds safe integer range
 */
export class OverflowError extends MoneyError {
	constructor(message = "Value exceeds safe integer range") {
		super(message);
		this.name = "OverflowError";
	}
}
