import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, gte, ilike, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { category } from "../schemas/categories";
import { transaction } from "../schemas/transactions";

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;

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
         throw AppError.conflict(`Category already exists for this user`, {
            cause: err,
         });
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

export async function findCategoriesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.category.findMany({
         orderBy: (category, { asc }) => asc(category.name),
         where: (category, { eq }) => eq(category.userId, userId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find categories by user id: ${(err as Error).message}`,
      );
   }
}

export async function findCategoriesByUserIdPaginated(
   dbClient: DatabaseInstance,
   userId: string,
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
      // Build the where condition
      const baseWhereCondition = eq(category.userId, userId);
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
         `Failed to find categories by user id paginated: ${(err as Error).message}`,
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

      const updateData: Partial<NewCategory> = { ...data };

      const result = await dbClient
         .update(category)
         .set(updateData)
         .where(eq(category.id, categoryId))
         .returning();

      if (!result.length) {
         throw AppError.database("Category not found");
      }

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(`Category already exists for this user`, {
            cause: err,
         });
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

export async function getTotalCategoriesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(category)
         .where(eq(category.userId, userId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total categories: ${(err as Error).message}`,
      );
   }
}

export async function getCategoryWithMostTransactions(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.execute<{
         categoryId: string;
         transactionCount: string;
         categoryName: string;
      }>(sql`
         SELECT
            c.id as "categoryId",
            c.name as "categoryName",
            COUNT(t.id) as "transactionCount"
         FROM ${category} c
         LEFT JOIN (
            SELECT id, unnest(category_ids) as category_id
            FROM ${transaction}
            WHERE user_id = ${userId}
         ) t ON c.id = t.category_id
         WHERE c.user_id = ${userId}
         GROUP BY c.id, c.name
         ORDER BY "transactionCount" DESC
         LIMIT 1
      `);

      // Access rows!
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

export async function getCategorySpending(
   dbClient: DatabaseInstance,
   userId: string,
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

      const result = await dbClient
         .select({
            total: sql<number>`
               sum(
                  CASE WHEN ${transaction.type} = 'expense' THEN
                     COALESCE(
                        (
                           SELECT (split->>'value')::numeric / 100
                           FROM jsonb_array_elements(${transaction.categorySplits}) AS split
                           WHERE split->>'categoryId' = ${categoryId}
                        ),
                        CAST(${transaction.amount} AS REAL)
                     )
                  ELSE 0 END
               )
            `,
         })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, currentMonthStart),
               lte(transaction.date, currentMonthEnd),
               sql`${transaction.categoryIds} @> ARRAY[${categoryId}]::text[]`,
            ),
         );

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get category spending: ${(err as Error).message}`,
      );
   }
}

export async function searchCategories(
   dbClient: DatabaseInstance,
   userId: string,
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
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            transactionCount: string;
         }>(sql`
            SELECT
               c.*,
               COUNT(t.id) as "transactionCount"
            FROM ${category} c
            LEFT JOIN (
               SELECT id, unnest(category_ids) as category_id
               FROM ${transaction}
               WHERE user_id = ${userId}
            ) t ON c.id = t.category_id
            WHERE
               ${eq(category.userId, userId)}
               AND ${ilike(category.name, `%${query}%`)}
            GROUP BY c.id
            ORDER BY c.name ASC
            LIMIT ${limit}
         `);

         return result.rows.map((row) => ({
            ...row,
            transactionCount: parseInt(row.transactionCount, 10),
         }));
      } else {
         const result = await dbClient.query.category.findMany({
            limit,
            orderBy: (category, { asc }) => asc(category.name),
            where: and(
               eq(category.userId, userId),
               ilike(category.name, `%${query}%`),
            ),
         });

         return result;
      }
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search categories: ${(err as Error).message}`,
      );
   }
}
