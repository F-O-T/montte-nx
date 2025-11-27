import { findBankAccountsByOrganizationId } from "@packages/database/repositories/bank-account-repository";
import { getTotalCategoriesByOrganizationId } from "@packages/database/repositories/category-repository";
import { APIError } from "@packages/utils/errors";
import { protectedProcedure, router } from "../trpc";

export const onboardingRouter = router({
   getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
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
         needsOnboarding: !hasCategories || !hasBankAccounts,
      };
   }),
});
