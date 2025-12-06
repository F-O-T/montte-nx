import { findOrganizationById } from "@packages/database/repositories/auth-repository";
import { findBankAccountsByOrganizationId } from "@packages/database/repositories/bank-account-repository";
import { getTotalCategoriesByOrganizationId } from "@packages/database/repositories/category-repository";
import { APIError } from "@packages/utils/errors";
import { protectedProcedure, router } from "../trpc";

export const onboardingRouter = router({
   completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
      }

      await resolvedCtx.auth.api.updateOrganization({
         body: {
            data: {
               onboardingCompleted: true,
            },
            organizationId,
         },
         headers: resolvedCtx.headers,
      });

      return { success: true };
   }),

   getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const organization = await findOrganizationById(
         resolvedCtx.db,
         organizationId,
      );

      if (!organization) {
         throw APIError.notFound("Organization not found");
      }

      const [categoriesCount, bankAccounts] = await Promise.all([
         getTotalCategoriesByOrganizationId(resolvedCtx.db, organizationId),
         findBankAccountsByOrganizationId(resolvedCtx.db, organizationId),
      ]);

      const hasCategories = categoriesCount > 0;
      const hasBankAccounts = bankAccounts.length > 0;

      return {
         hasBankAccounts,
         hasCategories,
         needsOnboarding: !organization.onboardingCompleted,
         organizationContext: organization.context,
      };
   }),
});
