import { assertAllSameCurrency } from "../core/assertions";
import { createMoney, maxBigInt, minBigInt } from "../core/internal";
import { zero } from "../core/money";
import { bankersRound } from "../core/rounding";
import { InvalidAmountError } from "../errors";
import type { Money } from "../types";

/**
 * Sum an array of Money values
 *
 * @param moneys - Array of Money values (must all be same currency)
 * @returns Sum of all values
 * @throws CurrencyMismatchError if currencies don't match
 * @throws InvalidAmountError if array is empty
 *
 * @example
 * sum([of("10.00", "USD"), of("20.00", "USD"), of("30.00", "USD")]) // $60.00
 */
export function sum(moneys: Money[]): Money {
   if (moneys.length === 0) {
      throw new InvalidAmountError("Cannot sum empty array");
   }

   assertAllSameCurrency(moneys);

   const first = moneys[0] as Money;
   let total = 0n;

   for (const money of moneys) {
      total += money.amount;
   }

   return createMoney(total, first.currency, first.scale);
}

/**
 * Sum an array of Money values, returning zero if empty
 *
 * @param moneys - Array of Money values
 * @param currency - Currency to use for zero if array is empty
 * @returns Sum of all values, or zero of the specified currency
 *
 * @example
 * sumOrZero([of("10.00", "USD")], "USD")  // $10.00
 * sumOrZero([], "USD")                     // $0.00
 */
export function sumOrZero(moneys: Money[], currency: string): Money {
   if (moneys.length === 0) {
      return zero(currency);
   }
   return sum(moneys);
}

/**
 * Find the minimum Money value
 *
 * @param moneys - Array of Money values (must all be same currency)
 * @returns Minimum value
 * @throws CurrencyMismatchError if currencies don't match
 * @throws InvalidAmountError if array is empty
 *
 * @example
 * min([of("10.00", "USD"), of("5.00", "USD"), of("20.00", "USD")]) // $5.00
 */
export function min(moneys: Money[]): Money {
   if (moneys.length === 0) {
      throw new InvalidAmountError("Cannot find min of empty array");
   }

   assertAllSameCurrency(moneys);

   const first = moneys[0] as Money;
   let minAmount = first.amount;

   for (let i = 1; i < moneys.length; i++) {
      const current = moneys[i] as Money;
      minAmount = minBigInt(minAmount, current.amount);
   }

   return createMoney(minAmount, first.currency, first.scale);
}

/**
 * Find the maximum Money value
 *
 * @param moneys - Array of Money values (must all be same currency)
 * @returns Maximum value
 * @throws CurrencyMismatchError if currencies don't match
 * @throws InvalidAmountError if array is empty
 *
 * @example
 * max([of("10.00", "USD"), of("5.00", "USD"), of("20.00", "USD")]) // $20.00
 */
export function max(moneys: Money[]): Money {
   if (moneys.length === 0) {
      throw new InvalidAmountError("Cannot find max of empty array");
   }

   assertAllSameCurrency(moneys);

   const first = moneys[0] as Money;
   let maxAmount = first.amount;

   for (let i = 1; i < moneys.length; i++) {
      const current = moneys[i] as Money;
      maxAmount = maxBigInt(maxAmount, current.amount);
   }

   return createMoney(maxAmount, first.currency, first.scale);
}

/**
 * Calculate the average of Money values
 *
 * Uses banker's rounding for the result.
 *
 * @param moneys - Array of Money values (must all be same currency)
 * @returns Average value with banker's rounding
 * @throws CurrencyMismatchError if currencies don't match
 * @throws InvalidAmountError if array is empty
 *
 * @example
 * average([of("10.00", "USD"), of("20.00", "USD"), of("30.00", "USD")]) // $20.00
 * average([of("10.00", "USD"), of("10.00", "USD"), of("10.00", "USD")]) // $10.00
 * average([of("1.00", "USD"), of("2.00", "USD")])                        // $1.50
 */
export function average(moneys: Money[]): Money {
   if (moneys.length === 0) {
      throw new InvalidAmountError("Cannot calculate average of empty array");
   }

   assertAllSameCurrency(moneys);

   const first = moneys[0] as Money;
   const total = moneys.reduce((acc, m) => acc + m.amount, 0n);

   // Use banker's rounding for the average
   const avgAmount = bankersRound(total, BigInt(moneys.length));

   return createMoney(avgAmount, first.currency, first.scale);
}

/**
 * Calculate median of Money values
 *
 * For even-length arrays, returns the average of the two middle values.
 *
 * @param moneys - Array of Money values (must all be same currency)
 * @returns Median value
 * @throws CurrencyMismatchError if currencies don't match
 * @throws InvalidAmountError if array is empty
 *
 * @example
 * median([of("1.00", "USD"), of("2.00", "USD"), of("3.00", "USD")]) // $2.00
 * median([of("1.00", "USD"), of("2.00", "USD"), of("3.00", "USD"), of("4.00", "USD")]) // $2.50
 */
export function median(moneys: Money[]): Money {
   if (moneys.length === 0) {
      throw new InvalidAmountError("Cannot calculate median of empty array");
   }

   assertAllSameCurrency(moneys);

   // Sort by amount
   const sorted = [...moneys].sort((a, b) => {
      if (a.amount < b.amount) return -1;
      if (a.amount > b.amount) return 1;
      return 0;
   });

   const mid = Math.floor(sorted.length / 2);

   if (sorted.length % 2 === 0) {
      // Even length: average of two middle values
      const left = sorted[mid - 1] as Money;
      const right = sorted[mid] as Money;
      return average([left, right]);
   }

   // Odd length: middle value
   return sorted[mid] as Money;
}
