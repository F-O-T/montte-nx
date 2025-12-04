import {
   createCostCenter,
   deleteCostCenter,
   deleteManyCostCenters,
   findCostCenterById,
   findCostCentersByOrganizationId,
   findCostCentersByOrganizationIdPaginated,
   getCostCenterWithMostTransactions,
   getTotalCostCentersByOrganizationId,
   updateCostCenter,
} from "@packages/database/repositories/cost-center-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createCostCenterSchema = z.object({
   code: z.string().optional(),
   name: z.string(),
});

const updateCostCenterSchema = z.object({
   code: z.string().optional(),
   name: z.string().optional(),
});

const paginationSchema = z.object({
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z.enum(["name", "code", "createdAt", "updatedAt"]).default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
});

export const costCenterRouter = router({
   create: protectedProcedure
      .input(createCostCenterSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createCostCenter(resolvedCtx.db, {
            ...input,
            id: crypto.randomUUID(),
            organizationId,
         });
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingCostCenter = await findCostCenterById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingCostCenter ||
            existingCostCenter.organizationId !== organizationId
         ) {
            throw new Error("Cost center not found");
         }

         return deleteCostCenter(resolvedCtx.db, input.id);
      }),

   deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return deleteManyCostCenters(
            resolvedCtx.db,
            input.ids,
            organizationId,
         );
      }),

   getAll: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findCostCentersByOrganizationId(resolvedCtx.db, organizationId);
   }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findCostCentersByOrganizationIdPaginated(
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

         const costCenter = await findCostCenterById(resolvedCtx.db, input.id);

         if (!costCenter || costCenter.organizationId !== organizationId) {
            throw new Error("Cost center not found");
         }

         return costCenter;
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      const [totalCostCenters, costCenterWithMostTransactions] =
         await Promise.all([
            getTotalCostCentersByOrganizationId(resolvedCtx.db, organizationId),
            getCostCenterWithMostTransactions(resolvedCtx.db, organizationId),
         ]);

      return {
         costCenterWithMostTransactions:
            costCenterWithMostTransactions?.costCenterName || null,
         totalCostCenters,
      };
   }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateCostCenterSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingCostCenter = await findCostCenterById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingCostCenter ||
            existingCostCenter.organizationId !== organizationId
         ) {
            throw new Error("Cost center not found");
         }

         return updateCostCenter(resolvedCtx.db, input.id, input.data);
      }),
});
