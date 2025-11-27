import {
   createBudget,
   deleteBudget,
   findBudgetById,
   findBudgetsByOrganizationIdPaginated,
   getBudgetStats,
   getBudgetWithProgress,
   getBudgetsWithProgress,
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
         percentage: z.number(),
         notified: z.boolean(),
         notifiedAt: z.date().optional(),
      }),
   ),
});

const shadowBudgetSchema = z.object({
   enabled: z.boolean(),
   visibleLimit: z.number(),
   internalLimit: z.number(),
});

const createBudgetSchema = z.object({
   name: z.string().min(1),
   description: z.string().optional(),
   color: z.string().optional(),
   icon: z.string().optional(),
   amount: z.string(),
   target: budgetTargetSchema,
   periodType: z
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"])
      .default("monthly"),
   periodStartDay: z.string().optional(),
   customPeriodStart: z.date().optional(),
   customPeriodEnd: z.date().optional(),
   rollover: z.boolean().default(false),
   rolloverCap: z.string().optional(),
   regime: z.enum(["cash", "accrual"]).default("cash"),
   mode: z.enum(["personal", "business"]).default("personal"),
   alertConfig: alertConfigSchema.optional(),
   shadowBudget: shadowBudgetSchema.optional(),
   blockOnExceed: z.boolean().default(false),
   isActive: z.boolean().default(true),
   startDate: z.date().optional(),
   endDate: z.date().optional(),
});

const updateBudgetSchema = z.object({
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   color: z.string().optional(),
   icon: z.string().optional(),
   amount: z.string().optional(),
   target: budgetTargetSchema.optional(),
   periodType: z
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"])
      .optional(),
   periodStartDay: z.string().optional(),
   customPeriodStart: z.date().optional(),
   customPeriodEnd: z.date().optional(),
   rollover: z.boolean().optional(),
   rolloverCap: z.string().optional(),
   regime: z.enum(["cash", "accrual"]).optional(),
   mode: z.enum(["personal", "business"]).optional(),
   alertConfig: alertConfigSchema.optional(),
   shadowBudget: shadowBudgetSchema.optional(),
   blockOnExceed: z.boolean().optional(),
   isActive: z.boolean().optional(),
   startDate: z.date().optional(),
   endDate: z.date().optional(),
});

const paginationSchema = z.object({
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z
      .enum(["name", "createdAt", "updatedAt", "amount"])
      .default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   mode: z.enum(["personal", "business"]).optional(),
   isActive: z.boolean().optional(),
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
               limit: input.limit,
               orderBy: input.orderBy,
               orderDirection: input.orderDirection,
               page: input.page,
               search: input.search,
               mode: input.mode,
               isActive: input.isActive,
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
