/**
 * @packages/money - App-specific money handling wrapper
 *
 * This package wraps @f-o-t/money with BRL defaults and provides
 * drop-in replacements for the old @packages/money functions.
 *
 * @example
 * // Simple formatting
 * import { formatCurrency, formatDecimalCurrency } from "@packages/money";
 * formatCurrency(12345) // "R$ 123,45"
 * formatDecimalCurrency(123.45) // "R$ 123,45"
 *
 * @example
 * // Working with Money objects
 * import { of, add, format, toMinorUnits } from "@packages/money";
 * const a = of("100.00", "BRL");
 * const b = of("50.00", "BRL");
 * const sum = add(a, b);
 * format(sum, "pt-BR") // "R$ 150,00"
 * toMinorUnits(sum) // 15000
 *
 * @example
 * // Fair allocation (splitting bills)
 * import { of, allocate, toMinorUnits } from "@packages/money";
 * const total = of("100.00", "BRL");
 * const shares = allocate(total, [1, 1, 1]); // Split 3 ways
 * shares.map(toMinorUnits) // [3334, 3333, 3333] - sum = 10000
 */

// =============================================================================
// Re-export core types from @f-o-t/money
// =============================================================================
export type {
	Money,
	FormatOptions,
	MoneyJSON,
	DatabaseMoney,
	Currency,
	MoneyInput,
	CurrencyInput,
} from "@f-o-t/money";

// =============================================================================
// Re-export factory functions
// =============================================================================
export { of, fromMinorUnits, zero, fromMajorUnits, parse } from "@f-o-t/money";

// =============================================================================
// Re-export arithmetic operations
// =============================================================================
export {
	add,
	subtract,
	multiply,
	divide,
	percentage,
	negate,
	absolute,
} from "@f-o-t/money";

// =============================================================================
// Re-export comparison operations
// =============================================================================
export {
	equals,
	greaterThan,
	greaterThanOrEqual,
	lessThan,
	lessThanOrEqual,
	isPositive,
	isNegative,
	isZero,
	compare,
} from "@f-o-t/money";

// =============================================================================
// Re-export allocation operations
// =============================================================================
export { allocate, split } from "@f-o-t/money";

// =============================================================================
// Re-export aggregation operations
// =============================================================================
export { sum, sumOrZero, min, max, average, median } from "@f-o-t/money";

// =============================================================================
// Re-export formatting functions
// =============================================================================
export { format, formatCompact, toDecimal, formatAmount } from "@f-o-t/money";

// =============================================================================
// Re-export serialization functions
// =============================================================================
export {
	moneyToJSON,
	fromJSON,
	toDatabase,
	fromDatabase,
	serialize,
	deserialize,
	toMinorUnits,
	toMinorUnitsBigInt,
	toMajorUnits,
	toMinorUnitsString,
} from "@f-o-t/money";

// =============================================================================
// Re-export currency registry
// =============================================================================
export {
	getCurrency,
	registerCurrency,
	hasCurrency,
	getAllCurrencies,
	clearCustomCurrencies,
	ISO_4217_CURRENCIES,
} from "@f-o-t/money";

// =============================================================================
// Re-export schemas
// =============================================================================
export {
	MoneySchema,
	CurrencyCodeSchema,
	AmountStringSchema,
	DatabaseMoneySchema,
	MoneyInputSchema,
	CurrencySchema,
	AllocationRatiosSchema,
} from "@f-o-t/money";

// =============================================================================
// Re-export errors
// =============================================================================
export {
	MoneyError,
	CurrencyMismatchError,
	InvalidAmountError,
	DivisionByZeroError,
	UnknownCurrencyError,
	OverflowError,
} from "@f-o-t/money";

// =============================================================================
// Re-export comparison operators (for condition-evaluator integration)
// =============================================================================
export {
	moneyEqualsOperator,
	moneyNotEqualsOperator,
	moneyGreaterThanOperator,
	moneyGreaterThanOrEqualOperator,
	moneyLessThanOperator,
	moneyLessThanOrEqualOperator,
	moneyBetweenOperator,
	moneyPositiveOperator,
	moneyNegativeOperator,
	moneyZeroOperator,
} from "@f-o-t/money";

// =============================================================================
// App-specific helpers with BRL defaults
// =============================================================================
export {
	formatCurrency,
	formatDecimalCurrency,
	formatCompactCurrency,
	formatMoney,
	formatAmountOnly,
} from "./format";

export {
	centsToReais,
	centsToReaisString,
	reaisToCents,
	fromCents,
	fromDecimal,
	toCents,
} from "./convert";
