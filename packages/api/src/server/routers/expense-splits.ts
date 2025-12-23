import { findMemberByUserIdAndOrganizationId } from "@packages/database/repositories/auth-repository";
import {
   createExpenseSplit,
   deleteExpenseSplit,
   findExpenseSplitById,
   findExpenseSplitsByMemberId,
   findExpenseSplitsByOrganizationId,
   findExpenseSplitsByTeamId,
   getExpenseSplitStats,
   getMemberBalance,
   recordSettlement,
   updateExpenseSplitParticipant,
} from "@packages/database/repositories/expense-split-repository";
import type { SplitType } from "@packages/database/schemas/expense-splits";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const splitTypeSchema = z.enum(["equal", "percentage", "amount", "shares"]);

const participantSchema = z.object({
   allocatedAmount: z.string(),
   memberId: z.string(),
   notes: z.string().optional(),
   percentageValue: z.string().optional(),
   shareValue: z.string().optional(),
});

const createExpenseSplitSchema = z.object({
   billId: z.string().optional(),
   description: z.string().optional(),
   participants: z.array(participantSchema).min(1),
   splitType: splitTypeSchema,
   teamId: z.string().optional(),
   totalAmount: z.string(),
   transactionId: z.string().optional(),
});

const paginationSchema = z.object({
   limit: z.coerce.number().min(1).max(100).default(20),
   page: z.coerce.number().min(1).default(1),
});

const recordSettlementSchema = z.object({
   amount: z.string(),
   linkedTransactionId: z.string().optional(),
   notes: z.string().optional(),
   paidAt: z.date().optional(),
   participantId: z.string(),
});

export const expenseSplitsRouter = router({
   create: protectedProcedure
      .input(createExpenseSplitSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         const member = await findMemberByUserIdAndOrganizationId(
            resolvedCtx.db,
            userId,
            organizationId,
         );

         if (!member) {
            throw APIError.forbidden(
               "You are not a member of this organization",
            );
         }

         try {
            const result = await createExpenseSplit(
               resolvedCtx.db,
               {
                  billId: input.billId,
                  createdBy: member.id,
                  description: input.description,
                  organizationId,
                  splitType: input.splitType as SplitType,
                  teamId: input.teamId,
                  totalAmount: input.totalAmount,
                  transactionId: input.transactionId,
               },
               input.participants.map((p) => ({
                  allocatedAmount: p.allocatedAmount,
                  memberId: p.memberId,
                  notes: p.notes,
                  percentageValue: p.percentageValue,
                  shareValue: p.shareValue,
               })),
            );
            return result;
         } catch (error) {
            propagateError(error);
            throw APIError.internal("Failed to create expense split");
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingSplit = await findExpenseSplitById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingSplit ||
            existingSplit.organizationId !== organizationId
         ) {
            throw APIError.notFound("Expense split not found");
         }

         try {
            return await deleteExpenseSplit(resolvedCtx.db, input.id);
         } catch (error) {
            propagateError(error);
            throw APIError.internal("Failed to delete expense split");
         }
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const split = await findExpenseSplitById(resolvedCtx.db, input.id);

         if (!split || split.organizationId !== organizationId) {
            throw APIError.notFound("Expense split not found");
         }

         return split;
      }),

   getByTeam: protectedProcedure
      .input(z.object({ teamId: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            return await findExpenseSplitsByTeamId(
               resolvedCtx.db,
               input.teamId,
            );
         } catch (error) {
            propagateError(error);
            throw APIError.internal("Failed to get expense splits by team");
         }
      }),

   getMyBalance: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const member = await findMemberByUserIdAndOrganizationId(
         resolvedCtx.db,
         userId,
         organizationId,
      );

      if (!member) {
         throw APIError.forbidden("You are not a member of this organization");
      }

      try {
         return await getMemberBalance(
            resolvedCtx.db,
            member.id,
            organizationId,
         );
      } catch (error) {
         propagateError(error);
         throw APIError.internal("Failed to get member balance");
      }
   }),

   getMySplits: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const member = await findMemberByUserIdAndOrganizationId(
         resolvedCtx.db,
         userId,
         organizationId,
      );

      if (!member) {
         throw APIError.forbidden("You are not a member of this organization");
      }

      try {
         return await findExpenseSplitsByMemberId(resolvedCtx.db, member.id);
      } catch (error) {
         propagateError(error);
         throw APIError.internal("Failed to get member expense splits");
      }
   }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      try {
         return await getExpenseSplitStats(resolvedCtx.db, organizationId);
      } catch (error) {
         propagateError(error);
         throw APIError.internal("Failed to get expense split stats");
      }
   }),

   list: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         try {
            return await findExpenseSplitsByOrganizationId(
               resolvedCtx.db,
               organizationId,
               {
                  limit: input.limit,
                  page: input.page,
               },
            );
         } catch (error) {
            propagateError(error);
            throw APIError.internal("Failed to list expense splits");
         }
      }),

   recordSettlement: protectedProcedure
      .input(recordSettlementSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;
         const organizationId = resolvedCtx.organizationId;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         const member = await findMemberByUserIdAndOrganizationId(
            resolvedCtx.db,
            userId,
            organizationId,
         );

         if (!member) {
            throw APIError.forbidden(
               "You are not a member of this organization",
            );
         }

         try {
            return await recordSettlement(resolvedCtx.db, input.participantId, {
               amount: input.amount,
               linkedTransactionId: input.linkedTransactionId,
               notes: input.notes,
               paidAt: input.paidAt || new Date(),
               recordedBy: member.id,
            });
         } catch (error) {
            propagateError(error);
            throw APIError.internal("Failed to record settlement");
         }
      }),

   updateParticipant: protectedProcedure
      .input(
         z.object({
            data: z.object({
               allocatedAmount: z.string().optional(),
               notes: z.string().optional(),
               percentageValue: z.string().optional(),
               shareValue: z.string().optional(),
            }),
            participantId: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            return await updateExpenseSplitParticipant(
               resolvedCtx.db,
               input.participantId,
               input.data,
            );
         } catch (error) {
            propagateError(error);
            throw APIError.internal("Failed to update participant");
         }
      }),
});
