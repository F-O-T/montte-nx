import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
export const bankAccountTypes = pgEnum("bank_account_type", [
   "checking",
   "savings",
   "investment",
]);
export const bankAccount = pgTable("bank_account", {
   bank: text("bank").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   name: text("name"),
   type: bankAccountTypes("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const bankAccountRelations = relations(bankAccount, ({ one }) => ({
   user: one(user, {
      fields: [bankAccount.userId],
      references: [user.id],
   }),
}));
