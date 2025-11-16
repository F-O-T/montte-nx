import { AppError, propagateError } from "@packages/utils/errors";
import { count, desc, eq } from "drizzle-orm";
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
      const [categories, totalCount] = await Promise.all([
         dbClient.query.category.findMany({
            limit,
            offset,
            orderBy: (category, { asc, desc }) => {
               const column = category[orderBy as keyof typeof category];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: (category, { eq }) => eq(category.userId, userId),
         }),
         dbClient.query.category
            .findMany({
               where: (category, { eq }) => eq(category.userId, userId),
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
      const transactionCount = count();

      const result = await dbClient
         .select({
            categoryName: transaction.category,
            transactionCount,
         })
         .from(transaction)
         .where(eq(transaction.userId, userId))
         .groupBy(transaction.category)
         .orderBy(desc(transactionCount))
         .limit(1);

      return result[0] || null;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get category with most transactions: ${(err as Error).message}`,
      );
   }
}
