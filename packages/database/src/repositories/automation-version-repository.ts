import { AppError, propagateError } from "@packages/utils/errors";
import { count, eq, max } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type AutomationRuleVersionDiff,
   type AutomationRuleVersionSnapshot,
   automationRuleVersion,
   type RuleChangeType,
} from "../schemas/automations";

export type AutomationRuleVersion = typeof automationRuleVersion.$inferSelect;
export type NewAutomationRuleVersion =
   typeof automationRuleVersion.$inferInsert;

async function getLatestVersionNumber(
   dbClient: DatabaseInstance,
   ruleId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .select({ maxVersion: max(automationRuleVersion.version) })
         .from(automationRuleVersion)
         .where(eq(automationRuleVersion.ruleId, ruleId));

      return result[0]?.maxVersion || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get latest version number: ${(err as Error).message}`,
      );
   }
}

export async function createVersion(
   dbClient: DatabaseInstance,
   data: {
      ruleId: string;
      snapshot: AutomationRuleVersionSnapshot;
      changeType: RuleChangeType;
      changedBy?: string;
      changeDescription?: string;
      diff?: AutomationRuleVersionDiff;
   },
): Promise<AutomationRuleVersion> {
   try {
      const latestVersion = await getLatestVersionNumber(dbClient, data.ruleId);
      const newVersion = latestVersion + 1;

      const result = await dbClient
         .insert(automationRuleVersion)
         .values({
            changeDescription: data.changeDescription,
            changedBy: data.changedBy,
            changeType: data.changeType,
            diff: data.diff,
            ruleId: data.ruleId,
            snapshot: data.snapshot,
            version: newVersion,
         })
         .returning();

      const created = result[0];
      if (!created) {
         throw AppError.database(
            "Failed to create version - no result returned",
         );
      }
      return created;
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict("Version number already exists", {
            cause: err,
         });
      }

      propagateError(err);
      throw AppError.database(
         `Failed to create automation rule version: ${error.message}`,
         { cause: err },
      );
   }
}

export async function getVersionHistory(
   dbClient: DatabaseInstance,
   ruleId: string,
   options: {
      limit?: number;
      offset?: number;
   } = {},
): Promise<{
   versions: AutomationRuleVersion[];
   pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
   };
}> {
   const { limit = 20, offset = 0 } = options;
   const page = Math.floor(offset / limit) + 1;

   try {
      const [versions, totalResult] = await Promise.all([
         dbClient.query.automationRuleVersion.findMany({
            limit,
            offset,
            orderBy: (version, { desc: descFn }) => descFn(version.version),
            where: (version, { eq: eqFn }) => eqFn(version.ruleId, ruleId),
            with: {
               changedByUser: {
                  columns: {
                     email: true,
                     id: true,
                     name: true,
                  },
               },
            },
         }),
         dbClient
            .select({ count: count() })
            .from(automationRuleVersion)
            .where(eq(automationRuleVersion.ruleId, ruleId)),
      ]);

      const totalCount = totalResult[0]?.count || 0;
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
         versions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get version history: ${(err as Error).message}`,
      );
   }
}

export async function getVersion(
   dbClient: DatabaseInstance,
   ruleId: string,
   version: number,
): Promise<AutomationRuleVersion | undefined> {
   try {
      const result = await dbClient.query.automationRuleVersion.findFirst({
         where: (v, { and: andFn, eq: eqFn }) =>
            andFn(eqFn(v.ruleId, ruleId), eqFn(v.version, version)),
         with: {
            changedByUser: {
               columns: {
                  email: true,
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
         `Failed to get version: ${(err as Error).message}`,
      );
   }
}

export async function getLatestVersion(
   dbClient: DatabaseInstance,
   ruleId: string,
): Promise<AutomationRuleVersion | undefined> {
   try {
      const result = await dbClient.query.automationRuleVersion.findFirst({
         orderBy: (version, { desc: descFn }) => descFn(version.version),
         where: (version, { eq: eqFn }) => eqFn(version.ruleId, ruleId),
         with: {
            changedByUser: {
               columns: {
                  email: true,
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
         `Failed to get latest version: ${(err as Error).message}`,
      );
   }
}

export async function deleteVersionsForRule(
   dbClient: DatabaseInstance,
   ruleId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(automationRuleVersion)
         .where(eq(automationRuleVersion.ruleId, ruleId))
         .returning();

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete versions for rule: ${(err as Error).message}`,
      );
   }
}

export async function pruneOldVersions(
   dbClient: DatabaseInstance,
   ruleId: string,
   keepCount: number,
): Promise<number> {
   try {
      const versionsToKeep =
         await dbClient.query.automationRuleVersion.findMany({
            columns: { id: true },
            limit: keepCount,
            orderBy: (version, { desc: descFn }) => descFn(version.version),
            where: (version, { eq: eqFn }) => eqFn(version.ruleId, ruleId),
         });

      if (versionsToKeep.length < keepCount) {
         return 0;
      }

      const idsToKeep = versionsToKeep.map((v) => v.id);

      const allVersions = await dbClient.query.automationRuleVersion.findMany({
         columns: { id: true },
         where: (version, { eq: eqFn }) => eqFn(version.ruleId, ruleId),
      });

      const idsToDelete = allVersions
         .filter((v) => !idsToKeep.includes(v.id))
         .map((v) => v.id);

      if (idsToDelete.length === 0) {
         return 0;
      }

      let deletedCount = 0;
      for (const id of idsToDelete) {
         await dbClient
            .delete(automationRuleVersion)
            .where(eq(automationRuleVersion.id, id));
         deletedCount++;
      }

      return deletedCount;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to prune old versions: ${(err as Error).message}`,
      );
   }
}

export function computeDiff(
   oldSnapshot: AutomationRuleVersionSnapshot,
   newSnapshot: AutomationRuleVersionSnapshot,
): AutomationRuleVersionDiff {
   const diff: AutomationRuleVersionDiff = [];
   const fieldsToCompare: (keyof AutomationRuleVersionSnapshot)[] = [
      "name",
      "description",
      "triggerType",
      "triggerConfig",
      "conditions",
      "actions",
      "flowData",
      "isActive",
      "priority",
      "stopOnFirstMatch",
      "tags",
      "category",
      "metadata",
   ];

   for (const field of fieldsToCompare) {
      const oldValue = oldSnapshot[field];
      const newValue = newSnapshot[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
         diff.push({
            field,
            newValue,
            oldValue,
         });
      }
   }

   return diff;
}

export function createSnapshotFromRule(rule: {
   id: string;
   name: string;
   description?: string | null;
   triggerType: string;
   triggerConfig: Record<string, never> | null;
   conditions: unknown[];
   actions: unknown[];
   flowData?: unknown | null;
   isActive: boolean;
   priority: number;
   stopOnFirstMatch?: boolean | null;
   tags: string[];
   category?: string | null;
   metadata: Record<string, unknown>;
}): AutomationRuleVersionSnapshot {
   return {
      actions: rule.actions as AutomationRuleVersionSnapshot["actions"],
      category: rule.category,
      conditions:
         rule.conditions as AutomationRuleVersionSnapshot["conditions"],
      description: rule.description,
      flowData: rule.flowData as AutomationRuleVersionSnapshot["flowData"],
      id: rule.id,
      isActive: rule.isActive,
      metadata: rule.metadata,
      name: rule.name,
      priority: rule.priority,
      stopOnFirstMatch: rule.stopOnFirstMatch,
      tags: rule.tags,
      triggerConfig:
         rule.triggerConfig as AutomationRuleVersionSnapshot["triggerConfig"],
      triggerType:
         rule.triggerType as AutomationRuleVersionSnapshot["triggerType"],
   };
}
