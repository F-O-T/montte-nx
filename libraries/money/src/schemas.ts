import { z } from "zod";

/**
 * Schema for validating ISO 4217 currency codes
 *
 * - Exactly 3 characters
 * - Uppercase letters only
 */
export const CurrencyCodeSchema = z
	.string()
	.length(3, "Currency code must be exactly 3 characters")
	.regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters")
	.describe("ISO 4217 currency code");

/**
 * Schema for validating decimal amount strings
 *
 * Accepts:
 * - Positive numbers: "123.45", "100", "0.5"
 * - Negative numbers: "-123.45", "-100"
 * - Integer strings: "100", "-50"
 */
export const AmountStringSchema = z
	.string()
	.regex(/^-?\d+(\.\d+)?$/, "Amount must be a valid decimal string")
	.describe("Decimal amount as string");

/**
 * Schema for Money JSON representation
 *
 * Used for API requests/responses and JSON serialization.
 *
 * @example
 * { amount: "123.45", currency: "USD" }
 */
export const MoneySchema = z
	.object({
		amount: AmountStringSchema,
		currency: CurrencyCodeSchema,
	})
	.describe("Money JSON representation");

/**
 * Schema for database Money storage
 *
 * Identical to MoneySchema but with a distinct type for clarity.
 */
export const DatabaseMoneySchema = z
	.object({
		amount: z.string().describe("Decimal amount as string"),
		currency: CurrencyCodeSchema,
	})
	.describe("Database Money representation");

/**
 * Schema for user input of money amounts
 *
 * More permissive than AmountStringSchema - accepts both strings and numbers.
 */
export const MoneyInputSchema = z
	.object({
		amount: z.union([z.string(), z.number()]).describe("Amount (string or number)"),
		currency: CurrencyCodeSchema,
	})
	.describe("Money input from user");

/**
 * Schema for Currency definition
 *
 * Used for registering custom currencies.
 */
export const CurrencySchema = z
	.object({
		code: CurrencyCodeSchema,
		numericCode: z
			.number()
			.int()
			.min(0)
			.describe("ISO 4217 numeric code (0 for custom)"),
		name: z.string().min(1).describe("Full currency name"),
		decimalPlaces: z
			.number()
			.int()
			.min(0)
			.max(18)
			.describe("Number of decimal places"),
		symbol: z.string().optional().describe("Currency symbol"),
		subunitName: z.string().optional().describe("Name of minor unit"),
	})
	.describe("Currency definition");

/**
 * Schema for allocation ratios
 *
 * - Non-empty array
 * - Non-negative numbers
 * - At least one non-zero value
 */
export const AllocationRatiosSchema = z
	.array(z.number().min(0, "Ratios cannot be negative"))
	.min(1, "At least one ratio is required")
	.refine((ratios) => ratios.some((r) => r > 0), {
		message: "At least one ratio must be greater than zero",
	})
	.describe("Allocation ratios");

// Type exports inferred from schemas
export type MoneyJSON = z.infer<typeof MoneySchema>;
export type DatabaseMoney = z.infer<typeof DatabaseMoneySchema>;
export type MoneyInput = z.infer<typeof MoneyInputSchema>;
export type CurrencyInput = z.infer<typeof CurrencySchema>;
