import {
   bulkUpdateCounterpartyStatus,
   bulkUpdateCounterpartyType,
   createCounterparty,
   createCounterpartyAttachment,
   deleteCounterparty,
   deleteCounterpartyAttachment,
   deleteManyCounterparties,
   findCounterpartiesByOrganizationId,
   findCounterpartiesByOrganizationIdPaginated,
   findCounterpartyAttachmentById,
   findCounterpartyAttachments,
   findCounterpartyById,
   getCounterpartyStats,
   getDistinctIndustries,
   getTotalCounterpartiesByOrganizationId,
   searchCounterparties,
   toggleCounterpartyActive,
   updateCounterparty,
} from "@packages/database/repositories/counterparty-repository";
import { APIError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const counterpartyTypeSchema = z.enum(["client", "supplier", "both"]);
const documentTypeSchema = z.enum(["cpf", "cnpj", "foreign"]).nullable();
const taxRegimeSchema = z
   .enum(["simples", "lucro_presumido", "lucro_real", "mei"])
   .nullable();

const createCounterpartySchema = z.object({
   // Step 1: Type
   type: counterpartyTypeSchema,

   // Step 2: Basic Info
   name: z.string().min(1),
   tradeName: z.string().optional(),
   legalName: z.string().optional(),
   documentType: documentTypeSchema.optional(),
   document: z.string().optional(),
   stateRegistration: z.string().optional(),
   municipalRegistration: z.string().optional(),

   // Step 3: Contact
   email: z.string().email().optional().or(z.literal("")),
   phone: z.string().optional(),
   website: z.string().url().optional().or(z.literal("")),

   // Step 4: Address
   addressStreet: z.string().optional(),
   addressNumber: z.string().optional(),
   addressComplement: z.string().optional(),
   addressNeighborhood: z.string().optional(),
   addressCity: z.string().optional(),
   addressState: z.string().optional(),
   addressZipCode: z.string().optional(),
   addressCountry: z.string().optional(),

   // Step 5: Financial Settings
   industry: z.string().optional(),
   taxRegime: taxRegimeSchema.optional(),
   paymentTermsDays: z.number().min(0).max(365).optional(),
   creditLimit: z
      .number()
      .min(0)
      .optional()
      .transform((val) => (val !== undefined ? String(val) : undefined)),
   defaultBankAccountId: z.string().uuid().optional().nullable(),
   defaultCategoryId: z.string().optional(),
   notes: z.string().optional(),
});

const updateCounterpartySchema = z.object({
   // All fields optional for update
   type: counterpartyTypeSchema.optional(),
   name: z.string().min(1).optional(),
   tradeName: z.string().optional().nullable(),
   legalName: z.string().optional().nullable(),
   documentType: documentTypeSchema.optional(),
   document: z.string().optional().nullable(),
   stateRegistration: z.string().optional().nullable(),
   municipalRegistration: z.string().optional().nullable(),
   email: z.string().email().optional().or(z.literal("")).nullable(),
   phone: z.string().optional().nullable(),
   website: z.string().url().optional().or(z.literal("")).nullable(),
   addressStreet: z.string().optional().nullable(),
   addressNumber: z.string().optional().nullable(),
   addressComplement: z.string().optional().nullable(),
   addressNeighborhood: z.string().optional().nullable(),
   addressCity: z.string().optional().nullable(),
   addressState: z.string().optional().nullable(),
   addressZipCode: z.string().optional().nullable(),
   addressCountry: z.string().optional().nullable(),
   industry: z.string().optional().nullable(),
   taxRegime: taxRegimeSchema.optional(),
   paymentTermsDays: z.number().min(0).max(365).optional().nullable(),
   creditLimit: z
      .number()
      .min(0)
      .optional()
      .nullable()
      .transform((val) =>
         val !== undefined && val !== null ? String(val) : val,
      ),
   defaultBankAccountId: z.string().uuid().optional().nullable(),
   defaultCategoryId: z.string().optional().nullable(),
   notes: z.string().optional().nullable(),
   isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
   isActive: z.boolean().optional(),
   limit: z.coerce.number().min(1).max(100).default(10),
   orderBy: z
      .enum(["name", "type", "createdAt", "updatedAt", "tradeName", "legalName"])
      .default("name"),
   orderDirection: z.enum(["asc", "desc"]).default("asc"),
   page: z.coerce.number().min(1).default(1),
   search: z.string().optional(),
   type: counterpartyTypeSchema.optional(),
   industry: z.string().optional(),
   startDate: z.coerce.date().optional(),
   endDate: z.coerce.date().optional(),
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
               endDate: input.endDate,
               industry: input.industry,
               isActive: input.isActive,
               limit: input.limit,
               orderBy: input.orderBy,
               orderDirection: input.orderDirection,
               page: input.page,
               search: input.search,
               startDate: input.startDate,
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

   // Toggle active status
   toggleActive: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return toggleCounterpartyActive(
            resolvedCtx.db,
            input.id,
            organizationId,
         );
      }),

   // Bulk update type
   bulkUpdateType: protectedProcedure
      .input(
         z.object({
            ids: z.array(z.string().uuid()),
            type: counterpartyTypeSchema,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return bulkUpdateCounterpartyType(
            resolvedCtx.db,
            input.ids,
            input.type,
            organizationId,
         );
      }),

   // Bulk toggle active status
   bulkToggleActive: protectedProcedure
      .input(
         z.object({
            ids: z.array(z.string().uuid()),
            isActive: z.boolean(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         return bulkUpdateCounterpartyStatus(
            resolvedCtx.db,
            input.ids,
            input.isActive,
            organizationId,
         );
      }),

   // Get distinct industries for autocomplete
   getIndustries: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      return getDistinctIndustries(resolvedCtx.db, organizationId);
   }),

   // ==================== ATTACHMENT PROCEDURES ====================

   getAttachments: protectedProcedure
      .input(z.object({ counterpartyId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         // Verify counterparty belongs to organization
         const cp = await findCounterpartyById(
            resolvedCtx.db,
            input.counterpartyId,
         );
         if (!cp || cp.organizationId !== organizationId) {
            throw APIError.notFound("Counterparty not found");
         }

         return findCounterpartyAttachments(
            resolvedCtx.db,
            input.counterpartyId,
         );
      }),

   addAttachment: protectedProcedure
      .input(
         z.object({
            counterpartyId: z.string().uuid(),
            fileName: z.string().min(1),
            storageKey: z.string().min(1),
            contentType: z.string().min(1),
            fileSize: z.number().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         // Verify counterparty belongs to organization
         const cp = await findCounterpartyById(
            resolvedCtx.db,
            input.counterpartyId,
         );
         if (!cp || cp.organizationId !== organizationId) {
            throw APIError.notFound("Counterparty not found");
         }

         return createCounterpartyAttachment(resolvedCtx.db, {
            counterpartyId: input.counterpartyId,
            contentType: input.contentType,
            fileName: input.fileName,
            fileSize: input.fileSize,
            storageKey: input.storageKey,
         });
      }),

   deleteAttachment: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         // Verify attachment's counterparty belongs to organization
         const attachment = await findCounterpartyAttachmentById(
            resolvedCtx.db,
            input.id,
         );
         if (!attachment) {
            throw APIError.notFound("Attachment not found");
         }

         const cp = await findCounterpartyById(
            resolvedCtx.db,
            attachment.counterpartyId,
         );
         if (!cp || cp.organizationId !== organizationId) {
            throw APIError.notFound("Attachment not found");
         }

         return deleteCounterpartyAttachment(resolvedCtx.db, input.id);
      }),
});
