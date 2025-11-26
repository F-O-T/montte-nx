import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { transaction } from "./transactions";

export const costCenter = pgTable("cost_center", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   name: text("name").notNull(),
   code: text("code"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const costCenterRelations = relations(costCenter, ({ one, many }) => ({
   organization: one(organization, {
      fields: [costCenter.organizationId],
      references: [organization.id],
   }),
   transactions: many(transaction),
}));
