import { relations } from "drizzle-orm";
import { decimal, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bankAccount } from "./bank-accounts";

export const transaction = pgTable("transaction", {
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   bankAccountId: text("bank_account_id").references(() => bankAccount.id, {
      onDelete: "cascade",
   }),
   categoryIds: text("category_ids").array().notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   date: timestamp("date").notNull(),
   description: text("description").notNull(),
   externalId: text("external_id"),
   id: text("id").primaryKey(),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
   userId: uuid("user_id").notNull(),
});

export const transactionRelations = relations(transaction, ({ one }) => ({
   bankAccount: one(bankAccount, {
      fields: [transaction.bankAccountId],
      references: [bankAccount.id],
   }),
}));
