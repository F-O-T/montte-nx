import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   unique,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export type TriggerType = "transaction.created" | "transaction.updated";

export type TriggerConfig = Record<string, never>;

export type ConditionOperator =
   | "equals"
   | "not_equals"
   | "contains"
   | "not_contains"
   | "starts_with"
   | "ends_with"
   | "regex"
   | "eq"
   | "neq"
   | "gt"
   | "gte"
   | "lt"
   | "lte"
   | "between"
   | "is_weekend"
   | "is_business_day"
   | "day_of_month"
   | "day_of_week"
   | "before"
   | "after"
   | "is_empty"
   | "is_not_empty"
   | "in_list"
   | "not_in_list";

export type Condition = {
   id: string;
   field: string;
   operator: ConditionOperator;
   value: unknown;
   options?: {
      caseSensitive?: boolean;
      negate?: boolean;
   };
};

export type LogicalOperator = "AND" | "OR";

export type ConditionGroup = {
   id: string;
   operator: LogicalOperator;
   conditions: (Condition | ConditionGroup)[];
};

export type ActionType =
   | "set_category"
   | "add_tag"
   | "remove_tag"
   | "set_cost_center"
   | "update_description"
   | "create_transaction"
   | "send_push_notification"
   | "send_email"
   | "stop_execution";

export type ActionConfig = {
   categoryId?: string;
   mode?: "replace" | "append" | "prepend";
   tagIds?: string[];
   costCenterId?: string;
   value?: string;
   template?: boolean;
   type?: "income" | "expense";
   amountField?: string;
   amountFixed?: number;
   description?: string;
   bankAccountId?: string;
   dateField?: string;
   title?: string;
   body?: string;
   url?: string;
   to?: "owner" | "custom";
   customEmail?: string;
   subject?: string;
   reason?: string;
};

export type Action = {
   id: string;
   type: ActionType;
   config: ActionConfig;
   continueOnError?: boolean;
};

export type FlowData = {
   nodes: unknown[];
   edges: unknown[];
   viewport?: {
      x: number;
      y: number;
      zoom: number;
   };
};

export const automationRule = pgTable(
   "automation_rule",
   {
      actions: jsonb("actions").$type<Action[]>().notNull().default([]),
      conditions: jsonb("conditions")
         .$type<ConditionGroup[]>()
         .notNull()
         .default([]),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      createdBy: uuid("created_by").references(() => user.id),
      description: text("description"),
      flowData: jsonb("flow_data").$type<FlowData>(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      isActive: boolean("is_active").notNull().default(true),
      name: text("name").notNull(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      priority: integer("priority").notNull().default(0),
      stopOnFirstMatch: boolean("stop_on_first_match").default(false),
      triggerConfig: jsonb("trigger_config").$type<TriggerConfig>().default({}),
      triggerType: text("trigger_type").$type<TriggerType>().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      unique("automation_rule_name_org_unique").on(
         table.organizationId,
         table.name,
      ),
      index("idx_automation_rule_org_active").on(
         table.organizationId,
         table.isActive,
      ),
      index("idx_automation_rule_trigger").on(
         table.triggerType,
         table.isActive,
      ),
   ],
);

export type AutomationLogStatus = "success" | "partial" | "failed" | "skipped";
export type TriggeredBy = "event" | "manual";
export type RelatedEntityType = "transaction";

export type ConditionEvaluationResult = {
   conditionId: string;
   passed: boolean;
   actualValue?: unknown;
   expectedValue?: unknown;
};

export type ActionExecutionResult = {
   actionId: string;
   type: ActionType;
   success: boolean;
   result?: unknown;
   error?: string;
};

export const automationLog = pgTable(
   "automation_log",
   {
      actionsExecuted:
         jsonb("actions_executed").$type<ActionExecutionResult[]>(),
      completedAt: timestamp("completed_at"),
      conditionsEvaluated: jsonb("conditions_evaluated").$type<
         ConditionEvaluationResult[]
      >(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      durationMs: integer("duration_ms"),
      errorMessage: text("error_message"),
      errorStack: text("error_stack"),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      relatedEntityId: uuid("related_entity_id"),
      relatedEntityType: text("related_entity_type").$type<RelatedEntityType>(),
      ruleId: uuid("rule_id").references(() => automationRule.id, {
         onDelete: "set null",
      }),
      ruleName: text("rule_name").notNull(),
      ruleSnapshot: jsonb("rule_snapshot"),
      startedAt: timestamp("started_at").notNull(),
      status: text("status").$type<AutomationLogStatus>().notNull(),
      triggerEvent: jsonb("trigger_event").notNull(),
      triggeredBy: text("triggered_by").$type<TriggeredBy>(),
      triggerType: text("trigger_type").$type<TriggerType>().notNull(),
   },
   (table) => [
      index("idx_automation_log_rule").on(table.ruleId),
      index("idx_automation_log_org_created").on(
         table.organizationId,
         table.createdAt,
      ),
      index("idx_automation_log_status").on(table.status),
      index("idx_automation_log_entity").on(
         table.relatedEntityType,
         table.relatedEntityId,
      ),
   ],
);

export const automationRuleRelations = relations(
   automationRule,
   ({ one, many }) => ({
      createdByUser: one(user, {
         fields: [automationRule.createdBy],
         references: [user.id],
      }),
      logs: many(automationLog),
      organization: one(organization, {
         fields: [automationRule.organizationId],
         references: [organization.id],
      }),
   }),
);

export const automationLogRelations = relations(automationLog, ({ one }) => ({
   organization: one(organization, {
      fields: [automationLog.organizationId],
      references: [organization.id],
   }),
   rule: one(automationRule, {
      fields: [automationLog.ruleId],
      references: [automationRule.id],
   }),
}));
