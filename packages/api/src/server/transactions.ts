import { z } from "zod";
import {
   createTransaction,
   deleteTransaction,
   findTransactionById,
   findTransactionsByUserId,
   updateTransaction,
} from "@packages/database/repositories/transaction-repository";
import { protectedProcedure, router } from "./trpc";

const createTransactionSchema = z.object({
   amount: z.number(),
   category: z.string(),
   date: z.string(),
   description: z.string(),
   type: z.enum(["income", "expense"]),
});

const updateTransactionSchema = z.object({
   amount: z.number().optional(),
   category: z.string().optional(),
   date: z.string().optional(),
   description: z.string().optional(),
   type: z.enum(["income", "expense"]).optional(),
});

export const transactionRouter = router({
   create: protectedProcedure
      .input(createTransactionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return createTransaction(resolvedCtx.db, {
            ...input,
            id: crypto.randomUUID(),
            amount: input.amount.toString(),
            date: new Date(input.date),
            userId,
         });
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const transaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (!transaction || transaction.userId !== userId) {
            throw new Error("Transaction not found");
         }

         return transaction;
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findTransactionsByUserId(resolvedCtx.db, userId);
   }),

   update: protectedProcedure
      .input(
         z.object({
            id: z.string(),
            data: updateTransactionSchema,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         // First check if transaction exists and belongs to user
         const existingTransaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingTransaction || existingTransaction.userId !== userId) {
            throw new Error("Transaction not found");
         }

         const updateData: any = {
            ...input.data,
         };

         if (input.data.amount !== undefined) {
            updateData.amount = input.data.amount.toString();
         }

         if (input.data.date !== undefined) {
            updateData.date = new Date(input.data.date);
         }

         return updateTransaction(resolvedCtx.db, input.id, updateData);
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         // First check if transaction exists and belongs to user
         const existingTransaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingTransaction || existingTransaction.userId !== userId) {
            throw new Error("Transaction not found");
         }

         return deleteTransaction(resolvedCtx.db, input.id);
      }),
});
