import {
   createCategory,
   deleteCategory,
   findCategoriesByOrganizationId,
   findCategoriesByOrganizationIdPaginated,
   findCategoryById,
   getCategoryWithMostTransactions,
   getTotalCategoriesByOrganizationId,
   updateCategory,
} from "@packages/database/repositories/category-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createCategorySchema = z.object({
   color: z.string(),
   icon: z.string().optional(),
   name: z.string(),
});

const updateCategorySchema = z.object({
   color: z.string().optional(),
   icon: z.string().optional(),
   name: z.string().optional(),
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
            throw new Error("Category not found");
         }

         return deleteCategory(resolvedCtx.db, input.id);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findCategoriesByOrganizationId(resolvedCtx.db, organizationId);
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

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const category = await findCategoryById(resolvedCtx.db, input.id);

         if (!category || category.organizationId !== organizationId) {
            throw new Error("Category not found");
         }

         return category;
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
            throw new Error("Category not found");
         }

         return updateCategory(resolvedCtx.db, input.id, input.data);
      }),
});
