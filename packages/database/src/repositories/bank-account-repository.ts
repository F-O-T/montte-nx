import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq, inArray, sql } from "drizzle-orm";
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

export async function findBankAccountsByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.bankAccount.findMany({
         limit: 100,
         orderBy: (bankAccount, { asc }) => asc(bankAccount.name),
         where: (bankAccount, { eq }) =>
            eq(bankAccount.organizationId, organizationId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bank accounts by organization id: ${(err as Error).message}`,
      );
   }
}

export async function findBankAccountsByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   params: {
      page: number;
      limit: number;
      search?: string;
      orderBy?: "name" | "bank" | "createdAt" | "updatedAt";
      orderDirection?: "asc" | "desc";
      status?: "active" | "inactive";
      type?: "checking" | "savings" | "investment";
   },
) {
   try {
      const {
         page,
         limit,
         search,
         orderBy = "name",
         orderDirection = "asc",
         status,
         type,
      } = params;
      const offset = (page - 1) * limit;

      const whereClause = and(
         eq(bankAccount.organizationId, organizationId),
         search ? sql`${bankAccount.name} ILIKE ${`%${search}%`}` : undefined,
         status ? eq(bankAccount.status, status) : undefined,
         type ? eq(bankAccount.type, type) : undefined,
      );

      const [data, totalCountResult] = await Promise.all([
         dbClient.query.bankAccount.findMany({
            limit,
            offset,
            orderBy: (bankAccount, { asc, desc }) => {
               const column = bankAccount[orderBy as keyof typeof bankAccount];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: whereClause,
         }),
         dbClient
            .select({ count: sql<number>`count(*)` })
            .from(bankAccount)
            .where(whereClause),
      ]);

      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
         bankAccounts: data,
         pagination: {
            currentPage: page,
            pageSize: limit,
            totalCount,
            totalPages,
         },
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find paginated bank accounts by organization id: ${(err as Error).message}`,
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

export async function updateBankAccountsStatus(
   dbClient: DatabaseInstance,
   ids: string[],
   status: "active" | "inactive",
   organizationId: string,
) {
   try {
      const result = await dbClient
         .update(bankAccount)
         .set({ status })
         .where(
            and(
               inArray(bankAccount.id, ids),
               eq(bankAccount.organizationId, organizationId),
            ),
         )
         .returning();
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update bank accounts status: ${(err as Error).message}`,
      );
   }
}

export async function deleteBankAccounts(
   dbClient: DatabaseInstance,
   ids: string[],
   organizationId: string,
) {
   try {
      const result = await dbClient
         .delete(bankAccount)
         .where(
            and(
               inArray(bankAccount.id, ids),
               eq(bankAccount.organizationId, organizationId),
            ),
         )
         .returning();
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bank accounts: ${(err as Error).message}`,
      );
   }
}

export async function createDefaultWalletBankAccount(
   dbClient: DatabaseInstance,
   organizationId: string,
   name = "Wallet", // English fallback
   bank = "Default", // English fallback
) {
   try {
      const existingAccount = await dbClient.query.bankAccount.findFirst({
         where: (bankAccount, { eq, and }) =>
            and(
               eq(bankAccount.organizationId, organizationId),
               eq(bankAccount.name, name),
            ),
      });

      if (existingAccount) {
         return existingAccount;
      }

      const result = await dbClient
         .insert(bankAccount)
         .values({
            bank,
            name,
            organizationId,
            type: "checking",
         })
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create default wallet bank account: ${(err as Error).message}`,
      );
   }
}

export async function createDefaultBusinessBankAccount(
   dbClient: DatabaseInstance,
   organizationId: string,
   name = "Cash", // English fallback
   bank = "Cash", // English fallback
) {
   try {
      const existingAccount = await dbClient.query.bankAccount.findFirst({
         where: (bankAccount, { eq, and }) =>
            and(
               eq(bankAccount.organizationId, organizationId),
               eq(bankAccount.name, name),
            ),
      });

      if (existingAccount) {
         return existingAccount;
      }

      const result = await dbClient
         .insert(bankAccount)
         .values({
            bank,
            name,
            organizationId,
            type: "checking",
         })
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create default business bank account: ${(err as Error).message}`,
      );
   }
}

export async function getBankAccountStats(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const totalAccountsResult = await dbClient
         .select({ count: sql<number>`count(*)` })
         .from(bankAccount)
         .where(eq(bankAccount.organizationId, organizationId));

      const totalAccounts = totalAccountsResult[0]?.count || 0;

      const statsResult = await dbClient
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
            totalExpenses: sql<number>`
                COALESCE(SUM(
                   CASE
                      WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL)
                      ELSE 0
                   END
                ), 0)
             `,
            totalIncome: sql<number>`
                COALESCE(SUM(
                   CASE
                      WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL)
                      ELSE 0
                   END
                ), 0)
             `,
         })
         .from(bankAccount)
         .leftJoin(transaction, eq(transaction.bankAccountId, bankAccount.id))
         .where(eq(bankAccount.organizationId, organizationId));

      return {
         totalAccounts,
         totalBalance: statsResult[0]?.totalBalance || 0,
         totalExpenses: statsResult[0]?.totalExpenses || 0,
         totalIncome: statsResult[0]?.totalIncome || 0,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get bank account stats: ${(err as Error).message}`,
      );
   }
}

export async function getBankAccountBalances(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({
            balance: sql<number>`
               COALESCE(SUM(
                  CASE
                     WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL)
                     WHEN ${transaction.type} = 'expense' THEN -CAST(${transaction.amount} AS REAL)
                     WHEN ${transaction.type} = 'transfer' THEN CAST(${transaction.amount} AS REAL)
                     ELSE 0
                  END
               ), 0)
            `,
            bank: bankAccount.bank,
            expenses: sql<number>`
               COALESCE(SUM(
                  CASE
                     WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL)
                     ELSE 0
                  END
               ), 0)
            `,
            id: bankAccount.id,
            income: sql<number>`
               COALESCE(SUM(
                  CASE
                     WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL)
                     ELSE 0
                  END
               ), 0)
            `,
            name: bankAccount.name,
            type: bankAccount.type,
         })
         .from(bankAccount)
         .leftJoin(transaction, eq(transaction.bankAccountId, bankAccount.id))
         .where(eq(bankAccount.organizationId, organizationId))
         .groupBy(
            bankAccount.id,
            bankAccount.name,
            bankAccount.bank,
            bankAccount.type,
         );

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get bank account balances: ${(err as Error).message}`,
      );
   }
}

export async function getBankAccountTypeDistribution(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({
            count: sql<number>`count(*)`,
            type: bankAccount.type,
         })
         .from(bankAccount)
         .where(eq(bankAccount.organizationId, organizationId))
         .groupBy(bankAccount.type);

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get bank account type distribution: ${(err as Error).message}`,
      );
   }
}

export async function getBankAccountMonthlyFlow(
   dbClient: DatabaseInstance,
   organizationId: string,
   months: number = 6,
) {
   try {
      const result = await dbClient
         .select({
            expenses: sql<number>`
               COALESCE(SUM(
                  CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END
               ), 0)
            `,
            income: sql<number>`
               COALESCE(SUM(
                  CASE WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END
               ), 0)
            `,
            month: sql<string>`to_char(${transaction.date}, 'YYYY-MM')`,
         })
         .from(transaction)
         .innerJoin(bankAccount, eq(transaction.bankAccountId, bankAccount.id))
         .where(
            and(
               eq(bankAccount.organizationId, organizationId),
               sql`${transaction.date} >= date_trunc('month', CURRENT_DATE - interval '${sql.raw(String(months - 1))} months')`,
            ),
         )
         .groupBy(sql`to_char(${transaction.date}, 'YYYY-MM')`)
         .orderBy(sql`to_char(${transaction.date}, 'YYYY-MM')`);

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get bank account monthly flow: ${(err as Error).message}`,
      );
   }
}

export async function getBankAccountTransactionsByAccount(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({
            accountId: bankAccount.id,
            accountName: bankAccount.name,
            bank: bankAccount.bank,
            expenses: sql<number>`
               COALESCE(SUM(
                  CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END
               ), 0)
            `,
            income: sql<number>`
               COALESCE(SUM(
                  CASE WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END
               ), 0)
            `,
            transactionCount: sql<number>`count(${transaction.id})`,
         })
         .from(bankAccount)
         .leftJoin(transaction, eq(transaction.bankAccountId, bankAccount.id))
         .where(eq(bankAccount.organizationId, organizationId))
         .groupBy(bankAccount.id, bankAccount.name, bankAccount.bank);

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get bank account transactions by account: ${(err as Error).message}`,
      );
   }
}
