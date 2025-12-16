import { APIError } from "@packages/utils/errors";
import {
   createInterestTemplate,
   deleteInterestTemplate,
   deleteManyInterestTemplates,
   findDefaultInterestTemplate,
   findInterestTemplateById,
   findInterestTemplatesByOrganizationId,
   findInterestTemplatesByOrganizationIdPaginated,
   getInterestTemplateStats,
   searchInterestTemplates,
   updateInterestTemplate,
} from "@packages/database/repositories/interest-template-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const penaltyTypeSchema = z.enum(["none", "percentage", "fixed"]);
const interestTypeSchema = z.enum(["none", "daily", "monthly"]);
const monetaryCorrectionIndexSchema = z.enum(["none", "ipca", "selic", "cdi"]);

const createInterestTemplateSchema = z.object({
   gracePeriodDays: z.number().min(0).default(0),
   interestType: interestTypeSchema,
   interestValue: z.string().optional(),
   isDefault: z.boolean().optional(),
   monetaryCorrectionIndex: monetaryCorrectionIndexSchema,
   name: z.string().min(1),
   penaltyType: penaltyTypeSchema,
   penaltyValue: z.string().optional(),
});

const updateInterestTemplateSchema = z.object({
   gracePeriodDays: z.number().min(0).optional(),
   interestType: interestTypeSchema.optional(),
   interestValue: z.string().optional(),
   isActive: z.boolean().optional(),
   isDefault: z.boolean().optional(),
   monetaryCorrectionIndex: monetaryCorrectionIndexSchema.optional(),
   name: z.string().min(1).optional(),
   penaltyType: penaltyTypeSchema.optional(),
   penaltyValue: z.string().optional(),
});

const paginationSchema = z.object({
   isActive: z.boolean().optional(),
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
});

export const interestTemplateRouter = router({
   create: protectedProcedure
      .input(createInterestTemplateSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return createInterestTemplate(resolvedCtx.db, {
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

         const existingTemplate = await findInterestTemplateById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingTemplate ||
            existingTemplate.organizationId !== organizationId
         ) {
            throw APIError.notFound("Interest template not found");
         }

         return deleteInterestTemplate(resolvedCtx.db, input.id);
      }),

   deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return deleteManyInterestTemplates(
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
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findInterestTemplatesByOrganizationId(
            resolvedCtx.db,
            organizationId,
            {
               isActive: input?.isActive,
            },
         );
      }),

   getAllPaginated: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return findInterestTemplatesByOrganizationIdPaginated(
            resolvedCtx.db,
            organizationId,
            {
               isActive: input.isActive,
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

         const template = await findInterestTemplateById(
            resolvedCtx.db,
            input.id,
         );

         if (!template || template.organizationId !== organizationId) {
            throw APIError.notFound("Interest template not found");
         }

         return template;
      }),

   getDefault: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return findDefaultInterestTemplate(resolvedCtx.db, organizationId);
   }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getInterestTemplateStats(resolvedCtx.db, organizationId);
   }),

   search: protectedProcedure
      .input(
         z.object({
            isActive: z.boolean().optional(),
            limit: z.number().optional(),
            query: z.string(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return searchInterestTemplates(
            resolvedCtx.db,
            organizationId,
            input.query,
            {
               isActive: input.isActive,
               limit: input.limit,
            },
         );
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: updateInterestTemplateSchema,
            id: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         const existingTemplate = await findInterestTemplateById(
            resolvedCtx.db,
            input.id,
         );

         if (
            !existingTemplate ||
            existingTemplate.organizationId !== organizationId
         ) {
            throw APIError.notFound("Interest template not found");
         }

         return updateInterestTemplate(resolvedCtx.db, input.id, input.data);
      }),
});
