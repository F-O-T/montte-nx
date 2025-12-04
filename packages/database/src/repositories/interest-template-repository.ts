import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, ilike, inArray } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { interestTemplate } from "../schemas/interest-templates";

export type InterestTemplate = typeof interestTemplate.$inferSelect;
export type NewInterestTemplate = typeof interestTemplate.$inferInsert;
export type PenaltyType = "none" | "percentage" | "fixed";
export type InterestType = "none" | "daily" | "monthly";
export type MonetaryCorrectionIndex = "none" | "ipca" | "selic" | "cdi";

export async function createInterestTemplate(
   dbClient: DatabaseInstance,
   data: NewInterestTemplate,
) {
   try {
      if (data.isDefault) {
         await dbClient
            .update(interestTemplate)
            .set({ isDefault: false })
            .where(eq(interestTemplate.organizationId, data.organizationId));
      }

      const result = await dbClient
         .insert(interestTemplate)
         .values(data)
         .returning();
      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Interest template already exists for this organization",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(
         `Failed to create interest template: ${error.message}`,
         { cause: err },
      );
   }
}

export async function findInterestTemplateById(
   dbClient: DatabaseInstance,
   interestTemplateId: string,
) {
   try {
      const result = await dbClient.query.interestTemplate.findFirst({
         where: (template, { eq }) => eq(template.id, interestTemplateId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find interest template by id: ${(err as Error).message}`,
      );
   }
}

export async function findInterestTemplatesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      isActive?: boolean;
   } = {},
) {
   const { isActive } = options;

   try {
      const conditions = [eq(interestTemplate.organizationId, organizationId)];

      if (isActive !== undefined) {
         conditions.push(eq(interestTemplate.isActive, isActive));
      }

      const result = await dbClient.query.interestTemplate.findMany({
         orderBy: (template, { asc }) => asc(template.name),
         where: and(...conditions),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find interest templates by organization id: ${(err as Error).message}`,
      );
   }
}

export async function findInterestTemplatesByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?: "name" | "createdAt" | "updatedAt";
      orderDirection?: "asc" | "desc";
      search?: string;
      isActive?: boolean;
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      orderBy = "name",
      orderDirection = "asc",
      search,
      isActive,
   } = options;

   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(interestTemplate.organizationId, organizationId)];

      if (search) {
         conditions.push(ilike(interestTemplate.name, `%${search}%`));
      }

      if (isActive !== undefined) {
         conditions.push(eq(interestTemplate.isActive, isActive));
      }

      const whereCondition = and(...conditions);

      const [templates, totalCount] = await Promise.all([
         dbClient.query.interestTemplate.findMany({
            limit,
            offset,
            orderBy: (template, { asc, desc }) => {
               const column = template[orderBy as keyof typeof template];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: whereCondition,
         }),
         dbClient.query.interestTemplate
            .findMany({
               where: whereCondition,
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
         templates,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find interest templates paginated: ${(err as Error).message}`,
      );
   }
}

export async function updateInterestTemplate(
   dbClient: DatabaseInstance,
   interestTemplateId: string,
   data: Partial<NewInterestTemplate>,
) {
   try {
      const existingTemplate = await findInterestTemplateById(
         dbClient,
         interestTemplateId,
      );
      if (!existingTemplate) {
         throw AppError.notFound("Interest template not found");
      }

      if (data.isDefault) {
         await dbClient
            .update(interestTemplate)
            .set({ isDefault: false })
            .where(
               eq(
                  interestTemplate.organizationId,
                  existingTemplate.organizationId,
               ),
            );
      }

      const result = await dbClient
         .update(interestTemplate)
         .set(data)
         .where(eq(interestTemplate.id, interestTemplateId))
         .returning();

      if (!result.length) {
         throw AppError.database("Interest template not found");
      }

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Interest template already exists for this organization",
            { cause: err },
         );
      }

      if (err instanceof AppError) {
         throw err;
      }

      propagateError(err);
      throw AppError.database(
         `Failed to update interest template: ${error.message}`,
         { cause: err },
      );
   }
}

export async function deleteInterestTemplate(
   dbClient: DatabaseInstance,
   interestTemplateId: string,
) {
   try {
      const result = await dbClient
         .delete(interestTemplate)
         .where(eq(interestTemplate.id, interestTemplateId))
         .returning();

      if (!result.length) {
         throw AppError.database("Interest template not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete interest template: ${(err as Error).message}`,
      );
   }
}

export async function deleteManyInterestTemplates(
   dbClient: DatabaseInstance,
   interestTemplateIds: string[],
   organizationId: string,
) {
   if (interestTemplateIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient
         .delete(interestTemplate)
         .where(
            and(
               inArray(interestTemplate.id, interestTemplateIds),
               eq(interestTemplate.organizationId, organizationId),
            ),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete interest templates: ${(err as Error).message}`,
      );
   }
}

export async function getTotalInterestTemplatesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(interestTemplate)
         .where(eq(interestTemplate.organizationId, organizationId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total interest templates: ${(err as Error).message}`,
      );
   }
}

export async function searchInterestTemplates(
   dbClient: DatabaseInstance,
   organizationId: string,
   query: string,
   options: {
      limit?: number;
      isActive?: boolean;
   } = {},
) {
   const { limit = 20, isActive = true } = options;

   try {
      const conditions = [
         eq(interestTemplate.organizationId, organizationId),
         ilike(interestTemplate.name, `%${query}%`),
         eq(interestTemplate.isActive, isActive),
      ];

      const result = await dbClient.query.interestTemplate.findMany({
         limit,
         orderBy: (template, { asc }) => asc(template.name),
         where: and(...conditions),
      });

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search interest templates: ${(err as Error).message}`,
      );
   }
}

export async function findInterestTemplatesByIds(
   dbClient: DatabaseInstance,
   interestTemplateIds: string[],
) {
   if (interestTemplateIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient.query.interestTemplate.findMany({
         where: inArray(interestTemplate.id, interestTemplateIds),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find interest templates by ids: ${(err as Error).message}`,
      );
   }
}

export async function findDefaultInterestTemplate(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.interestTemplate.findFirst({
         where: and(
            eq(interestTemplate.organizationId, organizationId),
            eq(interestTemplate.isDefault, true),
            eq(interestTemplate.isActive, true),
         ),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find default interest template: ${(err as Error).message}`,
      );
   }
}

export async function getInterestTemplateStats(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const [total, active, withPenalty, withInterest, withCorrection] =
         await Promise.all([
            dbClient
               .select({ count: count() })
               .from(interestTemplate)
               .where(eq(interestTemplate.organizationId, organizationId)),
            dbClient
               .select({ count: count() })
               .from(interestTemplate)
               .where(
                  and(
                     eq(interestTemplate.organizationId, organizationId),
                     eq(interestTemplate.isActive, true),
                  ),
               ),
            dbClient.query.interestTemplate
               .findMany({
                  where: and(
                     eq(interestTemplate.organizationId, organizationId),
                     eq(interestTemplate.isActive, true),
                  ),
               })
               .then(
                  (templates) =>
                     templates.filter((t) => t.penaltyType !== "none").length,
               ),
            dbClient.query.interestTemplate
               .findMany({
                  where: and(
                     eq(interestTemplate.organizationId, organizationId),
                     eq(interestTemplate.isActive, true),
                  ),
               })
               .then(
                  (templates) =>
                     templates.filter((t) => t.interestType !== "none").length,
               ),
            dbClient.query.interestTemplate
               .findMany({
                  where: and(
                     eq(interestTemplate.organizationId, organizationId),
                     eq(interestTemplate.isActive, true),
                  ),
               })
               .then(
                  (templates) =>
                     templates.filter(
                        (t) => t.monetaryCorrectionIndex !== "none",
                     ).length,
               ),
         ]);

      return {
         total: total[0]?.count || 0,
         totalActive: active[0]?.count || 0,
         withCorrection,
         withInterest,
         withPenalty,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get interest template stats: ${(err as Error).message}`,
      );
   }
}
