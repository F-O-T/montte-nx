import type { DatabaseInstance } from "@packages/database/client";
import {
   findOverdueBillsByUserId,
   findPendingBillsByUserId,
} from "@packages/database/repositories/bill-repository";
import { shouldSendNotification } from "@packages/database/repositories/notification-preferences-repository";
import {
   sendPushNotificationToUser,
   createNotificationPayload,
} from "./push-notification-service";

interface BillReminderConfig {
   db: DatabaseInstance;
   organizationId: string;
   userId: string;
   vapidPublicKey?: string;
   vapidPrivateKey?: string;
   vapidSubject?: string;
   reminderDaysBefore?: number;
}

export interface ReminderResult {
   type: "upcoming" | "overdue";
   billsCount: number;
   totalAmount: number;
   notificationSent: boolean;
}

function formatCurrency(amount: number): string {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(amount);
}

export async function checkBillReminders(
   config: BillReminderConfig,
): Promise<ReminderResult[]> {
   const {
      db,
      organizationId,
      userId,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject,
      reminderDaysBefore = 3,
   } = config;

   if (!vapidPublicKey || !vapidPrivateKey) {
      return [];
   }

   const results: ReminderResult[] = [];

   const shouldNotifyReminders = await shouldSendNotification(
      db,
      userId,
      "billReminders",
   );
   const shouldNotifyOverdue = await shouldSendNotification(
      db,
      userId,
      "overdueAlerts",
   );

   if (shouldNotifyReminders) {
      const pendingBills = await findPendingBillsByUserId(db, organizationId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reminderDate = new Date(today);
      reminderDate.setDate(reminderDate.getDate() + reminderDaysBefore);

      const upcomingBills = pendingBills.filter((bill) => {
         const dueDate = new Date(bill.dueDate);
         dueDate.setHours(0, 0, 0, 0);
         return dueDate >= today && dueDate <= reminderDate;
      });

      if (upcomingBills.length > 0) {
         const totalAmount = upcomingBills.reduce(
            (sum, bill) => sum + Math.abs(Number(bill.amount)),
            0,
         );

         const payload = createNotificationPayload("bill_reminder", {
            title: "Contas a Vencer",
            body:
               upcomingBills.length === 1
                  ? `${upcomingBills[0]?.description || "Conta"} vence em breve - ${formatCurrency(totalAmount)}`
                  : `${upcomingBills.length} contas vencem nos próximos ${reminderDaysBefore} dias - Total: ${formatCurrency(totalAmount)}`,
            url: "/bills?filter=pending",
            metadata: {
               billIds: upcomingBills.map((b) => b.id),
               count: upcomingBills.length,
               totalAmount,
            },
         });

         const result = await sendPushNotificationToUser({
            db,
            userId,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject: vapidSubject || "mailto:admin@montte.co",
         });

         results.push({
            type: "upcoming",
            billsCount: upcomingBills.length,
            totalAmount,
            notificationSent: result.success,
         });
      }
   }

   if (shouldNotifyOverdue) {
      const overdueBills = await findOverdueBillsByUserId(db, organizationId);

      if (overdueBills.length > 0) {
         const totalAmount = overdueBills.reduce(
            (sum, bill) => sum + Math.abs(Number(bill.amount)),
            0,
         );

         const payload = createNotificationPayload("overdue_alert", {
            title: "Contas Vencidas",
            body:
               overdueBills.length === 1
                  ? `${overdueBills[0]?.description || "Conta"} está vencida - ${formatCurrency(totalAmount)}`
                  : `${overdueBills.length} contas estão vencidas - Total: ${formatCurrency(totalAmount)}`,
            url: "/bills?filter=overdue",
            metadata: {
               billIds: overdueBills.map((b) => b.id),
               count: overdueBills.length,
               totalAmount,
            },
         });

         const result = await sendPushNotificationToUser({
            db,
            userId,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject: vapidSubject || "mailto:admin@montte.co",
         });

         results.push({
            type: "overdue",
            billsCount: overdueBills.length,
            totalAmount,
            notificationSent: result.success,
         });
      }
   }

   return results;
}
