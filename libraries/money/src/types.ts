/**
 * Types re-exported from schemas for backward compatibility
 *
 * All types are now defined using Zod schema inference in ./schemas.ts
 * This file re-exports them for backward compatibility.
 */
export type {
   AllocationRatios,
   DatabaseMoney,
   FormatOptions,
   Money,
   MoneyInput,
   MoneyJSON,
} from "./schemas";

/**
 * Rounding mode for amount parsing
 */
export type RoundingMode = "truncate" | "round";
