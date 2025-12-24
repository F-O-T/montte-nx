// =============================================================================
// @f-o-t/money - Type-safe money handling with BigInt precision
// =============================================================================

// Types
export type { Money, FormatOptions, MoneyJSON, DatabaseMoney } from "./types";
export type { Currency } from "./currency/types";

// Factory functions
export { of, fromMinorUnits, zero, fromMajorUnits } from "./core/money";
export { parse } from "./formatting/parse";

// Arithmetic operations
export {
	add,
	subtract,
	multiply,
	divide,
	percentage,
	negate,
	absolute,
} from "./operations/arithmetic";

// Comparison operations (convenience functions)
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
	toJSON,
} from "./operations/comparison";

// Comparison operators (for condition-evaluator integration)
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
} from "./operations/comparison";

// Allocation
export { allocate, split } from "./operations/allocation";

// Aggregation
export { sum, sumOrZero, min, max, average, median } from "./operations/aggregation";

// Formatting
export { format, formatCompact, toDecimal, formatAmount } from "./formatting/format";

// Serialization
export {
	toJSON as moneyToJSON,
	fromJSON,
	toDatabase,
	fromDatabase,
	serialize,
	deserialize,
} from "./serialization/json";
export {
	toMinorUnits,
	toMinorUnitsBigInt,
	toMajorUnits,
	toMinorUnitsString,
} from "./serialization/conversion";

// Currency registry
export {
	getCurrency,
	registerCurrency,
	hasCurrency,
	getAllCurrencies,
	clearCustomCurrencies,
} from "./currency/registry";
export { ISO_4217_CURRENCIES } from "./currency/currencies";

// Schemas
export {
	MoneySchema,
	CurrencyCodeSchema,
	AmountStringSchema,
	DatabaseMoneySchema,
	MoneyInputSchema,
	CurrencySchema,
	AllocationRatiosSchema,
	type MoneyInput,
	type CurrencyInput,
} from "./schemas";

// Errors
export {
	MoneyError,
	CurrencyMismatchError,
	InvalidAmountError,
	DivisionByZeroError,
	UnknownCurrencyError,
	OverflowError,
} from "./errors";

// Core utilities (for advanced use cases)
export { bankersRound, roundToScale, EXTENDED_PRECISION, PRECISION_FACTOR } from "./core/rounding";
export { createMoney, parseDecimalToMinorUnits, minorUnitsToDecimal } from "./core/internal";
