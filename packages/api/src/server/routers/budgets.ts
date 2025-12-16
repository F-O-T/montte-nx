import { APIError } from "@packages/utils/errors";
import {
   calculatePeriodDates,
   checkBudgetImpact,
   createBudget,
   deleteBudget,
   deleteBudgets,
   duplicateBudget,
   findBudgetById,
   findBudgetPeriods,
   findBudgetsByOrganizationIdPaginated,
   findBudgetsByTarget,
   findTransactionsByBudgetTarget,
   getBudgetStats,
   getBudgetsWithProgress,
   getBudgetWithProgress,
   processRollover,
   updateBudget,
   updateBudgets,
} from "@packages/database/repositories/budget-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const budgetTargetSchema = z.discriminatedUnion("type", [
   z.object({
      categoryId: z.string().uuid(),
      type: z.literal("category"),
   }),
   z.object({
      categoryIds: z.array(z.string().uuid()).min(1),
      type: z.literal("categories"),
   }),
   z.object({
      tagId: z.string().uuid(),
      type: z.literal("tag"),
   }),
   z.object({
      costCenterId: z.string().uuid(),
      type: z.literal("cost_center"),
   }),
]);

const alertConfigSchema = z.object({
   enabled: z.boolean(),
   thresholds: z.array(
      z.object({
         notified: z.boolean(),
         notifiedAt: z.date().optional(),
         percentage: z.number(),
      }),
   ),
});

const shadowBudgetSchema = z.object({
   enabled: z.boolean(),
   internalLimit: z.number(),
   visibleLimit: z.number(),
});

const createBudgetSchema = z.object({
   alertConfig: alertConfigSchema.optional(),
   amount: z.string(),
   blockOnExceed: z.boolean().default(false),
   color: z.string().optional(),
   customPeriodEnd: z.date().optional(),
   customPeriodStart: z.date().optional(),
   description: z.string().optional(),
   endDate: z.date().optional(),
   icon: z.string().optional(),
   isActive: z.boolean().default(true),
   mode: z.enum(["personal", "business"]).default("personal"),
   name: z.string().min(1),
   periodStartDay: z.string().optional(),
   periodType: z
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"])
      .default("monthly"),
   regime: z.enum(["cash", "accrual"]).default("cash"),
   rollover: z.boolean().default(false),
   rolloverCap: z.string().optional(),
   shadowBudget: shadowBudgetSchema.optional(),
   startDate: z.date().optional(),
   target: budgetTargetSchema,
});

const updateBudgetSchema = z.object({
   alertConfig: alertConfigSchema.optional(),
   amount: z.string().optional(),
   blockOnExceed: z.boolean().optional(),
   color: z.string().optional(),
   customPeriodEnd: z.date().optional(),
   customPeriodStart: z.date().optional(),
   description: z.string().optional(),
   endDate: z.date().optional(),
   icon: z.string().optional(),
   isActive: z.boolean().optional(),
   mode: z.enum(["personal", "business"]).optional(),
   name: z.string().min(1).optional(),
   periodStartDay: z.string().optional(),
   periodType: z
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"])
      .optional(),
   regime: z.enum(["cash", "accrual"]).optional(),
   rollover: z.boolean().optional(),
   rolloverCap: z.string().optional(),
   shadowBudget: shadowBudgetSchema.optional(),
   startDate: z.date().optional(),
   target: budgetTargetSchema.optional(),
});

const paginationSchema = z.object({
   isActive: z.boolean().optional(),
   limit: z.coerce.number().min(1).max(100).default(10),
   mode: z.enum(["personal", "business"]).optional(),
   orderBy: z
      .enum(["name", "createdAt", "updatedAt", "amount"])
      .default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   periodType: z
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"])
      .optional(),
   search: z.string().optional(),
});

export const budgetRouter = router({
   bulkActivate: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return updateBudgets(
            resolvedCtx.db,
            input.ids,
            { isActive: true },
            organizationId,
         );
      }),

   bulkDeactivate: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return updateBudgets(
            resolvedCtx.db,
            input.ids,
            { isActive: false },
            organizationId,
         );
      }),

   bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return deleteBudgets(resolvedCtx.db, input.ids, organizationId);
      }),

   checkBudgetImpact: protectedProcedure
      .input(
         z.object({
            amount: z.number(),
            categoryId: z.string().optional(),
            categoryIds: z.array(z.string()).optional(),
            costCenterId: z.string().optional(),
            excludeTransactionId: z.string().optional(),
            tagIds: z.array(z.string()).optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return checkBudgetImpact(resolvedCtx.db, organizationId, {
            amount: input.amount,
            categoryId: input.categoryId,
            categoryIds: input.categoryIds,
            costCenterId: input.costCenterId,
            excludeTransactionId: input.excludeTransactionId,
            tagIds: input.tagIds,
         });
      }),

   create: protectedProcedure
      .input(createBudgetSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createBudget(resolvedCtx.db, {
            ...input,
            id: crypto.randomUUID(),
            organizationId,
         });
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBudget = await findBudgetById(resolvedCtx.db, input.id);

         if (
            !existingBudget ||
            existingBudget.organizationId !== organizationId
         ) {
            throw APIError.notFound("Budget not found");
         }

         return deleteBudget(resolvedCtx.db, input.id);
      }),

   duplicate: protectedProcedure
      .input(
         z.object({
            id: z.string(),
            name: z.string().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return duplicateBudget(
            resolvedCtx.db,
            input.id,
            organizationId,
            input.name,
         );
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getBudgetsWithProgress(resolvedCtx.db, organizationId);
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findBudgetsByOrganizationIdPaginated(
            resolvedCtx.db,
            organizationId,
            {
               isActive: input.isActive,
               limit: input.limit,
               mode: input.mode,
               orderBy: input.orderBy,
               orderDirection: input.orderDirection,
               page: input.page,
               periodType: input.periodType,
               search: input.search,
            },
         );
      }),

   getBudgetsByTarget: protectedProcedure
      .input(
         z.object({
            categoryId: z.string().optional(),
            categoryIds: z.array(z.string()).optional(),
            costCenterId: z.string().optional(),
            tagIds: z.array(z.string()).optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findBudgetsByTarget(resolvedCtx.db, organizationId, {
            categoryId: input.categoryId,
            categoryIds: input.categoryIds,
            costCenterId: input.costCenterId,
            tagIds: input.tagIds,
         });
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const budget = await getBudgetWithProgress(resolvedCtx.db, input.id);

         if (!budget || budget.organizationId !== organizationId) {
            throw APIError.notFound("Budget not found");
         }

         return budget;
      }),

   getPeriodHistory: protectedProcedure
      .input(
         z.object({
            budgetId: z.string(),
            limit: z.number().default(12),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const budget = await findBudgetById(resolvedCtx.db, input.budgetId);

         if (!budget || budget.organizationId !== organizationId) {
            throw APIError.notFound("Budget not found");
         }

         return findBudgetPeriods(resolvedCtx.db, input.budgetId, {
            limit: input.limit,
         });
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getBudgetStats(resolvedCtx.db, organizationId);
   }),

   getTransactions: protectedProcedure
      .input(
         z.object({
            budgetId: z.string(),
            limit: z.number().default(10),
            page: z.number().default(1),
            periodEnd: z.date().optional(),
            periodStart: z.date().optional(),
            search: z.string().optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const budget = await findBudgetById(resolvedCtx.db, input.budgetId);

         if (!budget || budget.organizationId !== organizationId) {
            throw APIError.notFound("Budget not found");
         }

         const { periodStart, periodEnd } =
            input.periodStart && input.periodEnd
               ? { periodEnd: input.periodEnd, periodStart: input.periodStart }
               : calculatePeriodDates(budget);

         return findTransactionsByBudgetTarget(resolvedCtx.db, budget, {
            limit: input.limit,
            page: input.page,
            periodEnd,
            periodStart,
            search: input.search,
         });
      }),

   processRollover: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const budget = await findBudgetById(resolvedCtx.db, input.id);

         if (!budget || budget.organizationId !== organizationId) {
            throw APIError.notFound("Budget not found");
         }

         return processRollover(resolvedCtx.db, input.id);
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateBudgetSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBudget = await findBudgetById(resolvedCtx.db, input.id);

         if (
            !existingBudget ||
            existingBudget.organizationId !== organizationId
         ) {
            throw APIError.notFound("Budget not found");
         }

         return updateBudget(resolvedCtx.db, input.id, input.data);
      }),
});
