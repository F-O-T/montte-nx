import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const accountDeletionRequest = pgTable(
   "account_deletion_request",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      type: text("type").notNull(), // "immediate" | "grace_period"
      reason: text("reason"),
      requestedAt: timestamp("requested_at").defaultNow().notNull(),
      scheduledDeletionAt: timestamp("scheduled_deletion_at"),
      cancelledAt: timestamp("cancelled_at"),
      completedAt: timestamp("completed_at"),
      status: text("status").default("pending").notNull(), // "pending" | "cancelled" | "completed"
   },
   (table) => [index("accountDeletion_userId_idx").on(table.userId)],
);
