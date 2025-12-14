import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const accountRouter = router({
   /**
    * Check if user has a credential account (has password set)
    */
   hasPassword: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw new Error("User not found");
      }

      const credentialAccount = await resolvedCtx.db.query.account.findFirst({
         where: (account, { and, eq }) =>
            and(eq(account.userId, userId), eq(account.providerId, "credential")),
      });

      return { hasPassword: !!credentialAccount };
   }),

   /**
    * Set password for OAuth users (converts to credential+OAuth hybrid account)
    */
   setPassword: protectedProcedure
      .input(z.object({ newPassword: z.string().min(8) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         await resolvedCtx.auth.api.setPassword({
            body: { newPassword: input.newPassword },
            headers: resolvedCtx.headers,
         });

         return { success: true };
      }),

   /**
    * Get all linked accounts for current user
    */
   getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw new Error("User not found");
      }

      const accounts = await resolvedCtx.db.query.account.findMany({
         where: (account, { eq }) => eq(account.userId, userId),
         columns: {
            id: true,
            providerId: true,
            accountId: true,
            createdAt: true,
         },
      });

      return accounts;
   }),

   /**
    * Export all user data as JSON
    * Includes: profile, transactions, categories, budgets, bills, bank accounts, etc.
    */
   exportUserData: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

      if (!userId || !organizationId) {
         throw new Error("User or organization not found");
      }

      const db = resolvedCtx.db;

      // Fetch all user data in parallel
      const [
         userProfile,
         categories,
         bankAccounts,
         transactions,
         bills,
         budgets,
         tags,
         costCenters,
         counterparties,
         automations,
         customReports,
         notificationPreferences,
      ] = await Promise.all([
         // User profile
         db.query.user.findFirst({
            where: (user, { eq }) => eq(user.id, userId),
            columns: {
               id: true,
               name: true,
               email: true,
               emailVerified: true,
               image: true,
               createdAt: true,
               updatedAt: true,
            },
         }),

         // Categories
         db.query.category.findMany({
            where: (category, { eq }) => eq(category.organizationId, organizationId),
         }),

         // Bank accounts
         db.query.bankAccount.findMany({
            where: (account, { eq }) => eq(account.organizationId, organizationId),
         }),

         // Transactions with related data
         db.query.transaction.findMany({
            where: (transaction, { eq }) => eq(transaction.organizationId, organizationId),
            with: {
               bankAccount: true,
               costCenter: true,
               transactionCategories: true,
               transactionTags: true,
            },
         }),

         // Bills with related data
         db.query.bill.findMany({
            where: (bill, { eq }) => eq(bill.organizationId, organizationId),
            with: {
               bankAccount: true,
               counterparty: true,
            },
         }),

         // Budgets with periods
         db.query.budget.findMany({
            where: (budget, { eq }) => eq(budget.organizationId, organizationId),
            with: {
               periods: true,
            },
         }),

         // Tags
         db.query.tag.findMany({
            where: (tag, { eq }) => eq(tag.organizationId, organizationId),
         }),

         // Cost centers
         db.query.costCenter.findMany({
            where: (costCenter, { eq }) => eq(costCenter.organizationId, organizationId),
         }),

         // Counterparties
         db.query.counterparty.findMany({
            where: (counterparty, { eq }) => eq(counterparty.organizationId, organizationId),
         }),

         // Automation rules
         db.query.automationRule.findMany({
            where: (rule, { eq }) => eq(rule.organizationId, organizationId),
         }),

         // Custom reports
         db.query.customReport.findMany({
            where: (report, { eq }) => eq(report.organizationId, organizationId),
         }),

         // Notification preferences
         db.query.notificationPreference.findFirst({
            where: (prefs, { eq }) => eq(prefs.userId, userId),
         }),
      ]);

      return {
         exportedAt: new Date().toISOString(),
         version: "1.0",
         user: userProfile,
         data: {
            categories,
            bankAccounts,
            transactions,
            bills,
            budgets,
            tags,
            costCenters,
            counterparties,
            automations,
            customReports,
            notificationPreferences,
         },
      };
   }),
});
