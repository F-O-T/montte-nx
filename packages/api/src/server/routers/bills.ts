import {
   createBill,
   deleteBill,
   findBillById,
   findBillsByUserId,
   findBillsByUserIdAndType,
   findCompletedBillsByUserId,
   findOverdueBillsByUserId,
   findPendingBillsByUserId,
   getTotalBillsByUserId,
   getTotalOverdueBillsByUserId,
   getTotalOverduePayablesByUserId,
   getTotalOverdueReceivablesByUserId,
   getTotalPendingPayablesByUserId,
   getTotalPendingReceivablesByUserId,
   type NewBill,
   updateBill,
} from "@packages/database/repositories/bill-repository";
import { createTransaction } from "@packages/database/repositories/transaction-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createBillSchema = z.object({
   amount: z.number(),
   bankAccountId: z.string().optional(),
   category: z.string(),
   counterparty: z.string().optional(),
   description: z.string(),
   dueDate: z.string(),
   issueDate: z.string(),
   notes: z.string().optional(),
   type: z.enum(["income", "expense"]),
});

const updateBillSchema = z.object({
   amount: z.number().optional(),
   bankAccountId: z.string().optional(),
   category: z.string().optional(),
   counterparty: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.string().optional(),
   issueDate: z.string().optional(),
   notes: z.string().optional(),
   type: z.enum(["income", "expense"]).optional(),
});

const completeBillSchema = z.object({
   bankAccountId: z.string().optional(),
   completionDate: z.string(),
});

export const billRouter = router({
   complete: protectedProcedure
      .input(
         z.object({
            data: completeBillSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== userId) {
            throw new Error("Bill not found");
         }

         if (existingBill.completionDate) {
            throw new Error("Bill already completed");
         }

         const transaction = await createTransaction(resolvedCtx.db, {
            amount: existingBill.amount,
            bankAccountId:
               input.data.bankAccountId ||
               existingBill.bankAccountId ||
               undefined,
            category: existingBill.category,
            date: new Date(input.data.completionDate),
            description: existingBill.description,
            id: crypto.randomUUID(),
            type: existingBill.type as "income" | "expense",
            userId,
         });

         const updatedBill = await updateBill(resolvedCtx.db, input.id, {
            completionDate: new Date(input.data.completionDate),
            transactionId: transaction.id,
         });

         return updatedBill;
      }),
   create: protectedProcedure
      .input(createBillSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return createBill(resolvedCtx.db, {
            ...input,
            amount: input.amount.toString(),
            dueDate: new Date(input.dueDate),
            id: crypto.randomUUID(),
            issueDate: new Date(input.issueDate),
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

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== userId) {
            throw new Error("Bill not found");
         }

         if (existingBill.completionDate && existingBill.transactionId) {
            throw new Error(
               "Cannot delete completed bill. Delete the associated transaction first.",
            );
         }

         return deleteBill(resolvedCtx.db, input.id);
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findBillsByUserId(resolvedCtx.db, userId);
   }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const billData = await findBillById(resolvedCtx.db, input.id);

         if (!billData || billData.userId !== userId) {
            throw new Error("Bill not found");
         }

         return billData;
      }),

   getByType: protectedProcedure
      .input(z.object({ type: z.enum(["income", "expense"]) }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return findBillsByUserIdAndType(resolvedCtx.db, userId, input.type);
      }),

   getCompleted: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findCompletedBillsByUserId(resolvedCtx.db, userId);
   }),

   getOverdue: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findOverdueBillsByUserId(resolvedCtx.db, userId);
   }),

   getPending: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findPendingBillsByUserId(resolvedCtx.db, userId);
   }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      const [
         totalBills,
         totalPendingPayables,
         totalPendingReceivables,
         totalOverdue,
         totalOverduePayables,
         totalOverdueReceivables,
      ] = await Promise.all([
         getTotalBillsByUserId(resolvedCtx.db, userId),
         getTotalPendingPayablesByUserId(resolvedCtx.db, userId),
         getTotalPendingReceivablesByUserId(resolvedCtx.db, userId),
         getTotalOverdueBillsByUserId(resolvedCtx.db, userId),
         getTotalOverduePayablesByUserId(resolvedCtx.db, userId),
         getTotalOverdueReceivablesByUserId(resolvedCtx.db, userId),
      ]);

      return {
         totalBills,
         totalOverdue: totalOverdue || 0,
         totalOverduePayables: totalOverduePayables || 0,
         totalOverdueReceivables: totalOverdueReceivables || 0,
         totalPendingPayables: totalPendingPayables || 0,
         totalPendingReceivables: totalPendingReceivables || 0,
      };
   }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateBillSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== userId) {
            throw new Error("Bill not found");
         }

         if (existingBill.completionDate) {
            throw new Error("Cannot edit completed bill");
         }

         const updateData: Partial<NewBill> = {};

         if (input.data.amount !== undefined) {
            updateData.amount = input.data.amount.toString();
         }

         if (input.data.dueDate !== undefined) {
            updateData.dueDate = new Date(input.data.dueDate);
         }

         if (input.data.issueDate !== undefined) {
            updateData.issueDate = new Date(input.data.issueDate);
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

         if (input.data.counterparty !== undefined) {
            updateData.counterparty = input.data.counterparty;
         }

         if (input.data.notes !== undefined) {
            updateData.notes = input.data.notes;
         }

         return updateBill(resolvedCtx.db, input.id, updateData);
      }),
});
