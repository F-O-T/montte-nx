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
import { organization } from "./auth";
import { bill } from "./bills";

export const interestTemplate = pgTable("interest_template", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   gracePeriodDays: integer("grace_period_days").default(0).notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   interestType: text("interest_type").notNull(), // "none" | "daily" | "monthly"
   interestValue: decimal("interest_value", { precision: 10, scale: 4 }),
   isActive: boolean("is_active").default(true).notNull(),
   isDefault: boolean("is_default").default(false).notNull(),
   monetaryCorrectionIndex: text("monetary_correction_index").notNull(), // "none" | "ipca" | "selic" | "cdi"
   name: text("name").notNull(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   penaltyType: text("penalty_type").notNull(), // "none" | "percentage" | "fixed"
   penaltyValue: decimal("penalty_value", { precision: 10, scale: 4 }),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const interestTemplateRelations = relations(
   interestTemplate,
   ({ one, many }) => ({
      bills: many(bill),
      organization: one(organization, {
         fields: [interestTemplate.organizationId],
         references: [organization.id],
      }),
   }),
);
