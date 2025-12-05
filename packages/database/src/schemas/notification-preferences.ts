import { sql } from "drizzle-orm";
import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notificationPreference = pgTable("notification_preference", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
   budgetAlerts: boolean("budget_alerts").default(true).notNull(),
   billReminders: boolean("bill_reminders").default(true).notNull(),
   overdueAlerts: boolean("overdue_alerts").default(true).notNull(),
   transactionAlerts: boolean("transaction_alerts").default(false).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
