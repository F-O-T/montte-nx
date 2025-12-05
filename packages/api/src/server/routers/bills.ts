import {
   createBillAttachment,
   deleteBillAttachment,
   findBillAttachmentById,
   findBillAttachmentsByBillId,
} from "@packages/database/repositories/bill-attachment-repository";
import {
   completeManyBills,
   createBill,
   createBillWithInstallments,
   deleteBill,
   deleteManyBills,
   findBillById,
   findBillsByInstallmentGroupId,
   findBillsByUserId,
   findBillsByUserIdAndType,
   findBillsByUserIdFiltered,
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
import { streamFileForProxy, uploadFile } from "@packages/files/client";
import {
   generateFutureDates,
   getNextDueDate,
} from "@packages/utils/recurrence";
import { z } from "zod";
import {
   createBillSchema,
   createBillWithInstallmentsSchema,
} from "../schemas/bill";
import { protectedProcedure, router } from "../trpc";

const updateBillSchema = z.object({
   amount: z.number().optional(),
   autoCreateNext: z.boolean().optional(),
   bankAccountId: z.string().optional(),
   categoryId: z.string().optional(),
   counterpartyId: z.string().nullable().optional(),
   description: z.string().optional(),
   dueDate: z.string().optional(),
   interestTemplateId: z.string().nullable().optional(),
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
   endDate: z.string().optional(),
   limit: z.coerce.number().min(1).max(100).default(5),
   month: z.string().optional(),
   orderBy: z
      .enum(["dueDate", "issueDate", "amount", "createdAt"])
      .default("dueDate"),
   orderDirection: z.enum(["asc", "desc"]).default("desc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   startDate: z.string().optional(),
   type: z.enum(["income", "expense"]).optional(),
});

const filterSchema = z.object({
   month: z.string().optional(),
   orderBy: z
      .enum(["dueDate", "issueDate", "amount", "createdAt"])
      .default("dueDate"),
   orderDirection: z.enum(["asc", "desc"]).default("desc"),
   type: z.enum(["income", "expense"]).optional(),
});

export const billRouter = router({
   addAttachment: protectedProcedure
      .input(
         z.object({
            billId: z.string(),
            contentType: z.string(),
            fileBuffer: z.string(),
            fileName: z.string(),
            fileSize: z.number().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const { billId, fileName, fileBuffer, contentType, fileSize } = input;
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBill = await findBillById(resolvedCtx.db, billId);

         if (!existingBill || existingBill.userId !== organizationId) {
            throw new Error("Bill not found");
         }

         const attachmentId = crypto.randomUUID();
         const key = `bills/${organizationId}/${billId}/attachments/${attachmentId}/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");

         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         await uploadFile(key, buffer, contentType, bucketName, minioClient);

         const attachment = await createBillAttachment(resolvedCtx.db, {
            billId,
            contentType,
            fileName,
            fileSize: fileSize || buffer.length,
            id: attachmentId,
            storageKey: key,
         });

         return attachment;
      }),
   complete: protectedProcedure
      .input(
         z.object({
            data: completeBillSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== organizationId) {
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
            date: new Date(input.data.completionDate),
            description: existingBill.description,
            id: crypto.randomUUID(),
            organizationId,
            type: existingBill.type as "income" | "expense",
         });

         const updatedBill = await updateBill(resolvedCtx.db, input.id, {
            completionDate: new Date(input.data.completionDate),
            transactionId: transaction.id,
         });

         return updatedBill;
      }),

   completeMany: protectedProcedure
      .input(
         z.object({
            completionDate: z.string(),
            ids: z.array(z.string()),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const result = await completeManyBills(
            resolvedCtx.db,
            input.ids,
            organizationId,
            new Date(input.completionDate),
         );

         return result;
      }),
   create: protectedProcedure
      .input(createBillSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const firstBill = await createBill(resolvedCtx.db, {
            ...input,
            amount: input.amount.toString(),
            counterpartyId: input.counterpartyId,
            description: input.description || "",
            dueDate: new Date(input.dueDate),
            id: crypto.randomUUID(),
            interestTemplateId: input.interestTemplateId,
            isRecurring: input.isRecurring ?? false,
            issueDate: input.issueDate ? new Date(input.issueDate) : null,
            originalAmount: input.originalAmount?.toString(),
            recurrencePattern: input.recurrencePattern,
            userId: organizationId,
         });

         if (input.isRecurring && input.recurrencePattern) {
            const futureDueDates = generateFutureDates(
               new Date(input.dueDate),
               input.recurrencePattern,
            );
            const futureIssueDates = input.issueDate
               ? generateFutureDates(
                    new Date(input.issueDate),
                    input.recurrencePattern,
                 )
               : [];

            const futureBillsPromises = futureDueDates.map((dueDate, index) => {
               return createBill(resolvedCtx.db, {
                  amount: input.amount.toString(),
                  bankAccountId: input.bankAccountId,
                  categoryId: input.categoryId,
                  counterpartyId: input.counterpartyId,
                  description: input.description || "",
                  dueDate,
                  id: crypto.randomUUID(),
                  interestTemplateId: input.interestTemplateId,
                  isRecurring: true,
                  issueDate: futureIssueDates[index] ?? null,
                  notes: input.notes,
                  originalAmount: input.originalAmount?.toString(),
                  parentBillId: firstBill.id,
                  recurrencePattern: input.recurrencePattern,
                  type: input.type,
                  userId: organizationId,
               });
            });

            await Promise.all(futureBillsPromises);
         }

         return firstBill;
      }),

   createWithInstallments: protectedProcedure
      .input(createBillWithInstallmentsSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const result = await createBillWithInstallments(resolvedCtx.db, {
            amount: input.amount.toString(),
            bankAccountId: input.bankAccountId,
            categoryId: input.categoryId,
            counterpartyId: input.counterpartyId,
            description: input.description || "",
            dueDate: new Date(input.dueDate),
            id: crypto.randomUUID(),
            installments: input.installments,
            interestTemplateId: input.interestTemplateId,
            issueDate: input.issueDate ? new Date(input.issueDate) : null,
            notes: input.notes,
            type: input.type,
            userId: organizationId,
         });

         return result;
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== organizationId) {
            throw new Error("Bill not found");
         }

         if (existingBill.completionDate && existingBill.transactionId) {
            throw new Error(
               "Cannot delete completed bill. Delete the associated transaction first.",
            );
         }

         return deleteBill(resolvedCtx.db, input.id);
      }),

   deleteAttachment: protectedProcedure
      .input(z.object({ attachmentId: z.string(), billId: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const bill = await findBillById(resolvedCtx.db, input.billId);

         if (!bill || bill.userId !== organizationId) {
            throw new Error("Bill not found");
         }

         const attachment = await findBillAttachmentById(
            resolvedCtx.db,
            input.attachmentId,
         );

         if (!attachment || attachment.billId !== input.billId) {
            throw new Error("Attachment not found");
         }

         try {
            const bucketName = resolvedCtx.minioBucket;
            const minioClient = resolvedCtx.minioClient;
            await minioClient.removeObject(bucketName, attachment.storageKey);
         } catch (error) {
            console.error("Error deleting attachment file:", error);
         }

         await deleteBillAttachment(resolvedCtx.db, input.attachmentId);

         return { success: true };
      }),

   deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const result = await deleteManyBills(
            resolvedCtx.db,
            input.ids,
            organizationId,
         );

         return result;
      }),

   generateNext: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== organizationId) {
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

         const nextIssueDate = existingBill.issueDate
            ? getNextDueDate(
                 existingBill.issueDate,
                 existingBill.recurrencePattern as
                    | "monthly"
                    | "quarterly"
                    | "semiannual"
                    | "annual",
              )
            : nextDueDate;

         return createBill(resolvedCtx.db, {
            amount: existingBill.amount,
            bankAccountId: existingBill.bankAccountId,
            categoryId: existingBill.categoryId,
            counterpartyId: existingBill.counterpartyId,
            description: existingBill.description,
            dueDate: nextDueDate,
            id: crypto.randomUUID(),
            interestTemplateId: existingBill.interestTemplateId,
            isRecurring: existingBill.isRecurring,
            issueDate: nextIssueDate,
            notes: existingBill.notes,
            parentBillId: existingBill.id,
            recurrencePattern: existingBill.recurrencePattern,
            type: existingBill.type,
            userId: organizationId,
         });
      }),

   getAll: protectedProcedure
      .input(filterSchema.optional())
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         if (input && (input.month || input.type)) {
            return findBillsByUserIdFiltered(
               resolvedCtx.db,
               organizationId,
               input,
            );
         }

         return findBillsByUserId(resolvedCtx.db, organizationId);
      }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findBillsByUserIdPaginated(resolvedCtx.db, organizationId, {
            ...input,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
         });
      }),

   getAttachmentData: protectedProcedure
      .input(z.object({ attachmentId: z.string(), billId: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const bill = await findBillById(resolvedCtx.db, input.billId);

         if (!bill || bill.userId !== organizationId) {
            throw new Error("Bill not found");
         }

         const attachment = await findBillAttachmentById(
            resolvedCtx.db,
            input.attachmentId,
         );

         if (!attachment || attachment.billId !== input.billId) {
            throw new Error("Attachment not found");
         }

         const bucketName = resolvedCtx.minioBucket;

         try {
            const { buffer, contentType } = await streamFileForProxy(
               attachment.storageKey,
               bucketName,
               resolvedCtx.minioClient,
            );
            const base64 = buffer.toString("base64");
            return {
               contentType,
               data: `data:${contentType};base64,${base64}`,
               fileName: attachment.fileName,
               id: attachment.id,
            };
         } catch (error) {
            console.error("Error fetching attachment:", error);
            return null;
         }
      }),

   getAttachments: protectedProcedure
      .input(z.object({ billId: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const bill = await findBillById(resolvedCtx.db, input.billId);

         if (!bill || bill.userId !== organizationId) {
            throw new Error("Bill not found");
         }

         const attachments = await findBillAttachmentsByBillId(
            resolvedCtx.db,
            input.billId,
         );

         return attachments;
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const billData = await findBillById(resolvedCtx.db, input.id);

         if (!billData || billData.userId !== organizationId) {
            throw new Error("Bill not found");
         }

         return billData;
      }),

   getByInstallmentGroup: protectedProcedure
      .input(z.object({ installmentGroupId: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const bills = await findBillsByInstallmentGroupId(
            resolvedCtx.db,
            input.installmentGroupId,
         );

         const filteredBills = bills.filter(
            (bill) => bill.userId === organizationId,
         );

         if (filteredBills.length === 0) {
            throw new Error("Installment group not found");
         }

         return filteredBills;
      }),

   getByType: protectedProcedure
      .input(z.object({ type: z.enum(["income", "expense"]) }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findBillsByUserIdAndType(
            resolvedCtx.db,
            organizationId,
            input.type,
         );
      }),

   getCompleted: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findCompletedBillsByUserId(resolvedCtx.db, organizationId);
   }),

   getOverdue: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findOverdueBillsByUserId(resolvedCtx.db, organizationId);
   }),

   getPending: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findPendingBillsByUserId(resolvedCtx.db, organizationId);
   }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      const [
         totalBills,
         totalPendingPayables,
         totalPendingReceivables,
         totalOverdue,
         totalOverduePayables,
         totalOverdueReceivables,
      ] = await Promise.all([
         getTotalBillsByUserId(resolvedCtx.db, organizationId),
         getTotalPendingPayablesByUserId(resolvedCtx.db, organizationId),
         getTotalPendingReceivablesByUserId(resolvedCtx.db, organizationId),
         getTotalOverdueBillsByUserId(resolvedCtx.db, organizationId),
         getTotalOverduePayablesByUserId(resolvedCtx.db, organizationId),
         getTotalOverdueReceivablesByUserId(resolvedCtx.db, organizationId),
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
         const organizationId = resolvedCtx.organizationId;

         const existingBill = await findBillById(resolvedCtx.db, input.id);

         if (!existingBill || existingBill.userId !== organizationId) {
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

         if (input.data.categoryId !== undefined) {
            updateData.categoryId = input.data.categoryId;
         }

         if (input.data.description !== undefined) {
            updateData.description = input.data.description;
         }

         if (input.data.type !== undefined) {
            updateData.type = input.data.type;
         }

         if (input.data.counterpartyId !== undefined) {
            updateData.counterpartyId = input.data.counterpartyId;
         }

         if (input.data.interestTemplateId !== undefined) {
            updateData.interestTemplateId = input.data.interestTemplateId;
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

         if (input.data.autoCreateNext !== undefined) {
            updateData.autoCreateNext = input.data.autoCreateNext;
         }

         return updateBill(resolvedCtx.db, input.id, updateData);
      }),
});
