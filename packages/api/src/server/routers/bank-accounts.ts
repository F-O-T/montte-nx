import {
   createBankAccount,
   deleteBankAccount,
   findBankAccountById,
   findBankAccountsByUserId,
   updateBankAccount,
} from "@packages/database/repositories/bank-account-repository";
import {
   createTransaction,
   findTransactionsByBankAccountIdPaginated,
} from "@packages/database/repositories/transaction-repository";
import { z } from "zod";
import { parseOfxContent } from "../services/ofx-parser";
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

   getTransactions: protectedProcedure
      .input(
         z.object({
            id: z.string(),
            limit: z.number().min(1).max(100).default(10),
            page: z.number().min(1).default(1),
         }),
      )
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

         return findTransactionsByBankAccountIdPaginated(
            resolvedCtx.db,
            input.id,
            {
               limit: input.limit,
               page: input.page,
            },
         );
      }),

   parseOfx: protectedProcedure
      .input(z.object({ bankAccountId: z.string(), content: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;
         const transactions = await parseOfxContent(input.content);

         const createdTransactions = [];

         for (const trn of transactions) {
            const existingTransaction =
               await resolvedCtx.db.query.transaction.findFirst({
                  where: (transaction, { eq, and }) =>
                     and(
                        eq(transaction.bankAccountId, input.bankAccountId),
                        eq(transaction.externalId, trn.fitid),
                     ),
               });

            if (!existingTransaction) {
               const newTransaction = await createTransaction(resolvedCtx.db, {
                  amount: trn.amount.toString(),
                  bankAccountId: input.bankAccountId,
                  category: ["Uncategorized"],
                  date: trn.date,
                  description: trn.description,
                  externalId: trn.fitid,
                  id: crypto.randomUUID(),
                  type: trn.type,
                  userId,
               });
               createdTransactions.push(newTransaction);
            }
         }

         return createdTransactions;
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
