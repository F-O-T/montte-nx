import { relations, sql } from "drizzle-orm";
import {
   boolean,
   decimal,
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { bankAccount } from "./bank-accounts";
import { counterparty } from "./counterparties";
import { interestTemplate } from "./interest-templates";
import { transaction } from "./transactions";

export const bill = pgTable("bill", {
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   bankAccountId: uuid("bank_account_id").references(() => bankAccount.id, {
      onDelete: "set null",
   }),
   categoryId: text("category_id"),
   completionDate: timestamp("completion_date"),
   counterpartyId: uuid("counterparty_id"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   description: text("description").notNull(),
   dueDate: timestamp("due_date").notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   interestTemplateId: uuid("interest_template_id"),
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
   installmentGroupId: uuid("installment_group_id"),
   installmentNumber: integer("installment_number"),
   totalInstallments: integer("total_installments"),
   installmentIntervalDays: integer("installment_interval_days"),
   originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
   appliedPenalty: decimal("applied_penalty", {
      precision: 10,
      scale: 2,
   }).default("0"),
   appliedInterest: decimal("applied_interest", {
      precision: 10,
      scale: 2,
   }).default("0"),
   appliedCorrection: decimal("applied_correction", {
      precision: 10,
      scale: 2,
   }).default("0"),
   lastInterestUpdate: timestamp("last_interest_update"),
   autoCreateNext: boolean("auto_create_next").default(true),
});

export const billAttachment = pgTable("bill_attachment", {
   contentType: text("content_type").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   fileName: text("file_name").notNull(),
   fileSize: integer("file_size"),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   storageKey: text("storage_key").notNull(),
   billId: uuid("bill_id")
      .notNull()
      .references(() => bill.id, { onDelete: "cascade" }),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const billAttachmentRelations = relations(billAttachment, ({ one }) => ({
   bill: one(bill, {
      fields: [billAttachment.billId],
      references: [bill.id],
   }),
}));

export const billRelations = relations(bill, ({ one, many }) => ({
   attachments: many(billAttachment),
   bankAccount: one(bankAccount, {
      fields: [bill.bankAccountId],
      references: [bankAccount.id],
   }),
   counterparty: one(counterparty, {
      fields: [bill.counterpartyId],
      references: [counterparty.id],
   }),
   interestTemplate: one(interestTemplate, {
      fields: [bill.interestTemplateId],
      references: [interestTemplate.id],
   }),
   transaction: one(transaction, {
      fields: [bill.transactionId],
      references: [transaction.id],
   }),
}));
