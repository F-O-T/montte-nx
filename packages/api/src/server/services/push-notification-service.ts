import type { DatabaseInstance } from "@packages/database/client";
import {
   deletePushSubscription,
   findPushSubscriptionsByUserId,
} from "@packages/database/repositories/push-subscription-repository";
import webpush from "web-push";

export interface PushNotificationPayload {
   title: string;
   body: string;
   icon?: string;
   badge?: string;
   tag?: string;
   data?: {
      url?: string;
      type?: string;
      [key: string]: unknown;
   };
   requireInteraction?: boolean;
   silent?: boolean;
}

interface SendPushNotificationOptions {
   db: DatabaseInstance;
   userId: string;
   payload: PushNotificationPayload;
   vapidPublicKey: string;
   vapidPrivateKey: string;
   vapidSubject: string;
}

interface SendResult {
   success: boolean;
   sent: number;
   failed: number;
   errors: string[];
}

export async function sendPushNotificationToUser(
   options: SendPushNotificationOptions,
): Promise<SendResult> {
   const {
      db,
      userId,
      payload,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject,
   } = options;

   if (!vapidPublicKey || !vapidPrivateKey) {
      return {
         success: false,
         sent: 0,
         failed: 0,
         errors: ["VAPID keys not configured"],
      };
   }

   webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

   const subscriptions = await findPushSubscriptionsByUserId(db, userId);

   if (subscriptions.length === 0) {
      return {
         success: true,
         sent: 0,
         failed: 0,
         errors: [],
      };
   }

   const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
         const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
               p256dh: sub.p256dh,
               auth: sub.auth,
            },
         };

         try {
            await webpush.sendNotification(
               pushSubscription,
               JSON.stringify(payload),
            );
            return { success: true, endpoint: sub.endpoint };
         } catch (error) {
            const webPushError = error as { statusCode?: number };

            if (
               webPushError.statusCode === 410 ||
               webPushError.statusCode === 404
            ) {
               await deletePushSubscription(db, sub.endpoint);
            }

            throw error;
         }
      }),
   );

   const sent = results.filter((r) => r.status === "fulfilled").length;
   const failed = results.filter((r) => r.status === "rejected").length;
   const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => String(r.reason));

   return {
      success: sent > 0 || (sent === 0 && failed === 0),
      sent,
      failed,
      errors,
   };
}

export function createNotificationPayload(
   type: "budget_alert" | "bill_reminder" | "overdue_alert" | "transaction",
   data: {
      title: string;
      body: string;
      url?: string;
      metadata?: Record<string, unknown>;
   },
): PushNotificationPayload {
   return {
      title: data.title,
      body: data.body,
      icon: "/android/android-launchericon-192-192.png",
      badge: "/android/android-launchericon-96-96.png",
      tag: `montte-${type}-${Date.now()}`,
      data: {
         url: data.url || "/",
         type,
         ...data.metadata,
      },
      requireInteraction: type === "overdue_alert",
      silent: false,
   };
}
