import type { DatabaseInstance } from "@packages/database/client";
import { accountDeletionRequest } from "@packages/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const RequestDeletionInput = z.object({
   type: z.enum(["immediate", "grace_period"]),
   password: z.string(),
   reason: z.string().optional(),
});

/**
 * Delete all user data from the database
 * This includes: transactions, bills, budgets, categories, tags,
 * bank accounts, cost centers, counterparties, notifications,
 * custom reports, organizations (if owner), memberships, sessions,
 * API keys, accounts, and finally the user record
 */
async function deleteAllUserData(
   db: DatabaseInstance,
   userId: string,
   organizationId: string,
) {
   // Delete organization-scoped data
   const { transaction, bill, budget, category, tag, bankAccount, costCenter, counterparty, customReport, automationRule } = db.query;

   await Promise.all([
      // Delete transactions
      db.delete(db._.schema.transaction!).where(eq(db._.schema.transaction!.organizationId, organizationId)),

      // Delete bills
      db.delete(db._.schema.bill!).where(eq(db._.schema.bill!.organizationId, organizationId)),

      // Delete budgets (budget periods will cascade)
      db.delete(db._.schema.budget!).where(eq(db._.schema.budget!.organizationId, organizationId)),

      // Delete categories
      db.delete(db._.schema.category!).where(eq(db._.schema.category!.organizationId, organizationId)),

      // Delete tags
      db.delete(db._.schema.tag!).where(eq(db._.schema.tag!.organizationId, organizationId)),

      // Delete bank accounts
      db.delete(db._.schema.bankAccount!).where(eq(db._.schema.bankAccount!.organizationId, organizationId)),

      // Delete cost centers
      db.delete(db._.schema.costCenter!).where(eq(db._.schema.costCenter!.organizationId, organizationId)),

      // Delete counterparties
      db.delete(db._.schema.counterparty!).where(eq(db._.schema.counterparty!.organizationId, organizationId)),

      // Delete automation rules
      db.delete(db._.schema.automationRule!).where(eq(db._.schema.automationRule!.organizationId, organizationId)),

      // Delete custom reports
      db.delete(db._.schema.customReport!).where(eq(db._.schema.customReport!.organizationId, organizationId)),

      // Delete notification preferences
      db.delete(db._.schema.notificationPreference!).where(eq(db._.schema.notificationPreference!.userId, userId)),

      // Delete notifications
      db.delete(db._.schema.notification!).where(eq(db._.schema.notification!.userId, userId)),
   ]);

   // Delete organization membership
   await db.delete(db._.schema.member!).where(eq(db._.schema.member!.userId, userId));

   // Delete organization if user is the only member
   const members = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, organizationId),
   });

   if (members.length === 0) {
      await db.delete(db._.schema.organization!).where(eq(db._.schema.organization!.id, organizationId));
   }

   // Delete user-specific data (sessions, accounts, etc will cascade via onDelete: "cascade")
}

export const accountDeletionRouter = router({
   /**
    * Get deletion status for current user
    */
   getDeletionStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw new Error("User not found");
      }

      const deletionRequest = await resolvedCtx.db.query.accountDeletionRequest.findFirst({
         where: (req, { and, eq }) =>
            and(
               eq(req.userId, userId),
               eq(req.status, "pending"),
            ),
      });

      return deletionRequest;
   }),

   /**
    * Request account deletion
    * Supports both immediate and grace period (30 days) deletion
    */
   requestDeletion: protectedProcedure
      .input(RequestDeletionInput)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;
         const userEmail = resolvedCtx.session?.user?.email;
         const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

         if (!userId || !userEmail || !organizationId) {
            throw new Error("User or organization not found");
         }

         // Verify password first
         try {
            await resolvedCtx.auth.api.signInEmail({
               body: {
                  email: userEmail,
                  password: input.password,
               },
            });
         } catch {
            throw new Error("Invalid password");
         }

         if (input.type === "immediate") {
            // Delete all user data immediately
            await deleteAllUserData(resolvedCtx.db, userId, organizationId);

            // Delete user account via Better Auth (this will cascade delete sessions, accounts, etc.)
            await resolvedCtx.auth.api.deleteUser({
               headers: resolvedCtx.headers,
            });

            // Create deletion record for audit purposes
            await resolvedCtx.db.insert(accountDeletionRequest).values({
               userId,
               type: "immediate",
               reason: input.reason,
               requestedAt: new Date(),
               completedAt: new Date(),
               status: "completed",
            });

            return { success: true, type: "immediate" };
         } else {
            // Grace period deletion - schedule for 30 days from now
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 30);

            await resolvedCtx.db.insert(accountDeletionRequest).values({
               userId,
               type: "grace_period",
               reason: input.reason,
               requestedAt: new Date(),
               scheduledDeletionAt: scheduledDate,
               status: "pending",
            });

            // TODO: Send confirmation email
            // await sendDeletionScheduledEmail(resendClient, {
            //    email: userEmail,
            //    scheduledDate,
            // });

            return {
               success: true,
               type: "grace_period",
               scheduledDeletionAt: scheduledDate,
            };
         }
      }),

   /**
    * Cancel a scheduled deletion
    */
   cancelDeletion: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw new Error("User not found");
      }

      const deletionRequest = await resolvedCtx.db.query.accountDeletionRequest.findFirst({
         where: (req, { and, eq }) =>
            and(
               eq(req.userId, userId),
               eq(req.status, "pending"),
            ),
      });

      if (!deletionRequest) {
         throw new Error("No pending deletion request found");
      }

      if (deletionRequest.type === "immediate") {
         throw new Error("Cannot cancel immediate deletion");
      }

      await resolvedCtx.db
         .update(accountDeletionRequest)
         .set({
            status: "cancelled",
            cancelledAt: new Date(),
         })
         .where(eq(accountDeletionRequest.id, deletionRequest.id));

      return { success: true };
   }),
});
