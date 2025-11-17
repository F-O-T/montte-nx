import {
   createBill,
   deleteBill,
   findBillById,
   findBillsByUserId,
   findBillsByUserIdAndType,
   findBillsByUserIdPaginated,
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
import {
   generateFutureDates,
   getNextDueDate,
} from "@packages/utils/recurrence";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createBillSchema = z.object({
   amount: z.number(),
   bankAccountId: z.string().optional(),
   category: z.string(),
   counterparty: z.string().optional(),
   description: z.string(),
   dueDate: z.string(),
   isRecurring: z.boolean().optional().default(false),
   issueDate: z.string(),
   notes: z.string().optional(),
   recurrencePattern: z
      .enum(["monthly", "quarterly", "semiannual", "annual"])
      .optional(),
   type: z.enum(["income", "expense"]),
});

const updateBillSchema = z.object({
   amount: z.number().optional(),
   bankAccountId: z.string().optional(),
   category: z.string().optional(),
   counterparty: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.string().optional(),
   isRecurring: z.boolean().optional(),
   issueDate: z.string().optional(),
   notes: z.string().optional(),
   recurrencePattern: z
      .enum(["monthly", "quarterly", "semiannual", "annual"])
      .optional(),
   type: z.enum(["income", "expense"]).optional(),
});

const completeBillSchema = z.object({
   bankAccountId: z.string().optional(),
   completionDate: z.string(),
});

const paginationSchema = z.object({
   limit: z.coerce.number().min(1).max(100).default(10),
   month: z.string().optional(),
   orderBy: z
      .enum(["dueDate", "issueDate", "amount", "createdAt"])
      .default("dueDate"),
   orderDirection: z.enum(["asc", "desc"]).default("desc"),
   page: z.coerce.number().min(1).default(1),
   type: z.enum(["income", "expense"]).optional(),
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

         const firstBill = await createBill(resolvedCtx.db, {
            ...input,
            amount: input.amount.toString(),
            dueDate: new Date(input.dueDate),
            id: crypto.randomUUID(),
            isRecurring: input.isRecurring ?? false,
            issueDate: new Date(input.issueDate),
            recurrencePattern: input.recurrencePattern,
            userId,
         });

         if (input.isRecurring && input.recurrencePattern) {
            const futureDueDates = generateFutureDates(
               new Date(input.dueDate),
               input.recurrencePattern,
            );
            const futureIssueDates = generateFutureDates(
               new Date(input.issueDate),
               input.recurrencePattern,
            );

            const futureBillsPromises = futureDueDates.map((dueDate, index) => {
               return createBill(resolvedCtx.db, {
                  amount: input.amount.toString(),
                  bankAccountId: input.bankAccountId,
                  category: input.category,
                  counterparty: input.counterparty,
                  description: input.description,
                  dueDate,
                  id: crypto.randomUUID(),
                  isRecurring: true,
                  issueDate: futureIssueDates[index],
                  notes: input.notes,
                  parentBillId: firstBill.id,
                  recurrencePattern: input.recurrencePattern,
                  type: input.type,
                  userId,
               });
            });

            await Promise.all(futureBillsPromises);
         }

         return firstBill;
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

   generateNext: protectedProcedure
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

         if (!existingBill.isRecurring || !existingBill.recurrencePattern) {
            throw new Error("Bill is not recurring");
         }

         const nextDueDate = getNextDueDate(
            existingBill.dueDate,
            existingBill.recurrencePattern as
               | "monthly"
               | "quarterly"
               | "semiannual"
               | "annual",
         );

         const nextIssueDate = getNextDueDate(
            existingBill.issueDate,
            existingBill.recurrencePattern as
               | "monthly"
               | "quarterly"
               | "semiannual"
               | "annual",
         );

         return createBill(resolvedCtx.db, {
            amount: existingBill.amount,
            bankAccountId: existingBill.bankAccountId,
            category: existingBill.category,
            counterparty: existingBill.counterparty,
            description: existingBill.description,
            dueDate: nextDueDate,
            id: crypto.randomUUID(),
            isRecurring: existingBill.isRecurring,
            issueDate: nextIssueDate,
            notes: existingBill.notes,
            parentBillId: existingBill.id,
            recurrencePattern: existingBill.recurrencePattern,
            type: existingBill.type,
            userId,
         });
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      return findBillsByUserId(resolvedCtx.db, userId);
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return findBillsByUserIdPaginated(resolvedCtx.db, userId, input);
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

         if (input.data.isRecurring !== undefined) {
            updateData.isRecurring = input.data.isRecurring;
         }

         if (input.data.recurrencePattern !== undefined) {
            updateData.recurrencePattern = input.data.recurrencePattern;
         }

         return updateBill(resolvedCtx.db, input.id, updateData);
      }),
});
