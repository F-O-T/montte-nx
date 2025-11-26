import { relations, sql } from "drizzle-orm";
import { decimal, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { bankAccount } from "./bank-accounts";
import { transactionCategory } from "./categories";
import { costCenter } from "./cost-centers";
import { transactionTag } from "./tags";

export const transaction = pgTable("transaction", {
   amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
   bankAccountId: uuid("bank_account_id").references(() => bankAccount.id, {
      onDelete: "cascade",
   }),
   costCenterId: uuid("cost_center_id").references(() => costCenter.id, {
      onDelete: "set null",
   }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   date: timestamp("date").notNull(),
   description: text("description").notNull(),
   externalId: text("external_id"),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const transactionRelations = relations(transaction, ({ one, many }) => ({
   bankAccount: one(bankAccount, {
      fields: [transaction.bankAccountId],
      references: [bankAccount.id],
   }),
   costCenter: one(costCenter, {
      fields: [transaction.costCenterId],
      references: [costCenter.id],
   }),
   organization: one(organization, {
      fields: [transaction.organizationId],
      references: [organization.id],
   }),
   transactionCategories: many(transactionCategory),
   transactionTags: many(transactionTag),
}));
