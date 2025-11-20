import {
   createTransaction,
   deleteTransaction,
   findTransactionById,
   findTransactionsByUserId,
   findTransactionsByUserIdPaginated,
   getTotalExpensesByUserId,
   getTotalIncomeByUserId,
   getTotalTransactionsByUserId,
   getTotalTransfersByUserId,
   updateTransaction,
} from "@packages/database/repositories/transaction-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createTransactionSchema = z.object({
   amount: z.number(),
   bankAccountId: z.string().optional(),
   category: z.array(z.string()),
   date: z.string(),
   description: z.string(),
   type: z.enum(["income", "expense", "transfer"]),
});

const updateTransactionSchema = z.object({
   amount: z.number().optional(),
   bankAccountId: z.string().optional(),
   category: z.array(z.string()).optional(),
   date: z.string().optional(),
   description: z.string().optional(),
   type: z.enum(["income", "expense", "transfer"]).optional(),
});

const paginationSchema = z.object({
   bankAccountId: z.string().optional(),
   category: z.string().optional(),
   limit: z.coerce.number().min(1).max(100).default(5),
   orderBy: z.enum(["date", "amount"]).default("date"),
   orderDirection: z.enum(["asc", "desc"]).default("desc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   type: z.enum(["income", "expense", "transfer"]).optional(),
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

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return findTransactionsByUserIdPaginated(
            resolvedCtx.db,
            userId,
            input,
         );
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

   getStats: protectedProcedure
      .input(
         z
            .object({
               bankAccountId: z.string().optional(),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;
         const bankAccountId = input?.bankAccountId;

         const [totalTransactions, totalIncome, totalExpenses, totalTransfers] =
            await Promise.all([
               getTotalTransactionsByUserId(
                  resolvedCtx.db,
                  userId,
                  bankAccountId,
               ),
               getTotalIncomeByUserId(resolvedCtx.db, userId, bankAccountId),
               getTotalExpensesByUserId(resolvedCtx.db, userId, bankAccountId),
               getTotalTransfersByUserId(resolvedCtx.db, userId, bankAccountId),
            ]);

         return {
            totalExpenses: totalExpenses || 0,
            totalIncome: totalIncome || 0,
            totalTransactions,
            totalTransfers: totalTransfers || 0,
         };
      }),

   transfer: protectedProcedure
      .input(
         z.object({
            amount: z.number().positive(),
            date: z.string(),
            description: z.string(),
            fromBankAccountId: z.string(),
            toBankAccountId: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return resolvedCtx.db.transaction(async (tx) => {
            const fromTransaction = await createTransaction(tx, {
               amount: (-input.amount).toString(),
               bankAccountId: input.fromBankAccountId,
               category: ["Transfer"],
               date: new Date(input.date),
               description: input.description,
               id: crypto.randomUUID(),
               type: "transfer",
               userId,
            });

            const toTransaction = await createTransaction(tx, {
               amount: input.amount.toString(),
               bankAccountId: input.toBankAccountId,
               category: ["Transfer"],
               date: new Date(input.date),
               description: input.description,
               id: crypto.randomUUID(),
               type: "transfer",
               userId,
            });

            return [fromTransaction, toTransaction];
         });
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

         const existingTransaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (!existingTransaction || existingTransaction.userId !== userId) {
            throw new Error("Transaction not found");
         }

         const updateData: {
            amount?: string;
            bankAccountId?: string;
            category?: string[];
            date?: Date;
            description?: string;
            type?: "income" | "expense" | "transfer";
         } = {};

         if (input.data.amount !== undefined) {
            updateData.amount = input.data.amount.toString();
         }

         if (input.data.date !== undefined) {
            updateData.date = new Date(input.data.date);
         }

         if (input.data.bankAccountId !== undefined) {
            updateData.bankAccountId = input.data.bankAccountId;
         }

         if (input.data.category !== undefined) {
            updateData.category = input.data.category;
         }

         if (input.data.description !== undefined) {
            updateData.description = input.data.description;
         }

         if (input.data.type !== undefined) {
            updateData.type = input.data.type;
         }

         return updateTransaction(resolvedCtx.db, input.id, updateData);
      }),
});
