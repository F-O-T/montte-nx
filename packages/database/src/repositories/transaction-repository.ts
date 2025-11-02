import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
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
