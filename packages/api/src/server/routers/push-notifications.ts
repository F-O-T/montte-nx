import {
   createPushSubscription,
   deletePushSubscriptionByUserAndEndpoint,
   findPushSubscriptionsByUserId,
} from "@packages/database/repositories/push-subscription-repository";
import {
   getOrCreateNotificationPreferences,
   updateNotificationPreferences,
} from "@packages/database/repositories/notification-preferences-repository";
import {
   sendPushNotificationToUser,
   createNotificationPayload,
} from "../services/push-notification-service";
import { checkBillReminders } from "../services/bill-reminder-service";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const pushSubscriptionSchema = z.object({
   endpoint: z.string().url(),
   keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
   }),
   userAgent: z.string().optional(),
});

export const pushNotificationRouter = router({
   getVapidPublicKey: publicProcedure.query(async () => {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
         return { enabled: false, vapidPublicKey: null };
      }
      return { enabled: true, vapidPublicKey };
   }),

   subscribe: protectedProcedure
      .input(pushSubscriptionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw new Error("Unauthorized");
         }

         const subscription = await createPushSubscription(resolvedCtx.db, {
            userId,
            endpoint: input.endpoint,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            userAgent: input.userAgent,
         });

         return { success: true, subscriptionId: subscription.id };
      }),

   unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw new Error("Unauthorized");
         }

         await deletePushSubscriptionByUserAndEndpoint(
            resolvedCtx.db,
            userId,
            input.endpoint,
         );

         return { success: true };
      }),

   listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;

      if (!userId) {
         throw new Error("Unauthorized");
      }

      const subscriptions = await findPushSubscriptionsByUserId(
         resolvedCtx.db,
         userId,
      );

      return subscriptions.map((sub) => ({
         id: sub.id,
         endpoint: sub.endpoint,
         userAgent: sub.userAgent,
         createdAt: sub.createdAt,
      }));
   }),

   getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;

      if (!userId) {
         throw new Error("Unauthorized");
      }

      const preferences = await getOrCreateNotificationPreferences(
         resolvedCtx.db,
         userId,
      );

      return {
         budgetAlerts: preferences.budgetAlerts,
         billReminders: preferences.billReminders,
         overdueAlerts: preferences.overdueAlerts,
         transactionAlerts: preferences.transactionAlerts,
      };
   }),

   updatePreferences: protectedProcedure
      .input(
         z.object({
            budgetAlerts: z.boolean().optional(),
            billReminders: z.boolean().optional(),
            overdueAlerts: z.boolean().optional(),
            transactionAlerts: z.boolean().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw new Error("Unauthorized");
         }

         const preferences = await updateNotificationPreferences(
            resolvedCtx.db,
            userId,
            input,
         );

         return {
            budgetAlerts: preferences.budgetAlerts,
            billReminders: preferences.billReminders,
            overdueAlerts: preferences.overdueAlerts,
            transactionAlerts: preferences.transactionAlerts,
         };
      }),

   testNotification: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;

      if (!userId) {
         throw new Error("Unauthorized");
      }

      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject =
         process.env.VAPID_SUBJECT || "mailto:admin@montte.co";

      if (!vapidPublicKey || !vapidPrivateKey) {
         throw new Error("Push notifications not configured");
      }

      const payload = createNotificationPayload("transaction", {
         title: "Teste de Notificação",
         body: "As notificações push estão funcionando corretamente! 🎉",
         url: "/",
      });

      const result = await sendPushNotificationToUser({
         db: resolvedCtx.db,
         userId,
         payload,
         vapidPublicKey,
         vapidPrivateKey,
         vapidSubject,
      });

      if (!result.success && result.sent === 0) {
         throw new Error(
            result.errors[0] ||
               "Nenhum dispositivo cadastrado para notificações",
         );
      }

      return {
         success: result.success,
         sent: result.sent,
         failed: result.failed,
      };
   }),

   checkBillReminders: protectedProcedure
      .input(
         z
            .object({
               reminderDaysBefore: z.number().min(1).max(30).optional(),
            })
            .optional(),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         const organizationId =
            resolvedCtx.session?.session.activeOrganizationId;

         if (!userId || !organizationId) {
            throw new Error("Unauthorized");
         }

         const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
         const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
         const vapidSubject =
            process.env.VAPID_SUBJECT || "mailto:admin@montte.co";

         const results = await checkBillReminders({
            db: resolvedCtx.db,
            organizationId,
            userId,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject,
            reminderDaysBefore: input?.reminderDaysBefore,
         });

         return {
            checked: true,
            results,
         };
      }),
});
