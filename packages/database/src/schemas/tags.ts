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

export const tag = pgTable("tag", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   name: text("name").notNull(),
   color: text("color").notNull(),
   icon: text("icon").default("Tag"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const transactionTag = pgTable(
   "transaction_tag",
   {
      transactionId: uuid("transaction_id")
         .notNull()
         .references(() => transaction.id, { onDelete: "cascade" }),
      tagId: uuid("tag_id")
         .notNull()
         .references(() => tag.id, { onDelete: "cascade" }),
   },
   (table) => ({
      pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
   }),
);

export const tagRelations = relations(tag, ({ one, many }) => ({
   organization: one(organization, {
      fields: [tag.organizationId],
      references: [organization.id],
   }),
   transactionTags: many(transactionTag),
}));

export const transactionTagRelations = relations(transactionTag, ({ one }) => ({
   transaction: one(transaction, {
      fields: [transactionTag.transactionId],
      references: [transaction.id],
   }),
   tag: one(tag, {
      fields: [transactionTag.tagId],
      references: [tag.id],
   }),
}));
