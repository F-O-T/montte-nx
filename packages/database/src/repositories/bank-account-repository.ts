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
   },
) {
   try {
      const {
         page,
         limit,
         search,
         orderBy = "name",
         orderDirection = "asc",
      } = params;
      const offset = (page - 1) * limit;

      const whereClause = and(
         eq(bankAccount.organizationId, organizationId),
         search ? sql`${bankAccount.name} ILIKE ${`%${search}%`}` : undefined,
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

export async function createDefaultWalletBankAccount(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const existingAccount = await dbClient.query.bankAccount.findFirst({
         where: (bankAccount, { eq, and }) =>
            and(
               eq(bankAccount.userId, userId),
               eq(bankAccount.name, "Carteira"),
            ),
      });

      if (existingAccount) {
         return existingAccount;
      }

      const result = await dbClient
         .insert(bankAccount)
         .values({
            bank: "Default",
            name: "Wallet",
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
   userId: string,
) {
   try {
      const existingAccount = await dbClient.query.bankAccount.findFirst({
         where: (bankAccount, { eq, and }) =>
            and(eq(bankAccount.userId, userId), eq(bankAccount.name, "Caixa")),
      });

      if (existingAccount) {
         return existingAccount;
      }

      const result = await dbClient
         .insert(bankAccount)
         .values({
            bank: "Caixa",
            name: "Caixa",
            type: "checking",
            userId,
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
         .where(eq(bankAccount.organizationId, organizationId));

      const totalBalance = balanceResult[0]?.totalBalance || 0;

      return {
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
