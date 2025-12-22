import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, ilike, inArray } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { automationRule, type TriggerType } from "../schemas/automations";

export type AutomationRule = typeof automationRule.$inferSelect;
export type NewAutomationRule = typeof automationRule.$inferInsert;

export async function createAutomationRule(
   dbClient: DatabaseInstance,
   data: NewAutomationRule,
) {
   try {
      const result = await dbClient
         .insert(automationRule)
         .values(data)
         .returning();
      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Automation rule with this name already exists",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(
         `Failed to create automation rule: ${error.message}`,
         { cause: err },
      );
   }
}

export async function findAutomationRuleById(
   dbClient: DatabaseInstance,
   ruleId: string,
) {
   try {
      const result = await dbClient.query.automationRule.findFirst({
         where: (rule, { eq }) => eq(rule.id, ruleId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find automation rule by id: ${(err as Error).message}`,
      );
   }
}

export async function findAutomationRulesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.automationRule.findMany({
         orderBy: (rule, { desc }) => desc(rule.priority),
         where: (rule, { eq }) => eq(rule.organizationId, organizationId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find automation rules: ${(err as Error).message}`,
      );
   }
}

export async function findActiveAutomationRulesByTrigger(
   dbClient: DatabaseInstance,
   organizationId: string,
   triggerType: TriggerType,
) {
   try {
      const result = await dbClient.query.automationRule.findMany({
         orderBy: (rule, { desc }) => desc(rule.priority),
         where: (rule, { and, eq }) =>
            and(
               eq(rule.organizationId, organizationId),
               eq(rule.triggerType, triggerType),
               eq(rule.enabled, true),
            ),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find active automation rules: ${(err as Error).message}`,
      );
   }
}

export async function findAutomationRulesByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?: "name" | "createdAt" | "updatedAt" | "priority";
      orderDirection?: "asc" | "desc";
      search?: string;
      triggerType?: TriggerType;
      enabled?: boolean;
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      orderBy = "priority",
      orderDirection = "desc",
      search,
      triggerType,
      enabled,
   } = options;

   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(automationRule.organizationId, organizationId)];

      if (search) {
         conditions.push(ilike(automationRule.name, `%${search}%`));
      }

      if (triggerType) {
         conditions.push(eq(automationRule.triggerType, triggerType));
      }

      if (enabled !== undefined) {
         conditions.push(eq(automationRule.enabled, enabled));
      }

      const whereCondition = and(...conditions);

      const [rules, totalCount] = await Promise.all([
         dbClient.query.automationRule.findMany({
            limit,
            offset,
            orderBy: (rule, { asc, desc: descFn }) => {
               const column = rule[orderBy as keyof typeof rule];
               return orderDirection === "asc" ? asc(column) : descFn(column);
            },
            where: whereCondition,
         }),
         dbClient
            .select({ count: count() })
            .from(automationRule)
            .where(whereCondition)
            .then((result) => result[0]?.count || 0),
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
         rules,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find automation rules paginated: ${(err as Error).message}`,
      );
   }
}

export async function updateAutomationRule(
   dbClient: DatabaseInstance,
   ruleId: string,
   data: Partial<NewAutomationRule>,
) {
   try {
      const existingRule = await findAutomationRuleById(dbClient, ruleId);
      if (!existingRule) {
         throw AppError.notFound("Automation rule not found");
      }

      const result = await dbClient
         .update(automationRule)
         .set(data)
         .where(eq(automationRule.id, ruleId))
         .returning();

      if (!result.length) {
         throw AppError.database("Automation rule not found");
      }

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Automation rule with this name already exists",
            { cause: err },
         );
      }

      if (err instanceof AppError) {
         throw err;
      }

      propagateError(err);
      throw AppError.database(
         `Failed to update automation rule: ${error.message}`,
         { cause: err },
      );
   }
}

export async function deleteAutomationRule(
   dbClient: DatabaseInstance,
   ruleId: string,
) {
   try {
      const result = await dbClient
         .delete(automationRule)
         .where(eq(automationRule.id, ruleId))
         .returning();

      if (!result.length) {
         throw AppError.notFound("Automation rule not found");
      }

      return result[0];
   } catch (err) {
      if (err instanceof AppError) {
         throw err;
      }
      propagateError(err);
      throw AppError.database(
         `Failed to delete automation rule: ${(err as Error).message}`,
      );
   }
}

export async function deleteManyAutomationRules(
   dbClient: DatabaseInstance,
   ruleIds: string[],
   organizationId: string,
) {
   if (ruleIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient
         .delete(automationRule)
         .where(
            and(
               inArray(automationRule.id, ruleIds),
               eq(automationRule.organizationId, organizationId),
            ),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete automation rules: ${(err as Error).message}`,
      );
   }
}

export async function toggleAutomationRule(
   dbClient: DatabaseInstance,
   ruleId: string,
   enabled: boolean,
) {
   try {
      const result = await dbClient
         .update(automationRule)
         .set({ enabled })
         .where(eq(automationRule.id, ruleId))
         .returning();

      if (!result.length) {
         throw AppError.notFound("Automation rule not found");
      }

      return result[0];
   } catch (err) {
      if (err instanceof AppError) {
         throw err;
      }
      propagateError(err);
      throw AppError.database(
         `Failed to toggle automation rule: ${(err as Error).message}`,
      );
   }
}

export async function getTotalAutomationRulesByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(automationRule)
         .where(eq(automationRule.organizationId, organizationId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total automation rules: ${(err as Error).message}`,
      );
   }
}

export async function getActiveAutomationRulesCount(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(automationRule)
         .where(
            and(
               eq(automationRule.organizationId, organizationId),
               eq(automationRule.enabled, true),
            ),
         );

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get active automation rules count: ${(err as Error).message}`,
      );
   }
}

export async function duplicateAutomationRule(
   dbClient: DatabaseInstance,
   ruleId: string,
   newName: string,
) {
   try {
      const existingRule = await findAutomationRuleById(dbClient, ruleId);
      if (!existingRule) {
         throw AppError.notFound("Automation rule not found");
      }

      const {
         id: _id,
         createdAt: _createdAt,
         updatedAt: _updatedAt,
         ...ruleData
      } = existingRule;

      const result = await dbClient
         .insert(automationRule)
         .values({
            ...ruleData,
            enabled: false,
            name: newName,
         })
         .returning();

      return result[0];
   } catch (err) {
      if (err instanceof AppError) {
         throw err;
      }
      propagateError(err);
      throw AppError.database(
         `Failed to duplicate automation rule: ${(err as Error).message}`,
      );
   }
}
