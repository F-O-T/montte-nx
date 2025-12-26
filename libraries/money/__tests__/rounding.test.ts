import { describe, expect, test } from "bun:test";
import { bankersRound } from "../src/core/rounding";

describe("Banker's Rounding", () => {
   describe("Even Divisors", () => {
      test("rounds down when exactly halfway to even", () => {
         expect(bankersRound(25n, 10n)).toBe(2n); // 2.5 → 2 (even)
         expect(bankersRound(45n, 10n)).toBe(4n); // 4.5 → 4 (even)
         expect(bankersRound(65n, 10n)).toBe(6n); // 6.5 → 6 (even)
      });

      test("rounds up when exactly halfway to even", () => {
         expect(bankersRound(35n, 10n)).toBe(4n); // 3.5 → 4 (even)
         expect(bankersRound(55n, 10n)).toBe(6n); // 5.5 → 6 (even)
         expect(bankersRound(75n, 10n)).toBe(8n); // 7.5 → 8 (even)
      });

      test("rounds normally when not exactly halfway", () => {
         expect(bankersRound(24n, 10n)).toBe(2n); // 2.4 → 2
         expect(bankersRound(26n, 10n)).toBe(3n); // 2.6 → 3
         expect(bankersRound(34n, 10n)).toBe(3n); // 3.4 → 3
         expect(bankersRound(36n, 10n)).toBe(4n); // 3.6 → 4
      });
   });

   describe("Odd Divisors", () => {
      test("handles true halfway cases for even divisors", () => {
         // 21 / 6 = 3.5 → 4 (round to even)
         expect(bankersRound(21n, 6n)).toBe(4n);
         // 15 / 6 = 2.5 → 2 (round to even)
         expect(bankersRound(15n, 6n)).toBe(2n);
         // 9 / 6 = 1.5 → 2 (round to even)
         expect(bankersRound(9n, 6n)).toBe(2n);
         // 27 / 6 = 4.5 → 4 (round to even)
         expect(bankersRound(27n, 6n)).toBe(4n);
      });

      test("does NOT treat truncated half as halfway for odd divisors", () => {
         // For divisor=7, half=3 (truncated), but true halfway is 3.5
         // 24 / 7 = 3.428... → 3 (not halfway, round down)
         expect(bankersRound(24n, 7n)).toBe(3n);
         // 25 / 7 = 3.571... → 4 (not halfway, round up)
         expect(bankersRound(25n, 7n)).toBe(4n);
         // 21 / 7 = 3 exactly → 3
         expect(bankersRound(21n, 7n)).toBe(3n);
      });

      test("rounds normally when clearly not halfway", () => {
         expect(bankersRound(15n, 7n)).toBe(2n); // 2.14... → 2
         expect(bankersRound(18n, 7n)).toBe(3n); // 2.57... → 3
         expect(bankersRound(20n, 7n)).toBe(3n); // 2.86... → 3
      });
   });

   describe("Negative Values", () => {
      test("handles negative dividends", () => {
         expect(bankersRound(-25n, 10n)).toBe(-2n); // -2.5 → -2 (even)
         expect(bankersRound(-35n, 10n)).toBe(-4n); // -3.5 → -4 (even)
      });

      test("handles negative divisors", () => {
         expect(bankersRound(25n, -10n)).toBe(-2n); // -2.5 → -2 (even)
         expect(bankersRound(35n, -10n)).toBe(-4n); // -3.5 → -4 (even)
      });

      test("handles both negative", () => {
         expect(bankersRound(-25n, -10n)).toBe(2n); // 2.5 → 2 (even)
         expect(bankersRound(-35n, -10n)).toBe(4n); // 3.5 → 4 (even)
      });
   });

   describe("Edge Cases", () => {
      test("handles exact division", () => {
         expect(bankersRound(100n, 10n)).toBe(10n);
         expect(bankersRound(21n, 7n)).toBe(3n);
         expect(bankersRound(0n, 10n)).toBe(0n);
      });

      test("handles division by 1", () => {
         expect(bankersRound(123n, 1n)).toBe(123n);
         expect(bankersRound(0n, 1n)).toBe(0n);
      });

      test("handles division by 2", () => {
         // 1 / 2 = 0.5 → 0 (even)
         expect(bankersRound(1n, 2n)).toBe(0n);
         // 3 / 2 = 1.5 → 2 (even)
         expect(bankersRound(3n, 2n)).toBe(2n);
         // 5 / 2 = 2.5 → 2 (even)
         expect(bankersRound(5n, 2n)).toBe(2n);
         // 7 / 2 = 3.5 → 4 (even)
         expect(bankersRound(7n, 2n)).toBe(4n);
      });

      test("throws on division by zero", () => {
         expect(() => bankersRound(100n, 0n)).toThrow("Division by zero");
      });

      test("handles large numbers", () => {
         const large = 10n ** 18n + 5n * 10n ** 17n; // 1.5 * 10^18
         expect(bankersRound(large, 10n ** 18n)).toBe(2n); // 1.5 → 2 (even)
      });
   });
});
