import { sql } from "drizzle-orm";
import {
   boolean,
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";

export const plan = pgTable("plan", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   description: text("description").notNull(),
   displayName: text("display_name").notNull(),
   features: jsonb("features").$type<string[]>().notNull().default([]),
   freeTrialDays: integer("free_trial_days"),
   highlighted: boolean("highlighted").default(false).notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   isActive: boolean("is_active").default(true).notNull(),
   name: text("name").notNull().unique(),
   priceAnnualLabel: text("price_annual_label").notNull(),
   priceMonthlyLabel: text("price_monthly_label").notNull(),
   sortOrder: integer("sort_order").default(0).notNull(),
   stripeAnnualPriceId: text("stripe_annual_price_id").notNull(),
   stripeMonthlyPriceId: text("stripe_monthly_price_id").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});
