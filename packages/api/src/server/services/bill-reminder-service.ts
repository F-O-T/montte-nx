import type { DatabaseInstance } from "@packages/database/client";
import {
   findOverdueBillsByUserId,
   findPendingBillsByUserId,
} from "@packages/database/repositories/bill-repository";
import { shouldSendNotification } from "@packages/database/repositories/notification-preferences-repository";
import {
   createNotificationPayload,
   sendPushNotificationToUser,
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
      currency: "BRL",
      style: "currency",
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
            body:
               upcomingBills.length === 1
                  ? `${upcomingBills[0]?.description || "Conta"} vence em breve - ${formatCurrency(totalAmount)}`
                  : `${upcomingBills.length} contas vencem nos próximos ${reminderDaysBefore} dias - Total: ${formatCurrency(totalAmount)}`,
            metadata: {
               billIds: upcomingBills.map((b) => b.id),
               count: upcomingBills.length,
               totalAmount,
            },
            title: "Contas a Vencer",
            url: "/bills?filter=pending",
         });

         const result = await sendPushNotificationToUser({
            db,
            payload,
            userId,
            vapidPrivateKey,
            vapidPublicKey,
            vapidSubject: vapidSubject || "mailto:admin@montte.co",
         });

         results.push({
            billsCount: upcomingBills.length,
            notificationSent: result.success,
            totalAmount,
            type: "upcoming",
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
            body:
               overdueBills.length === 1
                  ? `${overdueBills[0]?.description || "Conta"} está vencida - ${formatCurrency(totalAmount)}`
                  : `${overdueBills.length} contas estão vencidas - Total: ${formatCurrency(totalAmount)}`,
            metadata: {
               billIds: overdueBills.map((b) => b.id),
               count: overdueBills.length,
               totalAmount,
            },
            title: "Contas Vencidas",
            url: "/bills?filter=overdue",
         });

         const result = await sendPushNotificationToUser({
            db,
            payload,
            userId,
            vapidPrivateKey,
            vapidPublicKey,
            vapidSubject: vapidSubject || "mailto:admin@montte.co",
         });

         results.push({
            billsCount: overdueBills.length,
            notificationSent: result.success,
            totalAmount,
            type: "overdue",
         });
      }
   }

   return results;
}
