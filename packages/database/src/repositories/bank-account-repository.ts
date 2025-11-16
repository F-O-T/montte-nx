import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { bankAccount } from "../schemas/bank-accounts";

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

export async function findBankAccountsByUserIdPaginated(
   dbClient: DatabaseInstance,
   userId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?: "name" | "createdAt" | "updatedAt";
      orderDirection?: "asc" | "desc";
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      orderBy = "name",
      orderDirection = "asc",
   } = options;

   const offset = (page - 1) * limit;

   try {
      const [bankAccounts, totalCount] = await Promise.all([
         dbClient.query.bankAccount.findMany({
            limit,
            offset,
            orderBy: (bankAccount, { asc, desc }) => {
               const column = bankAccount[orderBy as keyof typeof bankAccount];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: (bankAccount, { eq }) => eq(bankAccount.userId, userId),
         }),
         dbClient.query.bankAccount
            .findMany({
               where: (bankAccount, { eq }) => eq(bankAccount.userId, userId),
            })
            .then((result) => result.length),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         bankAccounts,
         pagination: {
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            limit,
            totalCount,
            totalPages,
         },
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bank accounts by user id paginated: ${(err as Error).message}`,
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
