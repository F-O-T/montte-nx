import { relations, sql } from "drizzle-orm";
import {
   boolean,
   decimal,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { bankAccount } from "./bank-accounts";
import { transaction } from "./transactions";

export const bill = pgTable("bill", {
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   bankAccountId: uuid("bank_account_id").references(() => bankAccount.id, {
      onDelete: "set null",
   }),
   categoryId: text("category_id"),
   completionDate: timestamp("completion_date"),
   counterparty: text("counterparty"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   description: text("description").notNull(),
   dueDate: timestamp("due_date").notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   isRecurring: boolean("is_recurring").default(false).notNull(),
   issueDate: timestamp("issue_date"),
   notes: text("notes"),
   parentBillId: uuid("parent_bill_id"),
   recurrencePattern: text("recurrence_pattern"),
   transactionId: uuid("transaction_id").references(() => transaction.id, {
      onDelete: "set null",
   }),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
   userId: uuid("user_id").notNull(),
});

export const billRelations = relations(bill, ({ one }) => ({
   bankAccount: one(bankAccount, {
      fields: [bill.bankAccountId],
      references: [bankAccount.id],
   }),
   transaction: one(transaction, {
      fields: [bill.transactionId],
      references: [transaction.id],
   }),
}));
