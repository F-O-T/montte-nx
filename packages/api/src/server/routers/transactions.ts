import {
   createTransaction,
   deleteTransaction,
   findTransactionById,
   findTransactionsByUserId,
   updateTransaction,
   getTotalTransactionsByUserId,
   getTotalIncomeByUserId,
   getTotalExpensesByUserId,
} from "@packages/database/repositories/transaction-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

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
            amount: input.amount.toString(),
            date: new Date(input.date),
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

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findTransactionsByUserId(resolvedCtx.db, userId);
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

   update: protectedProcedure
      .input(
         z.object({
            data: updateTransactionSchema,
            id: z.string(),
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

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      const [totalTransactions, totalIncome, totalExpenses] = await Promise.all([
         getTotalTransactionsByUserId(resolvedCtx.db, userId),
         getTotalIncomeByUserId(resolvedCtx.db, userId),
         getTotalExpensesByUserId(resolvedCtx.db, userId),
      ]);

      return {
         totalTransactions,
         totalIncome: totalIncome || 0,
         totalExpenses: totalExpenses || 0,
      };
   }),
});
