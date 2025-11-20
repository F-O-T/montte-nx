import { AppError, propagateError } from "@packages/utils/errors";
import { count, desc, eq, ilike, and, sql, gte, lte } from "drizzle-orm";
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
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create category: ${(err as Error).message}`,
      );
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
         ? and(
              baseWhereCondition,
              ilike(category.name, `%${search}%`)
           )
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
      const result = await dbClient
         .update(category)
         .set(data)
         .where(eq(category.id, categoryId))
         .returning();

      if (!result.length) {
         throw AppError.database("Category not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update category: ${(err as Error).message}`,
      );
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
      }>(sql`
         SELECT category_id as "categoryId", COUNT(*) as "transactionCount"
         FROM (
            SELECT unnest(${transaction.categoryIds}) as category_id
            FROM ${transaction}
            WHERE ${transaction.userId} = ${userId}
         ) sub
         GROUP BY category_id
         ORDER BY "transactionCount" DESC
         LIMIT 1
      `);

      if (!result[0]) return null;

      return {
         categoryId: result[0].categoryId,
         transactionCount: parseInt(result[0].transactionCount, 10),
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
            total: sql<number>`sum(CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)`,
         })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, currentMonthStart),
               lte(transaction.date, currentMonthEnd),
               sql`${transaction.categoryIds} @> ARRAY[${categoryId}]::text[]`
            )
         );

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get category spending: ${(err as Error).message}`,
      );
   }
}
