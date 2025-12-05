import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const pushSubscription = pgTable(
   "push_subscription",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      endpoint: text("endpoint").notNull(),
      p256dh: text("p256dh").notNull(),
      auth: text("auth").notNull(),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
   },
   (table) => [unique("push_subscription_endpoint_idx").on(table.endpoint)],
);
