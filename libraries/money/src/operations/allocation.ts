import { createMoney, parseDecimalToMinorUnits } from "../core/internal";
import { InvalidAmountError } from "../errors";
import type { Money } from "../types";

/**
 * Convert a ratio number to BigInt with high precision using string parsing.
 * This avoids floating-point precision issues that occur with Math.round.
 */
function ratioToBigInt(ratio: number, precision: number): bigint {
   // Use string parsing to avoid floating-point multiplication errors
   return parseDecimalToMinorUnits(ratio.toString(), precision);
}

/**
 * Allocate Money according to ratios using the Largest Remainder Method
 *
 * This algorithm distributes money while guaranteeing that:
 * 1. sum(allocated) === original (no cents are lost or gained)
 * 2. Allocation is fair (remainders are distributed to largest fractional parts)
 * 3. Result is deterministic (same input always produces same output)
 *
 * Algorithm:
 * 1. Calculate each allocation's ideal fractional share
 * 2. Round down to get initial integer amounts
 * 3. Calculate remainders (fractional parts lost)
 * 4. Sort by remainder descending
 * 5. Distribute remaining cents one by one, starting with largest remainders
 *
 * @param money - Money to allocate
 * @param ratios - Proportions to allocate (e.g., [60, 25, 15] or [1, 1, 1])
 * @returns Array of Money values that sum to the original
 * @throws InvalidAmountError if ratios are invalid
 *
 * @example
 * allocate(of("100.00", "USD"), [60, 25, 15])  // [$60.00, $25.00, $15.00]
 * allocate(of("100.00", "USD"), [1, 1, 1])     // [$33.34, $33.33, $33.33]
 * allocate(of("10.00", "USD"), [1, 1, 1])      // [$3.34, $3.33, $3.33]
 * allocate(of("7", "JPY"), [1, 1, 1])          // [¥3, ¥2, ¥2]
 */
export function allocate(money: Money, ratios: number[]): Money[] {
   // Validate ratios
   if (ratios.length === 0) {
      throw new InvalidAmountError("Ratios array cannot be empty");
   }

   if (ratios.some((r) => r < 0)) {
      throw new InvalidAmountError("Ratios cannot be negative");
   }

   const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
   if (totalRatio === 0) {
      throw new InvalidAmountError("Sum of ratios cannot be zero");
   }

   // Special case: single ratio
   if (ratios.length === 1) {
      return [createMoney(money.amount, money.currency, money.scale)];
   }

   // Use high precision for calculations
   // We scale up by 10^15 to maintain precision during division
   const PRECISION = 15;
   const precisionFactor = 10n ** BigInt(PRECISION);

   // Calculate allocations with remainders
   const allocations: { index: number; amount: bigint; remainder: bigint }[] =
      [];

   for (let i = 0; i < ratios.length; i++) {
      const ratio = ratios[i] as number;

      if (ratio === 0) {
         // Zero ratio gets zero allocation
         allocations.push({ index: i, amount: 0n, remainder: 0n });
         continue;
      }

      // Calculate ideal amount with extended precision
      // Use string parsing to avoid floating-point precision issues
      const RATIO_PRECISION = 15;
      const scaledRatio = ratioToBigInt(ratio, RATIO_PRECISION);
      const scaledTotalRatio = ratioToBigInt(totalRatio, RATIO_PRECISION);

      const idealPrecise =
         (money.amount * precisionFactor * scaledRatio) / scaledTotalRatio;

      // Floor to get integer part
      const integerPart = idealPrecise / precisionFactor;

      // Remainder for sorting (higher remainder = higher priority for extra cent)
      const remainder = idealPrecise % precisionFactor;

      allocations.push({ index: i, amount: integerPart, remainder });
   }

   // Calculate how many cents we need to distribute
   const allocatedSum = allocations.reduce((sum, a) => sum + a.amount, 0n);
   let remaining = money.amount - allocatedSum;

   // Sort by remainder descending (highest remainders get extra cents first)
   const sortedByRemainder = [...allocations].sort((a, b) => {
      if (b.remainder > a.remainder) return 1;
      if (b.remainder < a.remainder) return -1;
      return 0;
   });

   // Distribute remaining cents
   let i = 0;
   while (remaining > 0n) {
      // Find the allocation with this index and add 1 cent
      const entry = sortedByRemainder[
         i % sortedByRemainder.length
      ] as (typeof sortedByRemainder)[number];
      entry.amount += 1n;
      remaining -= 1n;
      i++;
   }

   // Handle negative remainder (if rounding caused over-allocation)
   while (remaining < 0n) {
      // Remove 1 cent from smallest remainders
      const entry = sortedByRemainder[
         sortedByRemainder.length - 1 - (i % sortedByRemainder.length)
      ] as (typeof sortedByRemainder)[number];
      if (entry.amount > 0n) {
         entry.amount -= 1n;
         remaining += 1n;
      }
      i++;
      // Safety check to prevent infinite loop
      if (i > ratios.length * 2) break;
   }

   // Sort back to original order
   allocations.sort((a, b) => a.index - b.index);

   // Verify sum (assertion)
   const finalSum = allocations.reduce((sum, a) => sum + a.amount, 0n);
   if (finalSum !== money.amount) {
      throw new Error(
         `Allocation error: sum ${finalSum} !== original ${money.amount}`,
      );
   }

   // Convert to Money objects
   return allocations.map((a) =>
      createMoney(a.amount, money.currency, money.scale),
   );
}

/**
 * Split Money equally among n recipients
 *
 * @param money - Money to split
 * @param count - Number of equal parts
 * @returns Array of Money values
 *
 * @example
 * split(of("100.00", "USD"), 3)  // [$33.34, $33.33, $33.33]
 * split(of("10.00", "USD"), 4)   // [$2.50, $2.50, $2.50, $2.50]
 */
export function split(money: Money, count: number): Money[] {
   if (count <= 0 || !Number.isInteger(count)) {
      throw new InvalidAmountError("Count must be a positive integer");
   }

   // Create equal ratios
   const ratios = Array.from({ length: count }, () => 1);
   return allocate(money, ratios);
}
