import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { category } from "../schemas/categories";

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
