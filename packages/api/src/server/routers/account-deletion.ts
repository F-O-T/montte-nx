import type { DatabaseInstance } from "@packages/database/client";
import {
   accountDeletionRequest,
   transaction,
   bill,
   budget,
   category,
   tag,
   bankAccount,
   costCenter,
   counterparty,
   automationRule,
   customReport,
   notificationPreference,
   notification,
   member,
   organization,
   interestTemplate,
   transferLog,
   pushSubscription,
} from "@packages/database/schema";
import { sendDeletionScheduledEmail } from "@packages/transactional/client";
import { eq } from "drizzle-orm";
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
   await db.transaction(async (tx) => {
      // Delete organization-scoped data
      await Promise.all([
         tx.delete(transaction).where(eq(transaction.organizationId, organizationId)),
         tx.delete(bill).where(eq(bill.organizationId, organizationId)),
         tx.delete(budget).where(eq(budget.organizationId, organizationId)),
         tx.delete(category).where(eq(category.organizationId, organizationId)),
         tx.delete(tag).where(eq(tag.organizationId, organizationId)),
         tx.delete(bankAccount).where(eq(bankAccount.organizationId, organizationId)),
         tx.delete(costCenter).where(eq(costCenter.organizationId, organizationId)),
         tx.delete(counterparty).where(eq(counterparty.organizationId, organizationId)),
         tx.delete(automationRule).where(eq(automationRule.organizationId, organizationId)),
         tx.delete(customReport).where(eq(customReport.organizationId, organizationId)),
         tx.delete(interestTemplate).where(eq(interestTemplate.organizationId, organizationId)),
         tx.delete(transferLog).where(eq(transferLog.organizationId, organizationId)),
         // Delete user-scoped data
         tx.delete(notificationPreference).where(eq(notificationPreference.userId, userId)),
         tx.delete(notification).where(eq(notification.userId, userId)),
         tx.delete(pushSubscription).where(eq(pushSubscription.userId, userId)),
      ]);

      // Delete organization membership
      await tx.delete(member).where(eq(member.userId, userId));

      // Delete organization if user is the only member
      const members = await tx.query.member.findMany({
         where: (m, { eq }) => eq(m.organizationId, organizationId),
      });

      if (members.length === 0) {
         await tx.delete(organization).where(eq(organization.id, organizationId));
      }
   });

   // User-specific auth data (sessions, accounts, etc) will cascade via onDelete: "cascade"
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
            // Get user's Stripe customer ID from database
            const userRecord = await resolvedCtx.db.query.user.findFirst({
               where: (users, { eq }) => eq(users.id, userId),
            });

            // Cancel any active Stripe subscriptions before deleting
            if (resolvedCtx.stripeClient && userRecord?.stripeCustomerId) {
               try {
                  const subscriptions = await resolvedCtx.stripeClient.subscriptions.list({
                     customer: userRecord.stripeCustomerId,
                     status: "active",
                  });

                  for (const subscription of subscriptions.data) {
                     await resolvedCtx.stripeClient.subscriptions.cancel(subscription.id, {
                        invoice_now: false,
                        prorate: false,
                     });
                  }
               } catch (error) {
                  console.error("Failed to cancel Stripe subscriptions:", error);
                  // Continue with deletion even if Stripe fails
               }
            }

            // Create deletion record BEFORE deleting user (to avoid FK constraint violation)
            await resolvedCtx.db.insert(accountDeletionRequest).values({
               userId,
               type: "immediate",
               reason: input.reason,
               requestedAt: new Date(),
               completedAt: new Date(),
               status: "completed",
            });

            // Delete all user data immediately
            await deleteAllUserData(resolvedCtx.db, userId, organizationId);

            // Delete user account via Better Auth (this will cascade delete sessions, accounts, etc.)
            await resolvedCtx.auth.api.deleteUser({
               headers: resolvedCtx.headers,
               body: {},
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

            // Send confirmation email
            if (resolvedCtx.resendClient) {
               const userName = resolvedCtx.session?.user?.name || "Usuário";
               const formattedDate = scheduledDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
               });

               try {
                  await sendDeletionScheduledEmail(resolvedCtx.resendClient, {
                     email: userEmail,
                     userName,
                     scheduledDate: formattedDate,
                     cancelUrl: `${resolvedCtx.request.headers.get("origin") || "https://app.montte.co"}/settings/profile`,
                  });
               } catch (error) {
                  console.error("Failed to send deletion scheduled email:", error);
                  // Continue even if email fails - deletion is already scheduled
               }
            }

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
