import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { category, transactionCategory } from "../schemas/categories";
import { transaction } from "../schemas/transactions";

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
export type TransactionCategory = typeof transactionCategory.$inferSelect;
export type NewTransactionCategory = typeof transactionCategory.$inferInsert;

export async function createCategory(
   dbClient: DatabaseInstance,
   data: NewCategory,
) {
   try {
      const result = await dbClient.insert(category).values(data).returning();
      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Category already exists for this organization",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(`Failed to create category: ${error.message}`, {
         cause: err,
      });
   }
}

export async function findCategoryById(
   dbClient: DatabaseInstance,
   categoryId: string,
) {
   try {
      const result = await dbClient.query.category.findFirst({
         where: (category, { eq }) => eq(category.id, categoryId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find category by id: ${(err as Error).message}`,
      );
   }
}

export async function findCategoriesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.category.findMany({
         orderBy: (category, { asc }) => asc(category.name),
         where: (category, { eq }) =>
            eq(category.organizationId, organizationId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find categories by organization id: ${(err as Error).message}`,
      );
   }
}

export async function findCategoriesByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?: "name" | "createdAt" | "updatedAt";
      orderDirection?: "asc" | "desc";
      search?: string;
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      orderBy = "name",
      orderDirection = "asc",
      search,
   } = options;

   const offset = (page - 1) * limit;

   try {
      const baseWhereCondition = eq(category.organizationId, organizationId);
      const whereCondition = search
         ? and(baseWhereCondition, ilike(category.name, `%${search}%`))
         : baseWhereCondition;

      const [categories, totalCount] = await Promise.all([
         dbClient.query.category.findMany({
            limit,
            offset,
            orderBy: (category, { asc, desc }) => {
               const column = category[orderBy as keyof typeof category];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: whereCondition,
         }),
         dbClient.query.category
            .findMany({
               where: whereCondition,
            })
            .then((result) => result.length),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         categories,
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
         `Failed to find categories by organization id paginated: ${(err as Error).message}`,
      );
   }
}

export async function updateCategory(
   dbClient: DatabaseInstance,
   categoryId: string,
   data: Partial<NewCategory>,
) {
   try {
      const existingCategory = await findCategoryById(dbClient, categoryId);
      if (!existingCategory) {
         throw AppError.notFound("Category not found");
      }

      const result = await dbClient
         .update(category)
         .set(data)
         .where(eq(category.id, categoryId))
         .returning();

      if (!result.length) {
         throw AppError.database("Category not found");
      }

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Category already exists for this organization",
            { cause: err },
         );
      }

      if (err instanceof AppError) {
         throw err;
      }

      propagateError(err);
      throw AppError.database(`Failed to update category: ${error.message}`, {
         cause: err,
      });
   }
}

export async function deleteCategory(
   dbClient: DatabaseInstance,
   categoryId: string,
) {
   try {
      const result = await dbClient
         .delete(category)
         .where(eq(category.id, categoryId))
         .returning();

      if (!result.length) {
         throw AppError.database("Category not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete category: ${(err as Error).message}`,
      );
   }
}

export async function getTotalCategoriesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(category)
         .where(eq(category.organizationId, organizationId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total categories: ${(err as Error).message}`,
      );
   }
}

export async function searchCategories(
   dbClient: DatabaseInstance,
   organizationId: string,
   query: string,
   options: {
      limit?: number;
      includeTransactionCount?: boolean;
   } = {},
) {
   const { limit = 20, includeTransactionCount = false } = options;

   try {
      if (includeTransactionCount) {
         const result = await dbClient.execute<{
            id: string;
            name: string;
            color: string;
            icon: string | null;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            transactionCount: string;
         }>(sql`
            SELECT
               c.*,
               COUNT(tc.transaction_id) as "transactionCount"
            FROM ${category} c
            LEFT JOIN ${transactionCategory} tc ON c.id = tc.category_id
            WHERE
               c.organization_id = ${organizationId}
               AND c.name ILIKE ${"%" + query + "%"}
            GROUP BY c.id
            ORDER BY c.name ASC
            LIMIT ${limit}
         `);

         return result.rows.map((row) => ({
            ...row,
            transactionCount: parseInt(row.transactionCount, 10),
         }));
      }

      const result = await dbClient.query.category.findMany({
         limit,
         orderBy: (category, { asc }) => asc(category.name),
         where: and(
            eq(category.organizationId, organizationId),
            ilike(category.name, `%${query}%`),
         ),
      });

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search categories: ${(err as Error).message}`,
      );
   }
}

export async function addCategoryToTransaction(
   dbClient: DatabaseInstance,
   transactionId: string,
   categoryId: string,
) {
   try {
      const result = await dbClient
         .insert(transactionCategory)
         .values({ categoryId, transactionId })
         .returning();

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Category already linked to this transaction",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(
         `Failed to add category to transaction: ${error.message}`,
         { cause: err },
      );
   }
}

export async function removeCategoryFromTransaction(
   dbClient: DatabaseInstance,
   transactionId: string,
   categoryId: string,
) {
   try {
      const result = await dbClient
         .delete(transactionCategory)
         .where(
            and(
               eq(transactionCategory.transactionId, transactionId),
               eq(transactionCategory.categoryId, categoryId),
            ),
         )
         .returning();

      if (!result.length) {
         throw AppError.notFound("Category not linked to this transaction");
      }

      return result[0];
   } catch (err) {
      if (err instanceof AppError) {
         throw err;
      }
      propagateError(err);
      throw AppError.database(
         `Failed to remove category from transaction: ${(err as Error).message}`,
      );
   }
}

export async function setTransactionCategories(
   dbClient: DatabaseInstance,
   transactionId: string,
   categoryIds: string[],
) {
   try {
      await dbClient
         .delete(transactionCategory)
         .where(eq(transactionCategory.transactionId, transactionId));

      if (categoryIds.length === 0) {
         return [];
      }

      const result = await dbClient
         .insert(transactionCategory)
         .values(
            categoryIds.map((categoryId) => ({ categoryId, transactionId })),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to set transaction categories: ${(err as Error).message}`,
      );
   }
}

export async function findCategoriesByTransactionId(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient
         .select({
            color: category.color,
            createdAt: category.createdAt,
            icon: category.icon,
            id: category.id,
            name: category.name,
            organizationId: category.organizationId,
            updatedAt: category.updatedAt,
         })
         .from(transactionCategory)
         .innerJoin(category, eq(transactionCategory.categoryId, category.id))
         .where(eq(transactionCategory.transactionId, transactionId))
         .orderBy(category.name);

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find categories by transaction id: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionsByCategoryId(
   dbClient: DatabaseInstance,
   categoryId: string,
   options: {
      page?: number;
      limit?: number;
   } = {},
) {
   const { page = 1, limit = 10 } = options;
   const offset = (page - 1) * limit;

   try {
      const [transactions, totalCount] = await Promise.all([
         dbClient
            .select({
               amount: transaction.amount,
               bankAccountId: transaction.bankAccountId,
               createdAt: transaction.createdAt,
               date: transaction.date,
               description: transaction.description,
               externalId: transaction.externalId,
               id: transaction.id,
               organizationId: transaction.organizationId,
               type: transaction.type,
               updatedAt: transaction.updatedAt,
            })
            .from(transactionCategory)
            .innerJoin(
               transaction,
               eq(transactionCategory.transactionId, transaction.id),
            )
            .where(eq(transactionCategory.categoryId, categoryId))
            .orderBy(transaction.date)
            .limit(limit)
            .offset(offset),
         dbClient
            .select({ count: count() })
            .from(transactionCategory)
            .where(eq(transactionCategory.categoryId, categoryId))
            .then((result) => result[0]?.count || 0),
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
         `Failed to find transactions by category id: ${(err as Error).message}`,
      );
   }
}

export async function getCategoryWithMostTransactions(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.execute<{
         categoryId: string;
         categoryName: string;
         transactionCount: string;
      }>(sql`
         SELECT
            c.id as "categoryId",
            c.name as "categoryName",
            COUNT(tc.transaction_id) as "transactionCount"
         FROM ${category} c
         LEFT JOIN ${transactionCategory} tc ON c.id = tc.category_id
         WHERE c.organization_id = ${organizationId}
         GROUP BY c.id, c.name
         ORDER BY "transactionCount" DESC
         LIMIT 1
      `);

      const rows = result.rows;
      if (!rows || rows.length === 0) return null;

      return {
         categoryId: rows[0]?.categoryId,
         categoryName: rows[0]?.categoryName,
         transactionCount: parseInt(rows[0]?.transactionCount ?? "", 10),
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get category with most transactions: ${(err as Error).message}`,
      );
   }
}

export async function findCategoriesByIds(
   dbClient: DatabaseInstance,
   categoryIds: string[],
) {
   if (categoryIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient.query.category.findMany({
         where: inArray(category.id, categoryIds),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find categories by ids: ${(err as Error).message}`,
      );
   }
}

export async function getCategorySpending(
   dbClient: DatabaseInstance,
   organizationId: string,
   categoryId: string,
) {
   try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
      );

      const transactions = await dbClient
         .select({
            amount: transaction.amount,
            categorySplits: transaction.categorySplits,
            transactionId: transaction.id,
         })
         .from(transaction)
         .innerJoin(
            transactionCategory,
            eq(transactionCategory.transactionId, transaction.id),
         )
         .where(
            and(
               eq(transaction.organizationId, organizationId),
               eq(transactionCategory.categoryId, categoryId),
               eq(transaction.type, "expense"),
               gte(transaction.date, currentMonthStart),
               lte(transaction.date, currentMonthEnd),
            ),
         );

      let total = 0;

      for (const tx of transactions) {
         const splits = tx.categorySplits;

         if (splits && splits.length > 0) {
            const split = splits.find((s) => s.categoryId === categoryId);
            if (split) {
               total += split.value / 100;
            }
         } else {
            total += Number(tx.amount);
         }
      }

      return total;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get category spending: ${(err as Error).message}`,
      );
   }
}
