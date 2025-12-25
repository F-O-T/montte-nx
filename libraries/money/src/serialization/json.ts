import { minorUnitsToDecimal } from "../core/internal";
import { of } from "../core/money";
import { InvalidAmountError } from "../errors";
import type { DatabaseMoney, Money, MoneyJSON } from "../types";

/**
 * Convert Money to JSON representation
 *
 * Stores amount as a decimal string to preserve precision.
 *
 * @param money - Money value
 * @returns JSON-serializable object
 *
 * @example
 * toJSON(of("123.45", "USD"))
 * // { amount: "123.45", currency: "USD" }
 */
export function toJSON(money: Money): MoneyJSON {
   return {
      amount: minorUnitsToDecimal(money.amount, money.scale),
      currency: money.currency,
   };
}

/**
 * Create Money from JSON representation
 *
 * @param json - JSON object with amount and currency
 * @returns Money instance
 *
 * @example
 * fromJSON({ amount: "123.45", currency: "USD" })
 * // Money with $123.45
 */
export function fromJSON(json: MoneyJSON): Money {
   if (
      typeof json !== "object" ||
      json === null ||
      typeof json.amount !== "string" ||
      typeof json.currency !== "string"
   ) {
      throw new InvalidAmountError(
         `Invalid Money JSON: ${JSON.stringify(json)}`,
      );
   }

   return of(json.amount, json.currency);
}

/**
 * Convert Money to database-friendly format
 *
 * Stores amount as a string to preserve precision in databases
 * that don't support BigInt natively.
 *
 * @param money - Money value
 * @returns Database-friendly object
 *
 * @example
 * toDatabase(of("123.45", "USD"))
 * // { amount: "123.45", currency: "USD" }
 */
export function toDatabase(money: Money): DatabaseMoney {
   return {
      amount: minorUnitsToDecimal(money.amount, money.scale),
      currency: money.currency,
   };
}

/**
 * Create Money from database format
 *
 * @param data - Database object with amount and currency
 * @returns Money instance
 */
export function fromDatabase(data: DatabaseMoney): Money {
   if (
      typeof data !== "object" ||
      data === null ||
      typeof data.amount !== "string" ||
      typeof data.currency !== "string"
   ) {
      throw new InvalidAmountError(
         `Invalid database Money: ${JSON.stringify(data)}`,
      );
   }

   return of(data.amount, data.currency);
}

/**
 * Serialize Money to a compact string format
 *
 * Format: "AMOUNT CURRENCY" (e.g., "123.45 USD")
 *
 * @param money - Money value
 * @returns Compact string representation
 *
 * @example
 * serialize(of("123.45", "USD"))  // "123.45 USD"
 */
export function serialize(money: Money): string {
   return `${minorUnitsToDecimal(money.amount, money.scale)} ${money.currency}`;
}

/**
 * Deserialize Money from compact string format
 *
 * @param str - String in format "AMOUNT CURRENCY"
 * @returns Money instance
 *
 * @example
 * deserialize("123.45 USD")  // Money with $123.45
 */
export function deserialize(str: string): Money {
   const parts = str.trim().split(/\s+/);

   if (parts.length !== 2) {
      throw new InvalidAmountError(
         `Invalid Money string format: "${str}". Expected "AMOUNT CURRENCY"`,
      );
   }

   const [amount, currency] = parts as [string, string];
   return of(amount, currency);
}
