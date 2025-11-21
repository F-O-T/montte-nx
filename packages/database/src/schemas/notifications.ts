import { boolean, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notification = pgTable("notification", {
   id: text("id").primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   title: text("title").notNull(),
   message: text("message").notNull(),
   isRead: boolean("is_read").default(false).notNull(),
   type: text("type").notNull(), // e.g. 'budget_alert'
   metadata: json("metadata"), // e.g. { categoryId: '...', spent: 100, budget: 100 }
   createdAt: timestamp("created_at").defaultNow().notNull(),
});
