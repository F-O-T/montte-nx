import {
   isConditionGroup,
   type ArrayOperator as LibArrayOperator,
   type BooleanOperator as LibBooleanOperator,
   type Condition as LibCondition,
   type ConditionGroup as LibConditionGroup,
   type ConditionGroupInput as LibConditionGroupInput,
   type DateOperator as LibDateOperator,
   type EvaluationContext as LibEvaluationContext,
   type EvaluationResult as LibEvaluationResult,
   type GroupEvaluationResult as LibGroupEvaluationResult,
   type GroupEvaluationResultInput as LibGroupEvaluationResultInput,
   type LogicalOperator as LibLogicalOperator,
   type NumberOperator as LibNumberOperator,
   type StringOperator as LibStringOperator,
} from "@f-o-t/condition-evaluator";
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

export type StringOperator = LibStringOperator;
export type NumberOperator = LibNumberOperator;
export type BooleanOperator = LibBooleanOperator;
export type DateOperator = LibDateOperator;
export type ArrayOperator = LibArrayOperator;
export type LogicalOperator = LibLogicalOperator;
export type Condition = LibCondition;
export type ConditionGroup = LibConditionGroup;
export type ConditionGroupInput = LibConditionGroupInput;
export type EvaluationContext = LibEvaluationContext;
export type EvaluationResult = LibEvaluationResult;
export type GroupEvaluationResult = LibGroupEvaluationResult;
export type GroupEvaluationResultInput = LibGroupEvaluationResultInput;

export { isConditionGroup };

export type ConditionOperator =
   | StringOperator
   | NumberOperator
   | BooleanOperator
   | DateOperator
   | ArrayOperator;

export type ConditionType =
   | "string"
   | "number"
   | "boolean"
   | "date"
   | "array"
   | "custom";

export type TriggerType = "transaction.created" | "transaction.updated";

export type TriggerConfig = Record<string, never>;

export type ActionType =
   | "set_category"
   | "add_tag"
   | "remove_tag"
   | "set_cost_center"
   | "update_description"
   | "create_transaction"
   | "mark_as_transfer"
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
   toBankAccountId?: string;
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
      category: text("category"),
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
      metadata: jsonb("metadata")
         .$type<Record<string, unknown>>()
         .notNull()
         .default({}),
      name: text("name").notNull(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      priority: integer("priority").notNull().default(0),
      stopOnFirstMatch: boolean("stop_on_first_match").default(false),
      tags: text("tags").array().notNull().default([]),
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
      index("idx_automation_rule_category").on(table.category),
   ],
);

export type AutomationLogStatus = "success" | "partial" | "failed" | "skipped";
export type TriggeredBy = "event" | "manual";
export type RelatedEntityType = "transaction";
export type RuleChangeType = "created" | "updated" | "restored" | "deleted";

export type ConditionEvaluationLogResult = {
   conditionId: string;
   passed: boolean;
   actualValue?: unknown;
   expectedValue?: unknown;
};

export type ActionExecutionLogResult = {
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
         jsonb("actions_executed").$type<ActionExecutionLogResult[]>(),
      completedAt: timestamp("completed_at"),
      conditionsEvaluated: jsonb("conditions_evaluated").$type<
         ConditionEvaluationLogResult[]
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
      versions: many(automationRuleVersion),
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

export type AutomationRuleVersionSnapshot = {
   id: string;
   name: string;
   description?: string | null;
   triggerType: TriggerType;
   triggerConfig: TriggerConfig;
   conditions: ConditionGroup[];
   actions: Action[];
   flowData?: FlowData | null;
   isActive: boolean;
   priority: number;
   stopOnFirstMatch?: boolean | null;
   tags: string[];
   category?: string | null;
   metadata: Record<string, unknown>;
};

export type AutomationRuleVersionDiff = {
   field: string;
   oldValue: unknown;
   newValue: unknown;
}[];

export const automationRuleVersion = pgTable(
   "automation_rule_version",
   {
      changeDescription: text("change_description"),
      changedAt: timestamp("changed_at").defaultNow().notNull(),
      changedBy: uuid("changed_by").references(() => user.id),
      changeType: text("change_type").$type<RuleChangeType>().notNull(),
      diff: jsonb("diff").$type<AutomationRuleVersionDiff>(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      ruleId: uuid("rule_id")
         .notNull()
         .references(() => automationRule.id, { onDelete: "cascade" }),
      snapshot: jsonb("snapshot")
         .$type<AutomationRuleVersionSnapshot>()
         .notNull(),
      version: integer("version").notNull(),
   },
   (table) => [
      index("idx_automation_rule_version_rule").on(table.ruleId),
      unique("automation_rule_version_rule_version_unique").on(
         table.ruleId,
         table.version,
      ),
   ],
);

export const automationRuleVersionRelations = relations(
   automationRuleVersion,
   ({ one }) => ({
      changedByUser: one(user, {
         fields: [automationRuleVersion.changedBy],
         references: [user.id],
      }),
      rule: one(automationRule, {
         fields: [automationRuleVersion.ruleId],
         references: [automationRule.id],
      }),
   }),
);
