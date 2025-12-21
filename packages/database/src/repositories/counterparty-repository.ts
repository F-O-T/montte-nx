import {
   decryptCounterpartyFields,
   encryptCounterpartyFields,
} from "@packages/encryption/service";
import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   counterparty,
   counterpartyAttachment,
} from "../schemas/counterparties";

export type Counterparty = typeof counterparty.$inferSelect;
export type NewCounterparty = typeof counterparty.$inferInsert;
export type CounterpartyType = "client" | "supplier" | "both";
export type CounterpartyAttachment = typeof counterpartyAttachment.$inferSelect;
export type NewCounterpartyAttachment = typeof counterpartyAttachment.$inferInsert;

export async function createCounterparty(
   dbClient: DatabaseInstance,
   data: NewCounterparty,
) {
   try {
      // Encrypt sensitive fields before storing
      const encryptedData = encryptCounterpartyFields(data);

      const result = await dbClient
         .insert(counterparty)
         .values(encryptedData)
         .returning();
      // Decrypt sensitive fields before returning
      return result[0] ? decryptCounterpartyFields(result[0]) : undefined;
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Counterparty already exists for this organization",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(
         `Failed to create counterparty: ${error.message}`,
         { cause: err },
      );
   }
}

export async function findCounterpartyById(
   dbClient: DatabaseInstance,
   counterpartyId: string,
) {
   try {
      const result = await dbClient.query.counterparty.findFirst({
         where: (counterparty, { eq }) => eq(counterparty.id, counterpartyId),
      });
      // Decrypt sensitive fields before returning
      return result ? decryptCounterpartyFields(result) : result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find counterparty by id: ${(err as Error).message}`,
      );
   }
}

export async function findCounterpartiesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      type?: CounterpartyType;
      isActive?: boolean;
   } = {},
) {
   const { type, isActive } = options;

   try {
      const conditions = [eq(counterparty.organizationId, organizationId)];

      if (type) {
         conditions.push(eq(counterparty.type, type));
      }

      if (isActive !== undefined) {
         conditions.push(eq(counterparty.isActive, isActive));
      }

      const result = await dbClient.query.counterparty.findMany({
         orderBy: (counterparty, { asc }) => asc(counterparty.name),
         where: and(...conditions),
      });
      // Decrypt sensitive fields before returning
      return result.map(decryptCounterpartyFields);
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find counterparties by organization id: ${(err as Error).message}`,
      );
   }
}

export async function findCounterpartiesByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?:
         | "name"
         | "type"
         | "createdAt"
         | "updatedAt"
         | "tradeName"
         | "legalName";
      orderDirection?: "asc" | "desc";
      search?: string;
      type?: CounterpartyType;
      isActive?: boolean;
      industry?: string;
      startDate?: Date;
      endDate?: Date;
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      orderBy = "name",
      orderDirection = "asc",
      search,
      type,
      isActive,
      industry,
      startDate,
      endDate,
   } = options;

   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(counterparty.organizationId, organizationId)];

      // Enhanced search across multiple fields
      if (search) {
         conditions.push(
            or(
               ilike(counterparty.name, `%${search}%`),
               ilike(counterparty.tradeName, `%${search}%`),
               ilike(counterparty.legalName, `%${search}%`),
               ilike(counterparty.document, `%${search}%`),
               ilike(counterparty.email, `%${search}%`),
            ) ?? ilike(counterparty.name, `%${search}%`),
         );
      }

      if (type) {
         conditions.push(eq(counterparty.type, type));
      }

      if (isActive !== undefined) {
         conditions.push(eq(counterparty.isActive, isActive));
      }

      if (industry) {
         conditions.push(eq(counterparty.industry, industry));
      }

      if (startDate) {
         conditions.push(gte(counterparty.createdAt, startDate));
      }

      if (endDate) {
         conditions.push(lte(counterparty.createdAt, endDate));
      }

      const whereCondition = and(...conditions);

      const [counterparties, totalCount] = await Promise.all([
         dbClient.query.counterparty.findMany({
            limit,
            offset,
            orderBy: (counterparty, { asc, desc }) => {
               const column =
                  counterparty[orderBy as keyof typeof counterparty];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: whereCondition,
         }),
         dbClient.query.counterparty
            .findMany({
               where: whereCondition,
            })
            .then((result) => result.length),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         // Decrypt sensitive fields before returning
         counterparties: counterparties.map(decryptCounterpartyFields),
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
         `Failed to find counterparties paginated: ${(err as Error).message}`,
      );
   }
}

export async function updateCounterparty(
   dbClient: DatabaseInstance,
   counterpartyId: string,
   data: Partial<NewCounterparty>,
) {
   try {
      const existingCounterparty = await findCounterpartyById(
         dbClient,
         counterpartyId,
      );
      if (!existingCounterparty) {
         throw AppError.notFound("Counterparty not found");
      }

      // Encrypt sensitive fields before storing
      const encryptedData = encryptCounterpartyFields(data);

      const result = await dbClient
         .update(counterparty)
         .set(encryptedData)
         .where(eq(counterparty.id, counterpartyId))
         .returning();

      if (!result.length) {
         throw AppError.database("Counterparty not found");
      }

      const counterpartyResult = result[0];
      if (!counterpartyResult) {
         throw AppError.database("Counterparty not found");
      }

      // Decrypt sensitive fields before returning
      return decryptCounterpartyFields(counterpartyResult);
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Counterparty already exists for this organization",
            { cause: err },
         );
      }

      if (err instanceof AppError) {
         throw err;
      }

      propagateError(err);
      throw AppError.database(
         `Failed to update counterparty: ${error.message}`,
         { cause: err },
      );
   }
}

export async function deleteCounterparty(
   dbClient: DatabaseInstance,
   counterpartyId: string,
) {
   try {
      const result = await dbClient
         .delete(counterparty)
         .where(eq(counterparty.id, counterpartyId))
         .returning();

      if (!result.length) {
         throw AppError.database("Counterparty not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete counterparty: ${(err as Error).message}`,
      );
   }
}

export async function deleteManyCounterparties(
   dbClient: DatabaseInstance,
   counterpartyIds: string[],
   organizationId: string,
) {
   if (counterpartyIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient
         .delete(counterparty)
         .where(
            and(
               inArray(counterparty.id, counterpartyIds),
               eq(counterparty.organizationId, organizationId),
            ),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete counterparties: ${(err as Error).message}`,
      );
   }
}

export async function getTotalCounterpartiesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(counterparty)
         .where(eq(counterparty.organizationId, organizationId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total counterparties: ${(err as Error).message}`,
      );
   }
}

export async function searchCounterparties(
   dbClient: DatabaseInstance,
   organizationId: string,
   query: string,
   options: {
      limit?: number;
      type?: CounterpartyType;
      isActive?: boolean;
   } = {},
) {
   const { limit = 20, type, isActive = true } = options;

   try {
      const conditions = [
         eq(counterparty.organizationId, organizationId),
         ilike(counterparty.name, `%${query}%`),
         eq(counterparty.isActive, isActive),
      ];

      if (type) {
         conditions.push(eq(counterparty.type, type));
      }

      const result = await dbClient.query.counterparty.findMany({
         limit,
         orderBy: (counterparty, { asc }) => asc(counterparty.name),
         where: and(...conditions),
      });

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search counterparties: ${(err as Error).message}`,
      );
   }
}

export async function findCounterpartiesByIds(
   dbClient: DatabaseInstance,
   counterpartyIds: string[],
) {
   if (counterpartyIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient.query.counterparty.findMany({
         where: inArray(counterparty.id, counterpartyIds),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find counterparties by ids: ${(err as Error).message}`,
      );
   }
}

export async function getCounterpartyStats(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const [total, clients, suppliers] = await Promise.all([
         dbClient
            .select({ count: count() })
            .from(counterparty)
            .where(
               and(
                  eq(counterparty.organizationId, organizationId),
                  eq(counterparty.isActive, true),
               ),
            ),
         dbClient
            .select({ count: count() })
            .from(counterparty)
            .where(
               and(
                  eq(counterparty.organizationId, organizationId),
                  eq(counterparty.isActive, true),
                  eq(counterparty.type, "client"),
               ),
            ),
         dbClient
            .select({ count: count() })
            .from(counterparty)
            .where(
               and(
                  eq(counterparty.organizationId, organizationId),
                  eq(counterparty.isActive, true),
                  eq(counterparty.type, "supplier"),
               ),
            ),
      ]);

      return {
         totalActive: total[0]?.count || 0,
         totalClients: clients[0]?.count || 0,
         totalSuppliers: suppliers[0]?.count || 0,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get counterparty stats: ${(err as Error).message}`,
      );
   }
}

// Toggle active status
export async function toggleCounterpartyActive(
   dbClient: DatabaseInstance,
   counterpartyId: string,
   organizationId: string,
) {
   try {
      const existing = await findCounterpartyById(dbClient, counterpartyId);
      if (!existing || existing.organizationId !== organizationId) {
         throw AppError.notFound("Counterparty not found");
      }

      const result = await dbClient
         .update(counterparty)
         .set({ isActive: !existing.isActive })
         .where(eq(counterparty.id, counterpartyId))
         .returning();

      return result[0] ? decryptCounterpartyFields(result[0]) : undefined;
   } catch (err) {
      if (err instanceof AppError) throw err;
      propagateError(err);
      throw AppError.database(
         `Failed to toggle counterparty active: ${(err as Error).message}`,
      );
   }
}

// Bulk update type
export async function bulkUpdateCounterpartyType(
   dbClient: DatabaseInstance,
   counterpartyIds: string[],
   type: CounterpartyType,
   organizationId: string,
) {
   if (counterpartyIds.length === 0) return [];

   try {
      const result = await dbClient
         .update(counterparty)
         .set({ type })
         .where(
            and(
               inArray(counterparty.id, counterpartyIds),
               eq(counterparty.organizationId, organizationId),
            ),
         )
         .returning();

      return result.map(decryptCounterpartyFields);
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to bulk update counterparty type: ${(err as Error).message}`,
      );
   }
}

// Bulk update active status
export async function bulkUpdateCounterpartyStatus(
   dbClient: DatabaseInstance,
   counterpartyIds: string[],
   isActive: boolean,
   organizationId: string,
) {
   if (counterpartyIds.length === 0) return [];

   try {
      const result = await dbClient
         .update(counterparty)
         .set({ isActive })
         .where(
            and(
               inArray(counterparty.id, counterpartyIds),
               eq(counterparty.organizationId, organizationId),
            ),
         )
         .returning();

      return result.map(decryptCounterpartyFields);
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to bulk update counterparty status: ${(err as Error).message}`,
      );
   }
}

// Get distinct industries for autocomplete
export async function getDistinctIndustries(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .selectDistinct({ industry: counterparty.industry })
         .from(counterparty)
         .where(
            and(
               eq(counterparty.organizationId, organizationId),
               sql`${counterparty.industry} IS NOT NULL AND ${counterparty.industry} != ''`,
            ),
         )
         .orderBy(counterparty.industry);

      return result
         .map((r) => r.industry)
         .filter((i): i is string => i !== null);
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get distinct industries: ${(err as Error).message}`,
      );
   }
}

// ==================== ATTACHMENT FUNCTIONS ====================

export async function findCounterpartyAttachments(
   dbClient: DatabaseInstance,
   counterpartyId: string,
) {
   try {
      const result = await dbClient.query.counterpartyAttachment.findMany({
         where: eq(counterpartyAttachment.counterpartyId, counterpartyId),
         orderBy: (att, { desc }) => desc(att.createdAt),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find counterparty attachments: ${(err as Error).message}`,
      );
   }
}

export async function createCounterpartyAttachment(
   dbClient: DatabaseInstance,
   data: NewCounterpartyAttachment,
) {
   try {
      const result = await dbClient
         .insert(counterpartyAttachment)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create counterparty attachment: ${(err as Error).message}`,
      );
   }
}

export async function deleteCounterpartyAttachment(
   dbClient: DatabaseInstance,
   attachmentId: string,
) {
   try {
      const result = await dbClient
         .delete(counterpartyAttachment)
         .where(eq(counterpartyAttachment.id, attachmentId))
         .returning();

      if (!result.length) {
         throw AppError.notFound("Attachment not found");
      }

      return result[0];
   } catch (err) {
      if (err instanceof AppError) throw err;
      propagateError(err);
      throw AppError.database(
         `Failed to delete counterparty attachment: ${(err as Error).message}`,
      );
   }
}

export async function findCounterpartyAttachmentById(
   dbClient: DatabaseInstance,
   attachmentId: string,
) {
   try {
      const result = await dbClient.query.counterpartyAttachment.findFirst({
         where: eq(counterpartyAttachment.id, attachmentId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find counterparty attachment: ${(err as Error).message}`,
      );
   }
}
