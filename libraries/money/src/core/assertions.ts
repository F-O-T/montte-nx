import { CurrencyMismatchError, ScaleMismatchError } from "../errors";
import type { Money } from "../types";

/**
 * Assert that two Money values have the same currency and scale
 * @throws CurrencyMismatchError if currencies don't match
 * @throws ScaleMismatchError if scales don't match
 */
export function assertSameCurrency(a: Money, b: Money): void {
   if (a.currency !== b.currency) {
      throw CurrencyMismatchError.create(a.currency, b.currency);
   }
   if (a.scale !== b.scale) {
      throw ScaleMismatchError.create(a.currency, a.scale, b.scale);
   }
}

/**
 * Assert all Money values in an array have the same currency and scale
 * @throws CurrencyMismatchError if currencies don't match
 * @throws ScaleMismatchError if scales don't match
 */
export function assertAllSameCurrency(moneys: Money[]): void {
   if (moneys.length === 0) return;

   const first = moneys[0] as Money;
   for (let i = 1; i < moneys.length; i++) {
      const current = moneys[i] as Money;
      if (current.currency !== first.currency) {
         throw CurrencyMismatchError.create(first.currency, current.currency);
      }
      if (current.scale !== first.scale) {
         throw ScaleMismatchError.create(
            first.currency,
            first.scale,
            current.scale,
         );
      }
   }
}
