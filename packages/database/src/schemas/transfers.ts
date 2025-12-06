import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { bankAccount } from "./bank-accounts";
import { transaction } from "./transactions";

export const transferLog = pgTable("transfer_log", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   fromBankAccountId: uuid("from_bank_account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
   fromTransactionId: uuid("from_transaction_id")
      .notNull()
      .references(() => transaction.id, { onDelete: "cascade" }),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   notes: text("notes"),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   toBankAccountId: uuid("to_bank_account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
   toTransactionId: uuid("to_transaction_id")
      .notNull()
      .references(() => transaction.id, { onDelete: "cascade" }),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const transferLogRelations = relations(transferLog, ({ one }) => ({
   fromBankAccount: one(bankAccount, {
      fields: [transferLog.fromBankAccountId],
      references: [bankAccount.id],
      relationName: "fromBankAccount",
   }),
   fromTransaction: one(transaction, {
      fields: [transferLog.fromTransactionId],
      references: [transaction.id],
      relationName: "fromTransaction",
   }),
   organization: one(organization, {
      fields: [transferLog.organizationId],
      references: [organization.id],
   }),
   toBankAccount: one(bankAccount, {
      fields: [transferLog.toBankAccountId],
      references: [bankAccount.id],
      relationName: "toBankAccount",
   }),
   toTransaction: one(transaction, {
      fields: [transferLog.toTransactionId],
      references: [transaction.id],
      relationName: "toTransaction",
   }),
}));
