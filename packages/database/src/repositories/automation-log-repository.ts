import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type AutomationLogStatus,
   automationLog,
   type RelatedEntityType,
   type TriggerType,
} from "../schemas/automations";

export type AutomationLog = typeof automationLog.$inferSelect;
export type NewAutomationLog = typeof automationLog.$inferInsert;

export async function createAutomationLog(
   dbClient: DatabaseInstance,
   data: NewAutomationLog,
) {
   try {
      const result = await dbClient
         .insert(automationLog)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create automation log: ${(err as Error).message}`,
      );
   }
}

export async function findAutomationLogById(
   dbClient: DatabaseInstance,
   logId: string,
) {
   try {
      const result = await dbClient.query.automationLog.findFirst({
         where: (log, { eq }) => eq(log.id, logId),
         with: {
            rule: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find automation log: ${(err as Error).message}`,
      );
   }
}

export async function findAutomationLogsByRuleId(
   dbClient: DatabaseInstance,
   ruleId: string,
   options: {
      page?: number;
      limit?: number;
      status?: AutomationLogStatus;
   } = {},
) {
   const { page = 1, limit = 20, status } = options;
   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(automationLog.ruleId, ruleId)];

      if (status) {
         conditions.push(eq(automationLog.status, status));
      }

      const whereCondition = and(...conditions);

      const [logs, totalCount] = await Promise.all([
         dbClient.query.automationLog.findMany({
            limit,
            offset,
            orderBy: (log, { desc }) => desc(log.createdAt),
            where: whereCondition,
         }),
         dbClient
            .select({ count: count() })
            .from(automationLog)
            .where(whereCondition)
            .then((result) => result[0]?.count || 0),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         logs,
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
         `Failed to find automation logs by rule: ${(err as Error).message}`,
      );
   }
}

export async function findAutomationLogsByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      status?: AutomationLogStatus;
      triggerType?: TriggerType;
      startDate?: Date;
      endDate?: Date;
   } = {},
) {
   const {
      page = 1,
      limit = 20,
      status,
      triggerType,
      startDate,
      endDate,
   } = options;
   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(automationLog.organizationId, organizationId)];

      if (status) {
         conditions.push(eq(automationLog.status, status));
      }

      if (triggerType) {
         conditions.push(eq(automationLog.triggerType, triggerType));
      }

      if (startDate) {
         conditions.push(gte(automationLog.createdAt, startDate));
      }

      if (endDate) {
         conditions.push(lte(automationLog.createdAt, endDate));
      }

      const whereCondition = and(...conditions);

      const [logs, totalCount] = await Promise.all([
         dbClient.query.automationLog.findMany({
            limit,
            offset,
            orderBy: (log, { desc }) => desc(log.createdAt),
            where: whereCondition,
            with: {
               rule: {
                  columns: {
                     id: true,
                     isActive: true,
                     name: true,
                  },
               },
            },
         }),
         dbClient
            .select({ count: count() })
            .from(automationLog)
            .where(whereCondition)
            .then((result) => result[0]?.count || 0),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         logs,
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
         `Failed to find automation logs: ${(err as Error).message}`,
      );
   }
}

export async function findRecentAutomationLogs(
   dbClient: DatabaseInstance,
   organizationId: string,
   limit: number = 10,
) {
   try {
      const result = await dbClient.query.automationLog.findMany({
         limit,
         orderBy: (log, { desc }) => desc(log.createdAt),
         where: (log, { eq }) => eq(log.organizationId, organizationId),
         with: {
            rule: {
               columns: {
                  id: true,
                  name: true,
               },
            },
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find recent automation logs: ${(err as Error).message}`,
      );
   }
}

export async function getAutomationLogStats(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      startDate?: Date;
      endDate?: Date;
   } = {},
) {
   const { startDate, endDate } = options;

   try {
      const conditions = [eq(automationLog.organizationId, organizationId)];

      if (startDate) {
         conditions.push(gte(automationLog.createdAt, startDate));
      }

      if (endDate) {
         conditions.push(lte(automationLog.createdAt, endDate));
      }

      const whereCondition = and(...conditions);

      const result = await dbClient
         .select({
            count: count(),
            status: automationLog.status,
         })
         .from(automationLog)
         .where(whereCondition)
         .groupBy(automationLog.status);

      const stats = {
         failed: 0,
         partial: 0,
         skipped: 0,
         success: 0,
         total: 0,
      };

      for (const row of result) {
         stats[row.status as keyof typeof stats] = row.count;
         stats.total += row.count;
      }

      return stats;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get automation log stats: ${(err as Error).message}`,
      );
   }
}

export async function getAverageExecutionTime(
   dbClient: DatabaseInstance,
   organizationId: string,
   ruleId?: string,
) {
   try {
      const conditions = [eq(automationLog.organizationId, organizationId)];

      if (ruleId) {
         conditions.push(eq(automationLog.ruleId, ruleId));
      }

      const result = await dbClient.execute<{ avgDuration: string | null }>(sql`
         SELECT AVG(duration_ms) as "avgDuration"
         FROM ${automationLog}
         WHERE organization_id = ${organizationId}
         ${ruleId ? sql`AND rule_id = ${ruleId}` : sql``}
         AND duration_ms IS NOT NULL
      `);

      return result.rows[0]?.avgDuration
         ? parseFloat(result.rows[0].avgDuration)
         : null;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get average execution time: ${(err as Error).message}`,
      );
   }
}

export async function deleteOldAutomationLogs(
   dbClient: DatabaseInstance,
   organizationId: string,
   olderThanDays: number = 30,
) {
   try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await dbClient
         .delete(automationLog)
         .where(
            and(
               eq(automationLog.organizationId, organizationId),
               lte(automationLog.createdAt, cutoffDate),
            ),
         )
         .returning({ id: automationLog.id });

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete old automation logs: ${(err as Error).message}`,
      );
   }
}

export async function findLogsByRelatedEntity(
   dbClient: DatabaseInstance,
   entityType: RelatedEntityType,
   entityId: string,
) {
   try {
      const result = await dbClient.query.automationLog.findMany({
         orderBy: (log, { desc }) => desc(log.createdAt),
         where: (log, { and, eq }) =>
            and(
               eq(log.relatedEntityType, entityType),
               eq(log.relatedEntityId, entityId),
            ),
         with: {
            rule: {
               columns: {
                  id: true,
                  name: true,
               },
            },
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find logs by related entity: ${(err as Error).message}`,
      );
   }
}
