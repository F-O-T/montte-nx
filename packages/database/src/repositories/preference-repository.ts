import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { preference } from "../schemas/preferences";

export type Preference = typeof preference.$inferSelect;
export type NewPreference = typeof preference.$inferInsert;

export async function createPreference(
   dbClient: DatabaseInstance,
   data: NewPreference,
) {
   try {
      const result = await dbClient.insert(preference).values(data).returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create preference: ${(err as Error).message}`,
      );
   }
}

export async function findPreferenceByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.preference.findFirst({
         where: (preference, { eq }) => eq(preference.userId, userId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find preference by user id: ${(err as Error).message}`,
      );
   }
}

export async function updatePreference(
   dbClient: DatabaseInstance,
   userId: string,
   data: Partial<NewPreference>,
) {
   try {
      const result = await dbClient
         .update(preference)
         .set(data)
         .where(eq(preference.userId, userId))
         .returning();

      if (!result.length) {
         throw AppError.database("Preference not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update preference: ${(err as Error).message}`,
      );
   }
}

export async function upsertPreference(
   dbClient: DatabaseInstance,
   userId: string,
   data: Partial<NewPreference>,
) {
   try {
      // First try to find existing preference
      const existing = await findPreferenceByUserId(dbClient, userId);

      if (existing) {
         // Update existing
         return updatePreference(dbClient, userId, data);
      } else {
         // Create new
         return createPreference(dbClient, {
            ...data,
            id: crypto.randomUUID(),
            userId,
         } as NewPreference);
      }
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to upsert preference: ${(err as Error).message}`,
      );
   }
}
