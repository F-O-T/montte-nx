import { findBankAccountsByUserId } from "@packages/database/repositories/bank-account-repository";
import { getTotalCategoriesByUserId } from "@packages/database/repositories/category-repository";
import { APIError } from "@packages/utils/errors";
import { protectedProcedure, router } from "../trpc";
export const onboardingRouter = router({
   getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;
      if (!userId) {
         throw APIError.unauthorized("Unauthorized");
      }
      const [categoriesCount, bankAccounts] = await Promise.all([
         getTotalCategoriesByUserId(resolvedCtx.db, userId),
         findBankAccountsByUserId(resolvedCtx.db, userId),
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
