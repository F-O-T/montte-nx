import {
   getCashFlowByPeriod,
   getCategoryBreakdownByPeriod,
   getFinancialSummaryByPeriod,
   getPaymentPerformanceByPeriod,
   getPlannedVsActualByPeriod,
} from "@packages/database/repositories/report-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const periodSchema = z.object({
   endDate: z.string(),
   startDate: z.string(),
});

const cashFlowSchema = periodSchema.extend({
   groupBy: z.enum(["day", "week", "month"]).default("day"),
});

export const reportRouter = router({
   getCashFlow: protectedProcedure
      .input(cashFlowSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return getCashFlowByPeriod(
            resolvedCtx.db,
            userId,
            {
               endDate: new Date(input.endDate),
               startDate: new Date(input.startDate),
            },
            input.groupBy,
         );
      }),

   getCategoryBreakdown: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return getCategoryBreakdownByPeriod(resolvedCtx.db, userId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),

   getFinancialSummary: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return getFinancialSummaryByPeriod(resolvedCtx.db, userId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),

   getPaymentPerformance: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return getPaymentPerformanceByPeriod(resolvedCtx.db, userId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),

   getPlannedVsActual: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return getPlannedVsActualByPeriod(resolvedCtx.db, userId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),
});
