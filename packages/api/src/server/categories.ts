import {
   createCategory,
   deleteCategory,
   findCategoriesByUserId,
   findCategoryById,
   updateCategory,
} from "@packages/database/repositories/category-repository";
import { z } from "zod";
import { protectedProcedure, router } from "./trpc";

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
