import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const bankAccount = pgTable("bank_account", {
   bank: text("bank").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   id: text("id").primaryKey(),
   name: text("name").notNull(),
   status: text("status").notNull().default("active"),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const bankAccountRelations = relations(bankAccount, ({ one }) => ({
   user: one(user, {
      fields: [bankAccount.userId],
      references: [user.id],
   }),
}));
