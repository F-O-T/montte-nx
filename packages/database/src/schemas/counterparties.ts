import { relations, sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { bill } from "./bills";

export const counterparty = pgTable("counterparty", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   document: text("document"),
   email: text("email"),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   isActive: boolean("is_active").default(true).notNull(),
   name: text("name").notNull(),
   notes: text("notes"),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   phone: text("phone"),
   type: text("type").notNull(), // "client" | "supplier" | "both"
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const counterpartyRelations = relations(
   counterparty,
   ({ one, many }) => ({
      bills: many(bill),
      organization: one(organization, {
         fields: [counterparty.organizationId],
         references: [organization.id],
      }),
   }),
);
