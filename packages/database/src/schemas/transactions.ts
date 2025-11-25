import { relations, sql } from "drizzle-orm";
import { decimal, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { bankAccount } from "./bank-accounts";

export const transaction = pgTable("transaction", {
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   bankAccountId: uuid("bank_account_id").references(() => bankAccount.id, {
      onDelete: "cascade",
   }),
   categoryIds: uuid("category_ids").array().notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   date: timestamp("date").notNull(),
   description: text("description").notNull(),
   externalId: text("external_id"),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
   userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
});

export const transactionRelations = relations(transaction, ({ one }) => ({
   bankAccount: one(bankAccount, {
      fields: [transaction.bankAccountId],
      references: [bankAccount.id],
   }),
}));
