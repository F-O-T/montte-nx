import { decimal, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const transaction = pgTable("transaction", {
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   category: text("category").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   date: timestamp("date").notNull(),
   description: text("description").notNull(),
   id: text("id").primaryKey(),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: text("user_id").notNull(),
});
