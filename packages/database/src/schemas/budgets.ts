import { relations, sql } from "drizzle-orm";
import {
   boolean,
   decimal,
   jsonb,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const budgetPeriodTypeEnum = pgEnum("budget_period_type", [
   "daily",
   "weekly",
   "monthly",
   "quarterly",
   "yearly",
   "custom",
]);

export const budgetTargetTypeEnum = pgEnum("budget_target_type", [
   "category",
   "categories",
   "tag",
   "cost_center",
]);

export const budgetRegimeEnum = pgEnum("budget_regime", ["cash", "accrual"]);

export const budgetModeEnum = pgEnum("budget_mode", ["personal", "business"]);

export type BudgetTarget =
   | { type: "category"; categoryId: string }
   | { type: "categories"; categoryIds: string[] }
   | { type: "tag"; tagId: string }
   | { type: "cost_center"; costCenterId: string };

export type AlertThreshold = {
   percentage: number;
   notified: boolean;
   notifiedAt?: Date;
};

export type BudgetAlertConfig = {
   enabled: boolean;
   thresholds: AlertThreshold[];
};

export type ShadowBudgetConfig = {
   enabled: boolean;
   visibleLimit: number;
   internalLimit: number;
};

export const budget = pgTable("budget", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

   name: text("name").notNull(),
   description: text("description"),
   color: text("color").default("#3B82F6"),
   icon: text("icon").default("Wallet"),

   amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),

   target: jsonb("target").$type<BudgetTarget>().notNull(),

   periodType: budgetPeriodTypeEnum("period_type").default("monthly").notNull(),
   periodStartDay: decimal("period_start_day", {
      precision: 2,
      scale: 0,
   }).default("1"),
   customPeriodStart: timestamp("custom_period_start"),
   customPeriodEnd: timestamp("custom_period_end"),

   rollover: boolean("rollover").default(false).notNull(),
   rolloverCap: decimal("rollover_cap", { precision: 12, scale: 2 }),

   regime: budgetRegimeEnum("regime").default("cash").notNull(),

   mode: budgetModeEnum("mode").default("personal").notNull(),

   alertConfig: jsonb("alert_config")
      .$type<BudgetAlertConfig>()
      .default({
         enabled: true,
         thresholds: [
            { percentage: 50, notified: false },
            { percentage: 80, notified: false },
            { percentage: 100, notified: false },
         ],
      }),

   shadowBudget: jsonb("shadow_budget").$type<ShadowBudgetConfig>(),

   blockOnExceed: boolean("block_on_exceed").default(false).notNull(),

   isActive: boolean("is_active").default(true).notNull(),

   startDate: timestamp("start_date"),
   endDate: timestamp("end_date"),
});

export const budgetPeriod = pgTable("budget_period", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

   budgetId: uuid("budget_id")
      .notNull()
      .references(() => budget.id, { onDelete: "cascade" }),

   periodStart: timestamp("period_start").notNull(),
   periodEnd: timestamp("period_end").notNull(),

   baseAmount: decimal("base_amount", { precision: 12, scale: 2 }).notNull(),
   rolloverAmount: decimal("rollover_amount", {
      precision: 12,
      scale: 2,
   }).default("0"),
   totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),

   spentAmount: decimal("spent_amount", { precision: 12, scale: 2 }).default(
      "0",
   ),
   scheduledAmount: decimal("scheduled_amount", {
      precision: 12,
      scale: 2,
   }).default("0"),

   isClosed: boolean("is_closed").default(false).notNull(),
   closedAt: timestamp("closed_at"),
});

export const budgetRelations = relations(budget, ({ one, many }) => ({
   organization: one(organization, {
      fields: [budget.organizationId],
      references: [organization.id],
   }),
   periods: many(budgetPeriod),
}));

export const budgetPeriodRelations = relations(budgetPeriod, ({ one }) => ({
   budget: one(budget, {
      fields: [budgetPeriod.budgetId],
      references: [budget.id],
   }),
}));
