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
         const organizationId = resolvedCtx.organizationId;

         return getCashFlowByPeriod(
            resolvedCtx.db,
            organizationId,
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
         const organizationId = resolvedCtx.organizationId;

         return getCategoryBreakdownByPeriod(resolvedCtx.db, organizationId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),

   getFinancialSummary: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return getFinancialSummaryByPeriod(resolvedCtx.db, organizationId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),

   getPaymentPerformance: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return getPaymentPerformanceByPeriod(resolvedCtx.db, organizationId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),

   getPlannedVsActual: protectedProcedure
      .input(periodSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return getPlannedVsActualByPeriod(resolvedCtx.db, organizationId, {
            endDate: new Date(input.endDate),
            startDate: new Date(input.startDate),
         });
      }),
});
