import { AppError, propagateError } from "@packages/utils/errors";
import { eq, sql, gte, lte, and } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { transaction } from "../schemas/transactions";

export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;

export async function createTransaction(
   dbClient: DatabaseInstance,
   data: NewTransaction,
) {
   try {
      const result = await dbClient
         .insert(transaction)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create transaction: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionById(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient.query.transaction.findFirst({
         where: (transaction, { eq }) => eq(transaction.id, transactionId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transaction by id: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.transaction.findMany({
         orderBy: (transaction, { desc }) => desc(transaction.date),
         where: (transaction, { eq }) => eq(transaction.userId, userId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by user id: ${(err as Error).message}`,
      );
   }
}

export async function updateTransaction(
   dbClient: DatabaseInstance,
   transactionId: string,
   data: Partial<NewTransaction>,
) {
   try {
      const result = await dbClient
         .update(transaction)
         .set(data)
         .where(eq(transaction.id, transactionId))
         .returning();

      if (!result.length) {
         throw AppError.database("Transaction not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update transaction: ${(err as Error).message}`,
      );
   }
}

export async function deleteTransaction(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient
         .delete(transaction)
         .where(eq(transaction.id, transactionId))
         .returning();

      if (!result.length) {
         throw AppError.database("Transaction not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete transaction: ${(err as Error).message}`,
      );
   }
}

export async function getTotalTransactionsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient
         .select({ count: sql<number>`count(*)` })
         .from(transaction)
         .where(eq(transaction.userId, userId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total transactions count: ${(err as Error).message}`,
      );
   }
}

export async function getTotalIncomeByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      // Get current month's start and end dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const result = await dbClient
         .select({ total: sql<number>`sum(CASE WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)` })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, currentMonthStart),
               lte(transaction.date, currentMonthEnd),
               eq(transaction.type, 'income')
            )
         );

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total income: ${(err as Error).message}`,
      );
   }
}

export async function getTotalExpensesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      // Get current month's start and end dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const result = await dbClient
         .select({ total: sql<number>`sum(CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)` })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, currentMonthStart),
               lte(transaction.date, currentMonthEnd),
               eq(transaction.type, 'expense')
            )
         );

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total expenses: ${(err as Error).message}`,
      );
   }
}
