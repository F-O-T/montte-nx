import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq, gte, lte, sql } from "drizzle-orm";
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

      if (!result[0]) {
         throw AppError.database("Failed to create transaction");
      }

      const createdTransaction = await dbClient.query.transaction.findFirst({
         where: (transaction, { eq }) => eq(transaction.id, result[0]!.id),
         with: {
            bankAccount: true,
         },
      });

      if (!createdTransaction) {
         throw AppError.database("Failed to fetch created transaction");
      }

      return createdTransaction;
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
         with: {
            bankAccount: true,
         },
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
         with: {
            bankAccount: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by user id: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionsByUserIdPaginated(
   dbClient: DatabaseInstance,
   userId: string,
   options: {
      page?: number;
      limit?: number;
      type?: "income" | "expense" | "transfer";
      bankAccountId?: string;
      category?: string;
      search?: string;
      orderBy?: "date" | "amount";
      orderDirection?: "asc" | "desc";
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      type,
      bankAccountId,
      category,
      search,
      orderBy = "date",
      orderDirection = "desc",
   } = options;

   const offset = (page - 1) * limit;

   try {
      const buildWhereCondition = (
         transaction: any,
         { eq, and, or, ilike }: any,
      ) => {
         const conditions = [eq(transaction.userId, userId)];

         if (bankAccountId && bankAccountId !== "all") {
            conditions.push(eq(transaction.bankAccountId, bankAccountId));
         }

         if (type && type !== ("all" as any)) {
            conditions.push(eq(transaction.type, type));
         }

         if (category && category !== "all") {
            conditions.push(eq(transaction.category, category));
         }

         if (search) {
            conditions.push(
               or(
                  ilike(transaction.description, `%${search}%`),
                  ilike(transaction.category, `%${search}%`),
               ),
            );
         }

         return and(...conditions);
      };

      const [transactions, totalCount] = await Promise.all([
         dbClient.query.transaction.findMany({
            limit,
            offset,
            orderBy: (transaction, { asc, desc }) => {
               const column = transaction[orderBy as keyof typeof transaction];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: buildWhereCondition,
            with: {
               bankAccount: true,
            },
         }),
         dbClient.query.transaction
            .findMany({
               where: buildWhereCondition,
            })
            .then((result) => result.length),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         pagination: {
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            limit,
            totalCount,
            totalPages,
         },
         transactions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by user id paginated: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionsByBankAccountId(
   dbClient: DatabaseInstance,
   bankAccountId: string,
) {
   try {
      const result = await dbClient.query.transaction.findMany({
         orderBy: (transaction, { desc }) => desc(transaction.date),
         where: (transaction, { eq }) =>
            eq(transaction.bankAccountId, bankAccountId),
         with: {
            bankAccount: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by bank account id: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionsByBankAccountIdPaginated(
   dbClient: DatabaseInstance,
   bankAccountId: string,
   options: {
      page?: number;
      limit?: number;
   } = {},
) {
   const { page = 1, limit = 10 } = options;
   const offset = (page - 1) * limit;

   try {
      const [transactions, totalCount] = await Promise.all([
         dbClient.query.transaction.findMany({
            limit,
            offset,
            orderBy: (transaction, { desc }) => desc(transaction.date),
            where: (transaction, { eq }) =>
               eq(transaction.bankAccountId, bankAccountId),
            with: {
               bankAccount: true,
            },
         }),
         dbClient.query.transaction
            .findMany({
               where: (transaction, { eq }) =>
                  eq(transaction.bankAccountId, bankAccountId),
            })
            .then((result) => result.length),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         pagination: {
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            limit,
            totalCount,
            totalPages,
         },
         transactions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by bank account id paginated: ${(err as Error).message}`,
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

      const updatedTransaction = await dbClient.query.transaction.findFirst({
         where: (transaction, { eq }) => eq(transaction.id, transactionId),
         with: {
            bankAccount: true,
         },
      });

      if (!updatedTransaction) {
         throw AppError.database("Failed to fetch updated transaction");
      }

      return updatedTransaction;
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
   bankAccountId?: string,
) {
   try {
      const conditions = [eq(transaction.userId, userId)];

      if (bankAccountId && bankAccountId !== "all") {
         conditions.push(eq(transaction.bankAccountId, bankAccountId));
      }

      const result = await dbClient
         .select({ count: sql<number>`count(*)` })
         .from(transaction)
         .where(and(...conditions));

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
   bankAccountId?: string,
) {
   try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
      );

      const conditions = [
         eq(transaction.userId, userId),
         gte(transaction.date, currentMonthStart),
         lte(transaction.date, currentMonthEnd),
         eq(transaction.type, "income"),
      ];

      if (bankAccountId && bankAccountId !== "all") {
         conditions.push(eq(transaction.bankAccountId, bankAccountId));
      }

      const result = await dbClient
         .select({
            total: sql<number>`sum(CASE WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)`,
         })
         .from(transaction)
         .where(and(...conditions));

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
   bankAccountId?: string,
) {
   try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
      );

      const conditions = [
         eq(transaction.userId, userId),
         gte(transaction.date, currentMonthStart),
         lte(transaction.date, currentMonthEnd),
         eq(transaction.type, "expense"),
      ];

      if (bankAccountId && bankAccountId !== "all") {
         conditions.push(eq(transaction.bankAccountId, bankAccountId));
      }

      const result = await dbClient
         .select({
            total: sql<number>`sum(CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)`,
         })
         .from(transaction)
         .where(and(...conditions));

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total expenses: ${(err as Error).message}`,
      );
   }
}

export async function getTotalTransfersByUserId(
   dbClient: DatabaseInstance,
   userId: string,
   bankAccountId?: string,
) {
   try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
      );

      const conditions = [
         eq(transaction.userId, userId),
         gte(transaction.date, currentMonthStart),
         lte(transaction.date, currentMonthEnd),
         eq(transaction.type, "transfer"),
      ];

      if (bankAccountId && bankAccountId !== "all") {
         conditions.push(eq(transaction.bankAccountId, bankAccountId));
      }

      const result = await dbClient
         .select({
            total: sql<number>`sum(CASE WHEN ${transaction.type} = 'transfer' AND CAST(${transaction.amount} AS REAL) > 0 THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)`,
         })
         .from(transaction)
         .where(and(...conditions));

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total transfers: ${(err as Error).message}`,
      );
   }
}
