import {
   createBudget,
   deleteBudget,
   findBudgetById,
   findBudgetsByOrganizationIdPaginated,
   getBudgetStats,
   getBudgetsWithProgress,
   getBudgetWithProgress,
   processRollover,
   updateBudget,
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
   search: z.string().optional(),
});

export const budgetRouter = router({
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
            throw new Error("Budget not found");
         }

         return deleteBudget(resolvedCtx.db, input.id);
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
               search: input.search,
            },
         );
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const budget = await getBudgetWithProgress(resolvedCtx.db, input.id);

         if (!budget || budget.organizationId !== organizationId) {
            throw new Error("Budget not found");
         }

         return budget;
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getBudgetStats(resolvedCtx.db, organizationId);
   }),

   processRollover: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const budget = await findBudgetById(resolvedCtx.db, input.id);

         if (!budget || budget.organizationId !== organizationId) {
            throw new Error("Budget not found");
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
            throw new Error("Budget not found");
         }

         return updateBudget(resolvedCtx.db, input.id, input.data);
      }),
});
