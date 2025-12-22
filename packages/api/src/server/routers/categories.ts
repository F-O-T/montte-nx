import {
   createCategory,
   deleteCategory,
   deleteManyCategories,
   findCategoriesByOrganizationId,
   findCategoriesByOrganizationIdPaginated,
   findCategoriesByTransactionType,
   findCategoryById,
   getCategoryBreakdown,
   getCategoryMonthlyTrend,
   getCategoryTypeDistribution,
   getCategoryUsageFrequency,
   getCategoryWithMostTransactions,
   getTopCategories,
   getTotalCategoriesByOrganizationId,
   updateCategory,
} from "@packages/database/repositories/category-repository";
import { APIError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const transactionTypeSchema = z.enum(["income", "expense", "transfer"]);

const createCategorySchema = z.object({
   color: z.string(),
   icon: z.string().optional(),
   name: z.string(),
   transactionTypes: z
      .array(transactionTypeSchema)
      .min(1)
      .optional()
      .default(["income", "expense", "transfer"]),
});

const updateCategorySchema = z.object({
   color: z.string().optional(),
   icon: z.string().optional(),
   name: z.string().optional(),
   transactionTypes: z.array(transactionTypeSchema).min(1).optional(),
});

const paginationSchema = z.object({
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
});

export const categoryRouter = router({
   create: protectedProcedure
      .input(createCategorySchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createCategory(resolvedCtx.db, {
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

         const existingCategory = await findCategoryById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingCategory ||
            existingCategory.organizationId !== organizationId
         ) {
            throw APIError.notFound("Category not found");
         }

         return deleteCategory(resolvedCtx.db, input.id);
      }),

   deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return deleteManyCategories(resolvedCtx.db, input.ids, organizationId);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findCategoriesByOrganizationId(resolvedCtx.db, organizationId);
   }),

   getByTransactionType: protectedProcedure
      .input(z.object({ type: transactionTypeSchema }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findCategoriesByTransactionType(
            resolvedCtx.db,
            organizationId,
            input.type,
         );
      }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findCategoriesByOrganizationIdPaginated(
            resolvedCtx.db,
            organizationId,
            {
               limit: input.limit,
               orderBy: input.orderBy,
               orderDirection: input.orderDirection,
               page: input.page,
               search: input.search,
            },
         );
      }),

   getBreakdown: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getCategoryBreakdown(resolvedCtx.db, organizationId);
   }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const category = await findCategoryById(resolvedCtx.db, input.id);

         if (!category || category.organizationId !== organizationId) {
            throw APIError.notFound("Category not found");
         }

         return category;
      }),

   getMonthlyTrend: protectedProcedure
      .input(
         z.object({ months: z.number().min(1).max(12).default(6) }).optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return getCategoryMonthlyTrend(
            resolvedCtx.db,
            organizationId,
            input?.months ?? 6,
         );
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      const [totalCategories, categoryWithMostTransactions] = await Promise.all(
         [
            getTotalCategoriesByOrganizationId(resolvedCtx.db, organizationId),
            getCategoryWithMostTransactions(resolvedCtx.db, organizationId),
         ],
      );

      return {
         categoryWithMostTransactions:
            categoryWithMostTransactions?.categoryName || null,
         totalCategories,
      };
   }),

   getTopCategories: protectedProcedure
      .input(
         z
            .object({
               limit: z.number().min(1).max(10).default(5),
               type: z.enum(["income", "expense", "all"]).default("all"),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return getTopCategories(
            resolvedCtx.db,
            organizationId,
            input?.type ?? "all",
            input?.limit ?? 5,
         );
      }),

   getTypeDistribution: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getCategoryTypeDistribution(resolvedCtx.db, organizationId);
   }),

   getUsageFrequency: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getCategoryUsageFrequency(resolvedCtx.db, organizationId);
   }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateCategorySchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingCategory = await findCategoryById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingCategory ||
            existingCategory.organizationId !== organizationId
         ) {
            throw APIError.notFound("Category not found");
         }

         return updateCategory(resolvedCtx.db, input.id, input.data);
      }),
});
