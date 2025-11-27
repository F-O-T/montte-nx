import {
   createBankAccount,
   createDefaultBusinessBankAccount,
   createDefaultWalletBankAccount,
   deleteBankAccount,
   findBankAccountById,
   findBankAccountsByOrganizationId,
   findBankAccountsByOrganizationIdPaginated,
   getBankAccountStats,
   updateBankAccount,
} from "@packages/database/repositories/bank-account-repository";
import {
   createTransaction,
   findTransactionsByBankAccountIdPaginated,
} from "@packages/database/repositories/transaction-repository";
import { parseOfxContent } from "@packages/ofx";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createBankAccountSchema = z.object({
   bank: z.string().min(1, "Bank is required"),
   name: z.string().min(1, "Name is required"),
   type: z.enum(["checking", "savings", "investment"]),
});

const updateBankAccountSchema = z.object({
   bank: z.string().min(1, "Bank is required").optional(),
   name: z.string().min(1, "Name is required").optional(),
   type: z.enum(["checking", "savings", "investment"]).optional(),
});

const paginationSchema = z.object({
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z.enum(["name", "bank", "createdAt", "updatedAt"]).default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
});

export const bankAccountRouter = router({
   create: protectedProcedure
      .input(createBankAccountSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createBankAccount(resolvedCtx.db, {
            ...input,
            id: crypto.randomUUID(),
            organizationId,
         });
      }),

   createDefaultBusiness: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;
      return createDefaultBusinessBankAccount(resolvedCtx.db, userId);
   }),

   createDefaultPersonal: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;
      return createDefaultWalletBankAccount(resolvedCtx.db, userId);
   }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingBankAccount ||
            existingBankAccount.organizationId !== organizationId
         ) {
            throw new Error("Bank account not found");
         }

         return deleteBankAccount(resolvedCtx.db, input.id);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findBankAccountsByOrganizationId(resolvedCtx.db, organizationId);
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findBankAccountsByOrganizationIdPaginated(
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

         const bankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (!bankAccount || bankAccount.organizationId !== organizationId) {
            throw new Error("Bank account not found");
         }

         return bankAccount;
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getBankAccountStats(resolvedCtx.db, organizationId);
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
         const organizationId = resolvedCtx.organizationId;

         const bankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (!bankAccount || bankAccount.organizationId !== organizationId) {
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
         const organizationId = resolvedCtx.organizationId;
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
                  date: trn.date,
                  description: trn.description,
                  externalId: trn.fitid,
                  id: crypto.randomUUID(),
                  organizationId,
                  type: trn.type,
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
         const organizationId = resolvedCtx.organizationId;

         const existingBankAccount = await findBankAccountById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingBankAccount ||
            existingBankAccount.organizationId !== organizationId
         ) {
            throw new Error("Bank account not found");
         }

         const updateData: {
            type?: "checking" | "savings" | "investment";
            bank?: string;
            name?: string;
            status?: "active" | "inactive";
         } = {};
         if (input.data.bank) updateData.bank = input.data.bank;
         if (input.data.name) updateData.name = input.data.name;
         if (input.data.status) updateData.status = input.data.status;
         if (input.data.type) {
            updateData.type = input.data.type as
               | "checking"
               | "savings"
               | "investment";
         }
         return updateBankAccount(resolvedCtx.db, input.id, updateData);
      }),
});
