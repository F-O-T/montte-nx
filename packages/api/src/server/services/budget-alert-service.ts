import type { DatabaseInstance } from "@packages/database/client";
import {
   getBudgetsWithProgress,
   updateBudget,
} from "@packages/database/repositories/budget-repository";
import { shouldSendNotification } from "@packages/database/repositories/notification-preferences-repository";
import {
   sendPushNotificationToUser,
   createNotificationPayload,
} from "./push-notification-service";

interface BudgetAlertConfig {
   db: DatabaseInstance;
   organizationId: string;
   userId: string;
   vapidPublicKey?: string;
   vapidPrivateKey?: string;
   vapidSubject?: string;
}

interface AlertResult {
   budgetId: string;
   budgetName: string;
   percentage: number;
   threshold: number;
   notificationSent: boolean;
}

export async function checkBudgetAlertsAfterTransaction(
   config: BudgetAlertConfig,
): Promise<AlertResult[]> {
   const {
      db,
      organizationId,
      userId,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject,
   } = config;

   if (!vapidPublicKey || !vapidPrivateKey) {
      return [];
   }

   const shouldNotify = await shouldSendNotification(
      db,
      userId,
      "budgetAlerts",
   );
   if (!shouldNotify) {
      return [];
   }

   const budgets = await getBudgetsWithProgress(db, organizationId);
   const results: AlertResult[] = [];

   for (const budget of budgets) {
      if (!budget.isActive || !budget.alertConfig?.enabled) {
         continue;
      }

      const percentage = budget.progress?.percentage ?? 0;
      const thresholds = budget.alertConfig.thresholds || [];

      for (const threshold of thresholds) {
         if (percentage >= threshold.percentage && !threshold.notified) {
            const payload = createNotificationPayload("budget_alert", {
               title: "Alerta de Orçamento",
               body: `${budget.name} atingiu ${percentage.toFixed(0)}% do limite (${threshold.percentage}% configurado)`,
               url: `/budgets/${budget.id}`,
               metadata: {
                  budgetId: budget.id,
                  percentage,
                  threshold: threshold.percentage,
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

            if (result.success) {
               const updatedThresholds = thresholds.map((t) =>
                  t.percentage === threshold.percentage
                     ? { ...t, notified: true, notifiedAt: new Date() }
                     : t,
               );

               await updateBudget(db, budget.id, {
                  alertConfig: {
                     ...budget.alertConfig,
                     thresholds: updatedThresholds,
                  },
               });
            }

            results.push({
               budgetId: budget.id,
               budgetName: budget.name,
               percentage,
               threshold: threshold.percentage,
               notificationSent: result.success,
            });
         }
      }
   }

   return results;
}

export async function resetBudgetAlertThresholds(
   db: DatabaseInstance,
   budgetId: string,
): Promise<void> {
   const budget = await db.query.budget.findFirst({
      where: (b, { eq }) => eq(b.id, budgetId),
   });

   if (!budget?.alertConfig?.thresholds) {
      return;
   }

   const resetThresholds = budget.alertConfig.thresholds.map((t) => ({
      ...t,
      notified: false,
      notifiedAt: undefined,
   }));

   await updateBudget(db, budgetId, {
      alertConfig: {
         ...budget.alertConfig,
         thresholds: resetThresholds,
      },
   });
}
