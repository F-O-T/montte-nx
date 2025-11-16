import {
   createBankAccount,
   deleteBankAccount,
   findBankAccountById,
   findBankAccountsByUserId,
   updateBankAccount,
} from "@packages/database/repositories/bank-account-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createBankAccountSchema = z.object({
   bank: z.string().min(1, "Bank is required"),
   name: z.string().min(1, "Name is required"),
   status: z.enum(["active", "inactive"]).optional(),
   type: z.string().min(1, "Type is required"),
});

const updateBankAccountSchema = z.object({
   bank: z.string().min(1, "Bank is required").optional(),
   name: z.string().min(1, "Name is required").optional(),
   status: z.enum(["active", "inactive"]).optional(),
   type: z.string().min(1, "Type is required").optional(),
});

export const bankAccountRouter = router({
   create: protectedProcedure
      .input(createBankAccountSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return createBankAccount(resolvedCtx.db, {
            ...input,
            id: crypto.randomUUID(),
            status: input.status || "active",
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

         const existingBankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingBankAccount || existingBankAccount.userId !== userId) {
            throw new Error("Bank account not found");
         }

         return deleteBankAccount(resolvedCtx.db, input.id);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findBankAccountsByUserId(resolvedCtx.db, userId);
   }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const bankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (!bankAccount || bankAccount.userId !== userId) {
            throw new Error("Bank account not found");
         }

         return bankAccount;
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateBankAccountSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const existingBankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingBankAccount || existingBankAccount.userId !== userId) {
            throw new Error("Bank account not found");
         }

         return updateBankAccount(resolvedCtx.db, input.id, input.data);
      }),
});
