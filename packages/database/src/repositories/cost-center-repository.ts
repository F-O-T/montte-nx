import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { costCenter } from "../schemas/cost-centers";
import { transaction } from "../schemas/transactions";

export type CostCenter = typeof costCenter.$inferSelect;
export type NewCostCenter = typeof costCenter.$inferInsert;

export async function createCostCenter(
   dbClient: DatabaseInstance,
   data: NewCostCenter,
) {
   try {
      const result = await dbClient.insert(costCenter).values(data).returning();
      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Cost center already exists for this organization",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(
         `Failed to create cost center: ${error.message}`,
         { cause: err },
      );
   }
}

export async function createManyCostCenters(
   dbClient: DatabaseInstance,
   data: NewCostCenter[],
) {
   try {
      const result = await dbClient.insert(costCenter).values(data).returning();
      return result;
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "One or more cost centers already exist for this organization",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(
         `Failed to create cost centers: ${error.message}`,
         { cause: err },
      );
   }
}

export async function findCostCenterById(
   dbClient: DatabaseInstance,
   costCenterId: string,
) {
   try {
      const result = await dbClient.query.costCenter.findFirst({
         where: (costCenter, { eq }) => eq(costCenter.id, costCenterId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find cost center by id: ${(err as Error).message}`,
      );
   }
}

export async function findCostCentersByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.costCenter.findMany({
         orderBy: (costCenter, { asc }) => asc(costCenter.name),
         where: (costCenter, { eq }) =>
            eq(costCenter.organizationId, organizationId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find cost centers by organization id: ${(err as Error).message}`,
      );
   }
}

export async function findCostCentersByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?: "name" | "code" | "createdAt" | "updatedAt";
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
      const baseWhereCondition = eq(costCenter.organizationId, organizationId);
      const whereCondition = search
         ? and(baseWhereCondition, ilike(costCenter.name, `%${search}%`))
         : baseWhereCondition;

      const [costCenters, totalCount] = await Promise.all([
         dbClient.query.costCenter.findMany({
            limit,
            offset,
            orderBy: (costCenter, { asc, desc }) => {
               const column = costCenter[orderBy as keyof typeof costCenter];
               return orderDirection === "asc" ? asc(column) : desc(column);
            },
            where: whereCondition,
         }),
         dbClient.query.costCenter
            .findMany({
               where: whereCondition,
            })
            .then((result) => result.length),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         costCenters,
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
         `Failed to find cost centers paginated: ${(err as Error).message}`,
      );
   }
}

export async function updateCostCenter(
   dbClient: DatabaseInstance,
   costCenterId: string,
   data: Partial<NewCostCenter>,
) {
   try {
      const existingCostCenter = await findCostCenterById(
         dbClient,
         costCenterId,
      );
      if (!existingCostCenter) {
         throw AppError.notFound("Cost center not found");
      }

      const result = await dbClient
         .update(costCenter)
         .set(data)
         .where(eq(costCenter.id, costCenterId))
         .returning();

      if (!result.length) {
         throw AppError.database("Cost center not found");
      }

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Cost center already exists for this organization",
            { cause: err },
         );
      }

      if (err instanceof AppError) {
         throw err;
      }

      propagateError(err);
      throw AppError.database(
         `Failed to update cost center: ${error.message}`,
         { cause: err },
      );
   }
}

export async function deleteCostCenter(
   dbClient: DatabaseInstance,
   costCenterId: string,
) {
   try {
      const result = await dbClient
         .delete(costCenter)
         .where(eq(costCenter.id, costCenterId))
         .returning();

      if (!result.length) {
         throw AppError.database("Cost center not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete cost center: ${(err as Error).message}`,
      );
   }
}

export async function getTotalCostCentersByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(costCenter)
         .where(eq(costCenter.organizationId, organizationId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total cost centers: ${(err as Error).message}`,
      );
   }
}

export async function searchCostCenters(
   dbClient: DatabaseInstance,
   organizationId: string,
   query: string,
   options: {
      limit?: number;
   } = {},
) {
   const { limit = 20 } = options;

   try {
      const result = await dbClient.query.costCenter.findMany({
         limit,
         orderBy: (costCenter, { asc }) => asc(costCenter.name),
         where: and(
            eq(costCenter.organizationId, organizationId),
            ilike(costCenter.name, `%${query}%`),
         ),
      });

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search cost centers: ${(err as Error).message}`,
      );
   }
}

export async function findCostCentersByIds(
   dbClient: DatabaseInstance,
   costCenterIds: string[],
) {
   if (costCenterIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient.query.costCenter.findMany({
         where: inArray(costCenter.id, costCenterIds),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find cost centers by ids: ${(err as Error).message}`,
      );
   }
}

export async function findCostCenterByCode(
   dbClient: DatabaseInstance,
   organizationId: string,
   code: string,
) {
   try {
      const result = await dbClient.query.costCenter.findFirst({
         where: and(
            eq(costCenter.organizationId, organizationId),
            eq(costCenter.code, code),
         ),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find cost center by code: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionsByCostCenterId(
   dbClient: DatabaseInstance,
   costCenterId: string,
   options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
   } = {},
) {
   const { page = 1, limit = 10, startDate, endDate } = options;
   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(transaction.costCenterId, costCenterId)];

      if (startDate) {
         conditions.push(gte(transaction.date, startDate));
      }
      if (endDate) {
         conditions.push(lte(transaction.date, endDate));
      }

      const whereCondition = and(...conditions);

      const [transactions, totalCount] = await Promise.all([
         dbClient.query.transaction.findMany({
            limit,
            offset,
            orderBy: (transaction, { desc }) => desc(transaction.date),
            where: whereCondition,
            with: {
               bankAccount: true,
            },
         }),
         dbClient.query.transaction
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
         transactions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by cost center id: ${(err as Error).message}`,
      );
   }
}

export async function getCostCenterSpending(
   dbClient: DatabaseInstance,
   costCenterId: string,
   options: {
      startDate?: Date;
      endDate?: Date;
   } = {},
) {
   const { startDate, endDate } = options;

   try {
      const now = new Date();
      const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const conditions = [
         eq(transaction.costCenterId, costCenterId),
         eq(transaction.type, "expense"),
         gte(transaction.date, startDate || defaultStartDate),
         lte(transaction.date, endDate || defaultEndDate),
      ];

      const result = await dbClient
         .select({
            total: sql<number>`sum(CAST(${transaction.amount} AS REAL))`,
         })
         .from(transaction)
         .where(and(...conditions));

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get cost center spending: ${(err as Error).message}`,
      );
   }
}

export async function getCostCenterWithMostTransactions(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.execute<{
         costCenterId: string;
         costCenterName: string;
         transactionCount: string;
      }>(sql`
         SELECT
            cc.id as "costCenterId",
            cc.name as "costCenterName",
            COUNT(t.id) as "transactionCount"
         FROM ${costCenter} cc
         LEFT JOIN ${transaction} t ON cc.id = t.cost_center_id
         WHERE cc.organization_id = ${organizationId}
         GROUP BY cc.id, cc.name
         ORDER BY "transactionCount" DESC
         LIMIT 1
      `);

      const rows = result.rows;
      if (!rows || rows.length === 0) return null;

      return {
         costCenterId: rows[0]?.costCenterId,
         costCenterName: rows[0]?.costCenterName,
         transactionCount: parseInt(rows[0]?.transactionCount ?? "", 10),
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get cost center with most transactions: ${(err as Error).message}`,
      );
   }
}

export async function getCostCenterSummary(
   dbClient: DatabaseInstance,
   costCenterId: string,
   options: {
      startDate?: Date;
      endDate?: Date;
   } = {},
) {
   const { startDate, endDate } = options;

   try {
      const now = new Date();
      const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const dateConditions = [
         eq(transaction.costCenterId, costCenterId),
         gte(transaction.date, startDate || defaultStartDate),
         lte(transaction.date, endDate || defaultEndDate),
      ];

      const result = await dbClient
         .select({
            totalExpenses: sql<number>`sum(CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)`,
            totalIncome: sql<number>`sum(CASE WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS REAL) ELSE 0 END)`,
            transactionCount: count(),
         })
         .from(transaction)
         .where(and(...dateConditions));

      return {
         totalExpenses: result[0]?.totalExpenses || 0,
         totalIncome: result[0]?.totalIncome || 0,
         transactionCount: result[0]?.transactionCount || 0,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get cost center summary: ${(err as Error).message}`,
      );
   }
}

export const DEFAULT_COST_CENTERS: Omit<
   NewCostCenter,
   "organizationId" | "id"
>[] = [
   { code: "ADM", name: "Administrativo" },
   { code: "COM", name: "Comercial" },
   { code: "MKT", name: "Marketing" },
   { code: "OPS", name: "Operacional" },
   { code: "FIN", name: "Financeiro" },
   { code: "RH", name: "Recursos Humanos" },
];

export async function createDefaultCostCenters(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const costCentersToCreate = DEFAULT_COST_CENTERS.map((cc) => ({
         ...cc,
         organizationId,
      }));

      const result = await createManyCostCenters(dbClient, costCentersToCreate);
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create default cost centers: ${(err as Error).message}`,
      );
   }
}
