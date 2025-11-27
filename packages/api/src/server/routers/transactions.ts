import { setTransactionCategories } from "@packages/database/repositories/category-repository";
import { setTransactionTags } from "@packages/database/repositories/tag-repository";
import {
   createTransaction,
   createTransfer,
   deleteTransaction,
   findTransactionById,
   findTransactionsByOrganizationId,
   findTransactionsByOrganizationIdPaginated,
   getTotalExpensesByOrganizationId,
   getTotalIncomeByOrganizationId,
   getTotalTransactionsByOrganizationId,
   getTotalTransfersByOrganizationId,
   updateTransaction,
} from "@packages/database/repositories/transaction-repository";
import type { CategorySplit } from "@packages/database/schemas/transactions";
import { validateCategorySplits as validateSplits } from "@packages/utils/split";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const categorySplitSchema = z.object({
   categoryId: z.string().uuid(),
   splitType: z.literal("amount"),
   value: z.number().nonnegative(),
});

const createTransactionSchema = z.object({
   amount: z.number(),
   bankAccountId: z.string().optional(),
   categoryIds: z.array(z.string()).optional(),
   categorySplits: z.array(categorySplitSchema).nullable().optional(),
   costCenterId: z.string().optional(),
   date: z.string(),
   description: z.string(),
   tagIds: z.array(z.string()).optional(),
   type: z.enum(["income", "expense", "transfer"]),
});

const updateTransactionSchema = z.object({
   amount: z.number().optional(),
   bankAccountId: z.string().optional(),
   categoryIds: z.array(z.string()).optional(),
   categorySplits: z.array(categorySplitSchema).nullable().optional(),
   costCenterId: z.string().nullable().optional(),
   date: z.string().optional(),
   description: z.string().optional(),
   tagIds: z.array(z.string()).optional(),
   type: z.enum(["income", "expense", "transfer"]).optional(),
});

const paginationSchema = z.object({
   bankAccountId: z.string().optional(),
   category: z.string().optional(),
   endDate: z.string().optional(),
   limit: z.coerce.number().min(1).max(100).default(5),
   orderBy: z.enum(["date", "amount"]).default("date"),
   orderDirection: z.enum(["asc", "desc"]).default("desc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   startDate: z.string().optional(),
   tagId: z.string().optional(),
   type: z.enum(["income", "expense", "transfer"]).optional(),
});

function validateCategorySplitsForTransaction(
   categorySplits:
      | { categoryId: string; value: number; splitType: "amount" }[]
      | null
      | undefined,
   categoryIds: string[],
   amountInDecimal: number,
): void {
   if (!categorySplits || categorySplits.length === 0) {
      return;
   }

   const amountInCents = Math.round(amountInDecimal * 100);
   const result = validateSplits(categorySplits, categoryIds, amountInCents);

   if (!result.isValid) {
      throw new Error(result.errors.join("; "));
   }
}

export const transactionRouter = router({
   create: protectedProcedure
      .input(createTransactionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         validateCategorySplitsForTransaction(
            input.categorySplits,
            input.categoryIds ?? [],
            input.amount,
         );

         const transaction = await createTransaction(resolvedCtx.db, {
            ...input,
            amount: input.amount.toString(),
            categorySplits: input.categorySplits || null,
            costCenterId: input.costCenterId || undefined,
            date: new Date(input.date),
            id: crypto.randomUUID(),
            organizationId,
         });

         if (input.categoryIds && input.categoryIds.length > 0) {
            await setTransactionCategories(
               resolvedCtx.db,
               transaction.id,
               input.categoryIds,
            );
         }

         if (input.tagIds && input.tagIds.length > 0) {
            await setTransactionTags(
               resolvedCtx.db,
               transaction.id,
               input.tagIds,
            );
         }

         const createdTransaction = await findTransactionById(
            resolvedCtx.db,
            transaction.id,
         );

         return {
            transaction: createdTransaction,
         };
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingTransaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingTransaction ||
            existingTransaction.organizationId !== organizationId
         ) {
            throw new Error("Transaction not found");
         }

         return deleteTransaction(resolvedCtx.db, input.id);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findTransactionsByOrganizationId(resolvedCtx.db, organizationId);
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findTransactionsByOrganizationIdPaginated(
            resolvedCtx.db,
            organizationId,
            {
               ...input,
               endDate: input.endDate ? new Date(input.endDate) : undefined,
               startDate: input.startDate
                  ? new Date(input.startDate)
                  : undefined,
            },
         );
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const transaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (!transaction || transaction.organizationId !== organizationId) {
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
         const organizationId = resolvedCtx.organizationId;
         const bankAccountId = input?.bankAccountId;

         const [totalTransactions, totalIncome, totalExpenses, totalTransfers] =
            await Promise.all([
               getTotalTransactionsByOrganizationId(
                  resolvedCtx.db,
                  organizationId,
                  bankAccountId,
               ),
               getTotalIncomeByOrganizationId(
                  resolvedCtx.db,
                  organizationId,
                  bankAccountId,
               ),
               getTotalExpensesByOrganizationId(
                  resolvedCtx.db,
                  organizationId,
                  bankAccountId,
               ),
               getTotalTransfersByOrganizationId(
                  resolvedCtx.db,
                  organizationId,
                  bankAccountId,
               ),
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
         const organizationId = resolvedCtx.organizationId;

         return createTransfer(resolvedCtx.db, {
            amount: input.amount,
            date: new Date(input.date),
            description: input.description,
            fromBankAccountId: input.fromBankAccountId,
            organizationId,
            toBankAccountId: input.toBankAccountId,
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
         const organizationId = resolvedCtx.organizationId;

         const existingTransaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingTransaction ||
            existingTransaction.organizationId !== organizationId
         ) {
            throw new Error("Transaction not found");
         }

         if (input.data.categorySplits !== undefined) {
            const categoryIds =
               input.data.categoryIds ??
               existingTransaction.transactionCategories?.map(
                  (tc) => tc.category.id,
               ) ??
               [];
            const amount =
               input.data.amount ?? Number(existingTransaction.amount);
            validateCategorySplitsForTransaction(
               input.data.categorySplits,
               categoryIds,
               amount,
            );
         }

         const updateData: {
            amount?: string;
            bankAccountId?: string;
            categorySplits?: CategorySplit[] | null;
            costCenterId?: string | null;
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

         if (input.data.categorySplits !== undefined) {
            updateData.categorySplits = input.data.categorySplits;
         }

         if (input.data.costCenterId !== undefined) {
            updateData.costCenterId = input.data.costCenterId;
         }

         if (input.data.description !== undefined) {
            updateData.description = input.data.description;
         }

         if (input.data.type !== undefined) {
            updateData.type = input.data.type;
         }

         const updatedTransaction = await updateTransaction(
            resolvedCtx.db,
            input.id,
            updateData,
         );

         if (input.data.categoryIds !== undefined) {
            await setTransactionCategories(
               resolvedCtx.db,
               input.id,
               input.data.categoryIds,
            );
         }

         if (input.data.tagIds !== undefined) {
            await setTransactionTags(
               resolvedCtx.db,
               input.id,
               input.data.tagIds,
            );
         }

         return {
            transaction: updatedTransaction,
         };
      }),
});
