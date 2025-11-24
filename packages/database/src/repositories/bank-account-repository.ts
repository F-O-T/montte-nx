import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { bankAccount } from "../schemas/bank-accounts";
import { transaction } from "../schemas/transactions";

export type BankAccount = typeof bankAccount.$inferSelect;
export type NewBankAccount = typeof bankAccount.$inferInsert;

export async function createBankAccount(
   dbClient: DatabaseInstance,
   data: NewBankAccount,
) {
   try {
      const result = await dbClient
         .insert(bankAccount)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create bank account: ${(err as Error).message}`,
      );
   }
}

export async function findBankAccountById(
   dbClient: DatabaseInstance,
   bankAccountId: string,
) {
   try {
      const result = await dbClient.query.bankAccount.findFirst({
         where: (bankAccount, { eq }) => eq(bankAccount.id, bankAccountId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bank account by id: ${(err as Error).message}`,
      );
   }
}

export async function findBankAccountsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.bankAccount.findMany({
         limit: 100,
         orderBy: (bankAccount, { asc }) => asc(bankAccount.name),
         where: (bankAccount, { eq }) => eq(bankAccount.userId, userId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bank accounts by user id: ${(err as Error).message}`,
      );
   }
}

export async function updateBankAccount(
   dbClient: DatabaseInstance,
   bankAccountId: string,
   data: Partial<NewBankAccount>,
) {
   try {
      const result = await dbClient
         .update(bankAccount)
         .set(data)
         .where(eq(bankAccount.id, bankAccountId))
         .returning();

      if (!result.length) {
         throw AppError.database("Bank account not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update bank account: ${(err as Error).message}`,
      );
   }
}

export async function deleteBankAccount(
   dbClient: DatabaseInstance,
   bankAccountId: string,
) {
   try {
      const result = await dbClient
         .delete(bankAccount)
         .where(eq(bankAccount.id, bankAccountId))
         .returning();

      if (!result.length) {
         throw AppError.database("Bank account not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bank account: ${(err as Error).message}`,
      );
   }
}

export async function getBankAccountStats(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const [totalAccountsResult, activeAccountsResult] = await Promise.all([
         dbClient
            .select({ count: sql<number>`count(*)` })
            .from(bankAccount)
            .where(eq(bankAccount.userId, userId)),
         dbClient
            .select({ count: sql<number>`count(*)` })
            .from(bankAccount)
            .where(
               and(
                  eq(bankAccount.userId, userId),
                  eq(bankAccount.status, "active"),
               ),
            ),
      ]);

      const totalAccounts = totalAccountsResult[0]?.count || 0;
      const activeAccounts = activeAccountsResult[0]?.count || 0;

      // Calculate total balance from transactions
      const balanceResult = await dbClient
         .select({
            totalBalance: sql<number>`
                COALESCE(SUM(
                   CASE
                      WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL)
                      WHEN ${transaction.type} = 'expense' THEN -CAST(${transaction.amount} AS REAL)
                      WHEN ${transaction.type} = 'transfer' THEN CAST(${transaction.amount} AS REAL)
                      ELSE 0
                   END
                ), 0)
             `,
         })
         .from(bankAccount)
         .leftJoin(transaction, eq(transaction.bankAccountId, bankAccount.id))
         .where(eq(bankAccount.userId, userId));

      const totalBalance = balanceResult[0]?.totalBalance || 0;

      return {
         activeAccounts,
         totalAccounts,
         totalBalance,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get bank account stats: ${(err as Error).message}`,
      );
   }
}
