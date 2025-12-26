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
   Currency,
   CurrencyInput,
   DatabaseMoney,
   FormatOptions,
   Money,
   MoneyInput,
   MoneyJSON,
} from "@f-o-t/money";
// =============================================================================
// Re-export factory functions
// =============================================================================
// =============================================================================
// Re-export arithmetic operations
// =============================================================================
// =============================================================================
// Re-export comparison operations
// =============================================================================
// =============================================================================
// Re-export allocation operations
// =============================================================================
// =============================================================================
// Re-export aggregation operations
// =============================================================================
// =============================================================================
// Re-export formatting functions
// =============================================================================
// =============================================================================
// Re-export serialization functions
// =============================================================================
// =============================================================================
// Re-export currency registry
// =============================================================================
// =============================================================================
// Re-export schemas
// =============================================================================
// =============================================================================
// Re-export errors
// =============================================================================
// =============================================================================
// Re-export comparison operators (for condition-evaluator integration)
// =============================================================================
export {
   type AllocationRatios,
   AllocationRatiosSchema,
   AmountStringSchema,
   absolute,
   add,
   allocate,
   average,
   CurrencyCodeSchema,
   CurrencyMismatchError,
   CurrencySchema,
   clearCustomCurrencies,
   compare,
   DatabaseMoneySchema,
   DivisionByZeroError,
   deserialize,
   divide,
   equals,
   FormatOptionsSchema,
   format,
   formatAmount,
   formatCompact,
   fromDatabase,
   fromJSON,
   fromMajorUnits,
   fromMinorUnits,
   getAllCurrencies,
   getCurrency,
   greaterThan,
   greaterThanOrEqual,
   hasCurrency,
   InvalidAmountError,
   ISO_4217_CURRENCIES,
   isNegative,
   isPositive,
   isZero,
   lessThan,
   lessThanOrEqual,
   MoneyError,
   MoneyInputSchema,
   MoneyInternalSchema,
   MoneySchema,
   max,
   median,
   min,
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
   multiply,
   negate,
   OverflowError,
   of,
   parse,
   percentage,
   registerCurrency,
   serialize,
   split,
   subtract,
   sum,
   sumOrZero,
   toDatabase,
   toDecimal,
   toJSON,
   toMajorUnits,
   toMinorUnits,
   toMinorUnitsBigInt,
   toMinorUnitsString,
   UnknownCurrencyError,
   zero,
} from "@f-o-t/money";
export {
   centsToReais,
   centsToReaisString,
   fromCents,
   fromDecimal,
   reaisToCents,
   toCents,
} from "./convert";
// =============================================================================
// App-specific helpers with BRL defaults
// =============================================================================
export {
   formatAmountOnly,
   formatCompactCurrency,
   formatCurrency,
   formatDecimalCurrency,
   formatMoney,
} from "./format";
