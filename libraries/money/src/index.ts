// =============================================================================
// @f-o-t/money - Type-safe money handling with BigInt precision
// =============================================================================

export { assertAllSameCurrency, assertSameCurrency } from "./core/assertions";
export {
   createMoney,
   minorUnitsToDecimal,
   parseDecimalToMinorUnits,
} from "./core/internal";

// Factory functions
export {
   fromMajorUnits,
   fromMinorUnits,
   of,
   ofRounded,
   zero,
} from "./core/money";
// Core utilities (for advanced use cases)
export {
   bankersRound,
   EXTENDED_PRECISION,
   PRECISION_FACTOR,
} from "./core/rounding";
export { ISO_4217_CURRENCIES } from "./currency/currencies";
// Currency registry
export {
   clearCustomCurrencies,
   getAllCurrencies,
   getCurrency,
   hasCurrency,
   registerCurrency,
} from "./currency/registry";
export type { Currency } from "./currency/types";
// Errors
export {
   CurrencyMismatchError,
   DivisionByZeroError,
   InvalidAmountError,
   MoneyError,
   OverflowError,
   ScaleMismatchError,
   UnknownCurrencyError,
} from "./errors";
// Formatting
export {
   format,
   formatAmount,
   formatCompact,
   toDecimal,
} from "./formatting/format";
export { parse } from "./formatting/parse";
// Aggregation
export {
   average,
   max,
   median,
   min,
   sum,
   sumOrZero,
} from "./operations/aggregation";
// Allocation
export { allocate, split } from "./operations/allocation";
// Arithmetic operations
export {
   absolute,
   add,
   divide,
   multiply,
   negate,
   percentage,
   subtract,
} from "./operations/arithmetic";
// Comparison operations (convenience functions)
// Comparison operators (for condition-evaluator integration)
export {
   compare,
   equals,
   greaterThan,
   greaterThanOrEqual,
   isNegative,
   isPositive,
   isZero,
   lessThan,
   lessThanOrEqual,
   moneyBetweenOperator,
   moneyEqualsOperator,
   moneyGreaterThanOperator,
   moneyGreaterThanOrEqualOperator,
   moneyLessThanOperator,
   moneyLessThanOrEqualOperator,
   moneyNegativeOperator,
   moneyNotEqualsOperator,
   moneyPositiveOperator,
   moneyZeroOperator,
} from "./operations/comparison";
// Schemas
export {
   type AllocationRatios,
   AllocationRatiosSchema,
   AmountStringSchema,
   CurrencyCodeSchema,
   type CurrencyInput,
   CurrencySchema,
   DatabaseMoneySchema,
   FormatOptionsSchema,
   type MoneyInput,
   MoneyInputSchema,
   MoneyInternalSchema,
   MoneySchema,
} from "./schemas";
export {
   toMajorUnits,
   toMajorUnitsString,
   toMinorUnits,
   toMinorUnitsBigInt,
   toMinorUnitsString,
} from "./serialization/conversion";
// Serialization
export {
   deserialize,
   fromDatabase,
   fromJSON,
   serialize,
   toDatabase,
   toJSON,
} from "./serialization/json";
// Types
export type {
   DatabaseMoney,
   FormatOptions,
   Money,
   MoneyJSON,
   RoundingMode,
} from "./types";
