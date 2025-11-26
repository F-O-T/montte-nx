import { setTransactionCategories } from "@packages/database/repositories/category-repository";
import {
   createTransaction,
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
import { category } from "@packages/database/schemas/categories";
import { z } from "zod";
import { organizationProcedure, router } from "../trpc";

const createTransactionSchema = z.object({
   amount: z.number(),
   bankAccountId: z.string().optional(),
   categoryIds: z.array(z.string()).min(1, "At least one category is required"),
   date: z.string(),
   description: z.string(),
   type: z.enum(["income", "expense", "transfer"]),
});

const updateTransactionSchema = z.object({
   amount: z.number().optional(),
   bankAccountId: z.string().optional(),
   categoryIds: z
      .array(z.string())
      .min(1, "At least one category is required")
      .optional(),
   date: z.string().optional(),
   description: z.string().optional(),
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
   type: z.enum(["income", "expense", "transfer"]).optional(),
});

export const transactionRouter = router({
   create: organizationProcedure
      .input(createTransactionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId as string;

         const transaction = await createTransaction(resolvedCtx.db, {
            ...input,
            amount: input.amount.toString(),
            date: new Date(input.date),
            id: crypto.randomUUID(),
            organizationId,
         });

         if (input.categoryIds.length > 0) {
            await setTransactionCategories(
               resolvedCtx.db,
               transaction.id,
               input.categoryIds,
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

   delete: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = (resolvedCtx as any).organizationId as string;

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

   getAll: organizationProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = (resolvedCtx as any).organizationId as string;

      return findTransactionsByOrganizationId(resolvedCtx.db, organizationId);
   }),

   getAllPaginated: organizationProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = (resolvedCtx as any).organizationId as string;

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

   getById: organizationProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = (resolvedCtx as any).organizationId as string;

         const transaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         if (!transaction || transaction.organizationId !== organizationId) {
            throw new Error("Transaction not found");
         }

         return transaction;
      }),

   getStats: organizationProcedure
      .input(
         z
            .object({
               bankAccountId: z.string().optional(),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = (resolvedCtx as any).organizationId as string;
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

   transfer: organizationProcedure
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
         const organizationId = (resolvedCtx as any).organizationId as string;

         return resolvedCtx.db.transaction(async (tx) => {
            const transferCategory = await tx.query.category.findFirst({
               where: (cat, { eq, and }) =>
                  and(
                     eq(cat.organizationId, organizationId),
                     eq(cat.name, "Transfer"),
                  ),
            });

            const transferCategoryId =
               transferCategory?.id || crypto.randomUUID();

            if (!transferCategory) {
               await tx.insert(category).values({
                  color: "#6b7280",
                  icon: "ArrowLeftRight",
                  id: transferCategoryId,
                  name: "Transfer",
                  organizationId,
               });
            }

            const fromTransaction = await createTransaction(tx, {
               amount: (-input.amount).toString(),
               bankAccountId: input.fromBankAccountId,
               date: new Date(input.date),
               description: input.description,
               id: crypto.randomUUID(),
               organizationId,
               type: "transfer",
            });

            await setTransactionCategories(tx, fromTransaction.id, [
               transferCategoryId,
            ]);

            const toTransaction = await createTransaction(tx, {
               amount: input.amount.toString(),
               bankAccountId: input.toBankAccountId,
               date: new Date(input.date),
               description: input.description,
               id: crypto.randomUUID(),
               organizationId,
               type: "transfer",
            });

            await setTransactionCategories(tx, toTransaction.id, [
               transferCategoryId,
            ]);

            return [fromTransaction, toTransaction];
         });
      }),

   update: organizationProcedure
      .input(
         z.object({
            data: updateTransactionSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = (resolvedCtx as any).organizationId as string;

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

         const updateData: {
            amount?: string;
            bankAccountId?: string;
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

         const finalTransaction = await findTransactionById(
            resolvedCtx.db,
            input.id,
         );

         return {
            transaction: finalTransaction,
         };
      }),
});
