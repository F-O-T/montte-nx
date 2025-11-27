import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
export const bankAccountTypes = pgEnum("bank_account_type", [
   "checking",
   "savings",
   "investment",
]);
export const bankAccountStatus = pgEnum("bank_account_status", [
   "active",
   "inactive",
]);
export const bankAccount = pgTable("bank_account", {
   bank: text("bank").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   name: text("name").notNull(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   status: bankAccountStatus("status").default("active").notNull(),
   type: bankAccountTypes("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
});

export const bankAccountRelations = relations(bankAccount, ({ one }) => ({
   organization: one(organization, {
      fields: [bankAccount.organizationId],
      references: [organization.id],
   }),
}));
