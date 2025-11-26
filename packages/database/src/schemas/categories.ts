import { relations, sql } from "drizzle-orm";
import {
   pgTable,
   primaryKey,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { transaction } from "./transactions";

export const category = pgTable("category", {
   color: text("color").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   icon: text("icon").default("Wallet"),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   name: text("name").notNull(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const transactionCategory = pgTable(
   "transaction_category",
   {
      categoryId: uuid("category_id")
         .notNull()
         .references(() => category.id, { onDelete: "cascade" }),
      transactionId: uuid("transaction_id")
         .notNull()
         .references(() => transaction.id, { onDelete: "cascade" }),
   },
   (table) => ({
      pk: primaryKey({ columns: [table.transactionId, table.categoryId] }),
   }),
);

export const categoryRelations = relations(category, ({ one, many }) => ({
   organization: one(organization, {
      fields: [category.organizationId],
      references: [organization.id],
   }),
   transactionCategories: many(transactionCategory),
}));

export const transactionCategoryRelations = relations(
   transactionCategory,
   ({ one }) => ({
      category: one(category, {
         fields: [transactionCategory.categoryId],
         references: [category.id],
      }),
      transaction: one(transaction, {
         fields: [transactionCategory.transactionId],
         references: [transaction.id],
      }),
   }),
);
