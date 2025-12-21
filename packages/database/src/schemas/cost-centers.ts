import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { bill } from "./bills";
import { transaction } from "./transactions";

export const costCenter = pgTable("cost_center", {
   code: text("code"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const costCenterRelations = relations(costCenter, ({ one, many }) => ({
   bills: many(bill),
   organization: one(organization, {
      fields: [costCenter.organizationId],
      references: [organization.id],
   }),
   transactions: many(transaction),
}));
