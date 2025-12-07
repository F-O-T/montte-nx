import { ConditionGroup as ConditionGroupSchema } from "@f-o-t/condition-evaluator";
import {
   findAutomationLogsByOrganizationIdPaginated,
   findAutomationLogsByRuleId,
   findRecentAutomationLogs,
   getAutomationLogStats,
   getAverageExecutionTime,
} from "@packages/database/repositories/automation-log-repository";
import {
   createAutomationRule,
   deleteAutomationRule,
   deleteManyAutomationRules,
   duplicateAutomationRule,
   findAutomationRuleById,
   findAutomationRulesByOrganizationId,
   findAutomationRulesByOrganizationIdPaginated,
   getActiveAutomationRulesCount,
   getTotalAutomationRulesByOrganizationId,
   toggleAutomationRule,
   updateAutomationRule,
} from "@packages/database/repositories/automation-repository";
import type {
   Action,
   ConditionGroup,
   FlowData,
   TriggerConfig,
   TriggerType,
} from "@packages/database/schema";
import { emitManualTrigger } from "@packages/rules-engine/queue/producer";
import type { AutomationEvent } from "@packages/rules-engine/types/events";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const triggerTypeSchema = z.enum([
   "transaction.created",
   "transaction.updated",
]);

const triggerConfigSchema = z.object({}).optional().default({});

const actionTypeSchema = z.enum([
   "set_category",
   "add_tag",
   "remove_tag",
   "set_cost_center",
   "update_description",
   "create_transaction",
   "send_push_notification",
   "send_email",
   "stop_execution",
]);

const actionConfigSchema = z.object({
   amountField: z.string().optional(),
   amountFixed: z.number().optional(),
   bankAccountId: z.string().optional(),
   body: z.string().optional(),
   categoryId: z.string().optional(),
   costCenterId: z.string().optional(),
   customEmail: z.string().optional(),
   dateField: z.string().optional(),
   description: z.string().optional(),
   mode: z.enum(["replace", "append", "prepend"]).optional(),
   reason: z.string().optional(),
   subject: z.string().optional(),
   tagIds: z.array(z.string()).optional(),
   template: z.boolean().optional(),
   title: z.string().optional(),
   to: z.enum(["owner", "custom"]).optional(),
   type: z.enum(["income", "expense"]).optional(),
   url: z.string().optional(),
   value: z.string().optional(),
});

const actionSchema = z.object({
   config: actionConfigSchema,
   continueOnError: z.boolean().optional(),
   id: z.string(),
   type: actionTypeSchema,
});

const flowDataSchema = z
   .object({
      edges: z.array(z.unknown()),
      nodes: z.array(z.unknown()),
      viewport: z
         .object({
            x: z.number(),
            y: z.number(),
            zoom: z.number(),
         })
         .optional(),
   })
   .optional()
   .nullable();

const createAutomationRuleSchema = z.object({
   actions: z.array(actionSchema).min(1, "At least one action is required"),
   conditions: z.array(ConditionGroupSchema).default([]),
   description: z.string().optional(),
   flowData: flowDataSchema,
   isActive: z.boolean().default(false),
   name: z.string().min(1, "Name is required"),
   priority: z.number().int().default(0),
   stopOnFirstMatch: z.boolean().default(false),
   triggerConfig: triggerConfigSchema,
   triggerType: triggerTypeSchema,
});

const updateAutomationRuleSchema = z.object({
   actions: z.array(actionSchema).optional(),
   conditions: z.array(ConditionGroupSchema).optional(),
   description: z.string().optional().nullable(),
   flowData: flowDataSchema,
   isActive: z.boolean().optional(),
   name: z.string().min(1).optional(),
   priority: z.number().int().optional(),
   stopOnFirstMatch: z.boolean().optional(),
   triggerConfig: triggerConfigSchema.optional(),
   triggerType: triggerTypeSchema.optional(),
});

const paginationSchema = z.object({
   isActive: z.boolean().optional(),
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z
      .enum(["name", "createdAt", "updatedAt", "priority"])
      .default("priority"),
   orderDirection: z.enum(["asc", "desc"]).default("desc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   triggerType: triggerTypeSchema.optional(),
});

const logPaginationSchema = z.object({
   endDate: z.coerce.date().optional(),
   limit: z.coerce.number().min(1).max(100).default(20),
   page: z.coerce.number().min(1).default(1),
   startDate: z.coerce.date().optional(),
   status: z.enum(["success", "partial", "failed", "skipped"]).optional(),
   triggerType: triggerTypeSchema.optional(),
});

export const automationRouter = router({
   create: protectedProcedure
      .input(createAutomationRuleSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createAutomationRule(resolvedCtx.db, {
            ...input,
            actions: input.actions as Action[],
            conditions: input.conditions as ConditionGroup[],
            createdBy: resolvedCtx.session?.user?.id,
            flowData: input.flowData as FlowData | undefined,
            organizationId,
            triggerConfig: input.triggerConfig as TriggerConfig,
         });
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingRule = await findAutomationRuleById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingRule || existingRule.organizationId !== organizationId) {
            throw new Error("Automation rule not found");
         }

         return deleteAutomationRule(resolvedCtx.db, input.id);
      }),

   deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return deleteManyAutomationRules(
            resolvedCtx.db,
            input.ids,
            organizationId,
         );
      }),

   duplicate: protectedProcedure
      .input(
         z.object({
            id: z.string(),
            newName: z.string().min(1),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingRule = await findAutomationRuleById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingRule || existingRule.organizationId !== organizationId) {
            throw new Error("Automation rule not found");
         }

         return duplicateAutomationRule(
            resolvedCtx.db,
            input.id,
            input.newName,
         );
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findAutomationRulesByOrganizationId(
         resolvedCtx.db,
         organizationId,
      );
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findAutomationRulesByOrganizationIdPaginated(
            resolvedCtx.db,
            organizationId,
            {
               isActive: input.isActive,
               limit: input.limit,
               orderBy: input.orderBy,
               orderDirection: input.orderDirection,
               page: input.page,
               search: input.search,
               triggerType: input.triggerType as TriggerType | undefined,
            },
         );
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const rule = await findAutomationRuleById(resolvedCtx.db, input.id);

         if (!rule || rule.organizationId !== organizationId) {
            throw new Error("Automation rule not found");
         }

         return rule;
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      const [totalRules, activeRules, logStats, avgExecutionTime] =
         await Promise.all([
            getTotalAutomationRulesByOrganizationId(
               resolvedCtx.db,
               organizationId,
            ),
            getActiveAutomationRulesCount(resolvedCtx.db, organizationId),
            getAutomationLogStats(resolvedCtx.db, organizationId),
            getAverageExecutionTime(resolvedCtx.db, organizationId),
         ]);

      return {
         activeRules,
         avgExecutionTimeMs: avgExecutionTime,
         executionStats: logStats,
         inactiveRules: totalRules - activeRules,
         totalRules,
      };
   }),

   logs: router({
      getAllPaginated: protectedProcedure
         .input(logPaginationSchema)
         .query(async ({ ctx, input }) => {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            return findAutomationLogsByOrganizationIdPaginated(
               resolvedCtx.db,
               organizationId,
               {
                  endDate: input.endDate,
                  limit: input.limit,
                  page: input.page,
                  startDate: input.startDate,
                  status: input.status,
                  triggerType: input.triggerType as TriggerType | undefined,
               },
            );
         }),
      getByRuleId: protectedProcedure
         .input(
            z.object({
               limit: z.coerce.number().min(1).max(100).default(20),
               page: z.coerce.number().min(1).default(1),
               ruleId: z.string(),
               status: z
                  .enum(["success", "partial", "failed", "skipped"])
                  .optional(),
            }),
         )
         .query(async ({ ctx, input }) => {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            const rule = await findAutomationRuleById(
               resolvedCtx.db,
               input.ruleId,
            );

            if (!rule || rule.organizationId !== organizationId) {
               throw new Error("Automation rule not found");
            }

            return findAutomationLogsByRuleId(resolvedCtx.db, input.ruleId, {
               limit: input.limit,
               page: input.page,
               status: input.status,
            });
         }),

      getRecent: protectedProcedure
         .input(
            z.object({ limit: z.coerce.number().min(1).max(50).default(10) }),
         )
         .query(async ({ ctx, input }) => {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            return findRecentAutomationLogs(
               resolvedCtx.db,
               organizationId,
               input.limit,
            );
         }),

      getStats: protectedProcedure
         .input(
            z.object({
               endDate: z.coerce.date().optional(),
               startDate: z.coerce.date().optional(),
            }),
         )
         .query(async ({ ctx, input }) => {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            return getAutomationLogStats(resolvedCtx.db, organizationId, {
               endDate: input.endDate,
               startDate: input.startDate,
            });
         }),
   }),

   toggle: protectedProcedure
      .input(
         z.object({
            id: z.string(),
            isActive: z.boolean(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingRule = await findAutomationRuleById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingRule || existingRule.organizationId !== organizationId) {
            throw new Error("Automation rule not found");
         }

         return toggleAutomationRule(resolvedCtx.db, input.id, input.isActive);
      }),

   triggerManually: protectedProcedure
      .input(
         z.object({
            ruleId: z.string(),
            testData: z
               .object({
                  transaction: z
                     .object({
                        amount: z.number(),
                        bankAccountId: z.string().optional(),
                        categoryIds: z.array(z.string()).optional(),
                        costCenterId: z.string().optional(),
                        counterpartyId: z.string().optional(),
                        date: z.string().optional(),
                        description: z.string(),
                        id: z.string().optional(),
                        metadata: z.record(z.string(), z.unknown()).optional(),
                        tagIds: z.array(z.string()).optional(),
                        type: z.enum(["income", "expense", "transfer"]),
                     })
                     .optional(),
               })
               .optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const rule = await findAutomationRuleById(
            resolvedCtx.db,
            input.ruleId,
         );

         if (!rule || rule.organizationId !== organizationId) {
            throw new Error("Automation rule not found");
         }

         if (!rule.isActive) {
            throw new Error("Cannot trigger inactive automation rule");
         }

         if (
            rule.triggerType !== "transaction.created" &&
            rule.triggerType !== "transaction.updated"
         ) {
            throw new Error(
               "Manual trigger is only supported for transaction-based automations",
            );
         }

         const txData = input.testData?.transaction ?? {
            amount: 100,
            description: "Test Transaction",
            type: "expense" as const,
         };

         const event: AutomationEvent = {
            data: {
               amount: txData.amount,
               bankAccountId: txData.bankAccountId ?? null,
               categoryIds: txData.categoryIds ?? [],
               costCenterId: txData.costCenterId ?? null,
               counterpartyId: txData.counterpartyId ?? null,
               date: txData.date ?? new Date().toISOString(),
               description: txData.description,
               id: txData.id ?? crypto.randomUUID(),
               metadata: txData.metadata ?? {},
               organizationId,
               tagIds: txData.tagIds ?? [],
               type: txData.type,
            },
            id: crypto.randomUUID(),
            organizationId,
            timestamp: new Date().toISOString(),
            type: rule.triggerType,
         };

         const job = await emitManualTrigger(event);

         return {
            eventId: event.id,
            jobId: job.id,
            status: "queued",
            triggerType: rule.triggerType,
         };
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateAutomationRuleSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingRule = await findAutomationRuleById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingRule || existingRule.organizationId !== organizationId) {
            throw new Error("Automation rule not found");
         }

         return updateAutomationRule(resolvedCtx.db, input.id, {
            ...input.data,
            actions: input.data.actions as Action[] | undefined,
            conditions: input.data.conditions as ConditionGroup[] | undefined,
            flowData: input.data.flowData as FlowData | undefined | null,
            triggerConfig: input.data.triggerConfig as
               | TriggerConfig
               | undefined,
         });
      }),
});
