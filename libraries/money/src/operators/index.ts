/**
 * Money operators for @f-o-t/condition-evaluator integration
 *
 * Use this export to register all money operators with an evaluator:
 *
 * @example
 * import { createEvaluator } from "@f-o-t/condition-evaluator";
 * import { moneyOperators } from "@f-o-t/money/operators";
 *
 * const evaluator = createEvaluator({
 *    operators: moneyOperators
 * });
 *
 * evaluator.evaluate({
 *    type: "custom",
 *    field: "transactionAmount",
 *    operator: "money_gt",
 *    value: { amount: "100.00", currency: "BRL" }
 * }, { data: { transactionAmount: { amount: "150.00", currency: "BRL" } } });
 */

import {
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
} from "../operations/comparison";

/**
 * All money operators as a map for condition-evaluator
 *
 * Operators included:
 * - `money_eq` - Equal
 * - `money_neq` - Not equal
 * - `money_gt` - Greater than
 * - `money_gte` - Greater than or equal
 * - `money_lt` - Less than
 * - `money_lte` - Less than or equal
 * - `money_between` - Between two values (inclusive)
 * - `money_positive` - Is positive (> 0)
 * - `money_negative` - Is negative (< 0)
 * - `money_zero` - Is zero
 */
export const moneyOperators = {
   money_eq: moneyEqualsOperator,
   money_neq: moneyNotEqualsOperator,
   money_gt: moneyGreaterThanOperator,
   money_gte: moneyGreaterThanOrEqualOperator,
   money_lt: moneyLessThanOperator,
   money_lte: moneyLessThanOrEqualOperator,
   money_between: moneyBetweenOperator,
   money_positive: moneyPositiveOperator,
   money_negative: moneyNegativeOperator,
   money_zero: moneyZeroOperator,
} as const;

// Re-export individual operators for selective use
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
};

// Type for the operators map
export type MoneyOperators = typeof moneyOperators;
