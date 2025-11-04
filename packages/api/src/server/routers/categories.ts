import {
   createCategory,
   deleteCategory,
   findCategoriesByUserId,
   findCategoriesByUserIdPaginated,
   findCategoryById,
   updateCategory,
} from "@packages/database/repositories/category-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createCategorySchema = z.object({
   color: z.string(),
   icon: z.string(),
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
});

export const categoryRouter = router({
   create: protectedProcedure
      .input(createCategorySchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return createCategory(resolvedCtx.db, {
            ...input,
            id: crypto.randomUUID(),
            userId,
         });
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         // First check if category exists and belongs to user
         const existingCategory = await findCategoryById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingCategory || existingCategory.userId !== userId) {
            throw new Error("Category not found");
         }

         return deleteCategory(resolvedCtx.db, input.id);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findCategoriesByUserId(resolvedCtx.db, userId);
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return findCategoriesByUserIdPaginated(resolvedCtx.db, userId, input);
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const category = await findCategoryById(resolvedCtx.db, input.id);

         if (!category || category.userId !== userId) {
            throw new Error("Category not found");
         }

         return category;
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
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         // First check if category exists and belongs to user
         const existingCategory = await findCategoryById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingCategory || existingCategory.userId !== userId) {
            throw new Error("Category not found");
         }

         return updateCategory(resolvedCtx.db, input.id, input.data);
      }),
});
