import { APIError } from "@packages/utils/errors";
import {
   createCounterparty,
   deleteCounterparty,
   deleteManyCounterparties,
   findCounterpartiesByOrganizationId,
   findCounterpartiesByOrganizationIdPaginated,
   findCounterpartyById,
   getCounterpartyStats,
   getTotalCounterpartiesByOrganizationId,
   searchCounterparties,
   updateCounterparty,
} from "@packages/database/repositories/counterparty-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const counterpartyTypeSchema = z.enum(["client", "supplier", "both"]);

const createCounterpartySchema = z.object({
   document: z.string().optional(),
   email: z.string().optional(),
   name: z.string().min(1),
   notes: z.string().optional(),
   phone: z.string().optional(),
   type: counterpartyTypeSchema,
});

const updateCounterpartySchema = z.object({
   document: z.string().optional(),
   email: z.string().optional(),
   isActive: z.boolean().optional(),
   name: z.string().min(1).optional(),
   notes: z.string().optional(),
   phone: z.string().optional(),
   type: counterpartyTypeSchema.optional(),
});

const paginationSchema = z.object({
   isActive: z.boolean().optional(),
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z.enum(["name", "type", "createdAt", "updatedAt"]).default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   type: counterpartyTypeSchema.optional(),
});

export const counterpartyRouter = router({
   create: protectedProcedure
      .input(createCounterpartySchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createCounterparty(resolvedCtx.db, {
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

         const existingCounterparty = await findCounterpartyById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingCounterparty ||
            existingCounterparty.organizationId !== organizationId
         ) {
            throw APIError.notFound("Counterparty not found");
         }

         return deleteCounterparty(resolvedCtx.db, input.id);
      }),

   deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return deleteManyCounterparties(
            resolvedCtx.db,
            input.ids,
            organizationId,
         );
      }),

   getAll: protectedProcedure
      .input(
         z
            .object({
               isActive: z.boolean().optional(),
               type: counterpartyTypeSchema.optional(),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findCounterpartiesByOrganizationId(
            resolvedCtx.db,
            organizationId,
            {
               isActive: input?.isActive,
               type: input?.type,
            },
         );
      }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findCounterpartiesByOrganizationIdPaginated(
            resolvedCtx.db,
            organizationId,
            {
               isActive: input.isActive,
               limit: input.limit,
               orderBy: input.orderBy,
               orderDirection: input.orderDirection,
               page: input.page,
               search: input.search,
               type: input.type,
            },
         );
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const counterparty = await findCounterpartyById(
            resolvedCtx.db,
            input.id,
         );

         if (!counterparty || counterparty.organizationId !== organizationId) {
            throw APIError.notFound("Counterparty not found");
         }

         return counterparty;
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      const [total, stats] = await Promise.all([
         getTotalCounterpartiesByOrganizationId(resolvedCtx.db, organizationId),
         getCounterpartyStats(resolvedCtx.db, organizationId),
      ]);

      return {
         total,
         ...stats,
      };
   }),

   search: protectedProcedure
      .input(
         z.object({
            isActive: z.boolean().optional(),
            limit: z.number().optional(),
            query: z.string(),
            type: counterpartyTypeSchema.optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return searchCounterparties(
            resolvedCtx.db,
            organizationId,
            input.query,
            {
               isActive: input.isActive,
               limit: input.limit,
               type: input.type,
            },
         );
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateCounterpartySchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingCounterparty = await findCounterpartyById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingCounterparty ||
            existingCounterparty.organizationId !== organizationId
         ) {
            throw APIError.notFound("Counterparty not found");
         }

         return updateCounterparty(resolvedCtx.db, input.id, input.data);
      }),
});
