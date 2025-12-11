import type {
   Action,
   ActionType,
   automationRule,
   ConditionGroup,
   TriggerConfig,
   TriggerType,
} from "@packages/database/schema";
import type { WorkflowEvent } from "./events";

export type AutomationRule = typeof automationRule.$inferSelect;
export type AutomationRuleInsert = typeof automationRule.$inferInsert;

export type WorkflowRule = {
   id: string;
   name: string;
   description?: string | null;
   organizationId: string;
   triggerType: TriggerType;
   triggerConfig: TriggerConfig;
   conditions: ConditionGroup[];
   actions: Action[];
   isActive: boolean;
   priority: number;
   stopOnFirstMatch?: boolean | null;
   tags: string[];
   category?: string | null;
   metadata: Record<string, unknown>;
   createdAt: Date;
   updatedAt: Date;
   createdBy?: string | null;
};

export type WorkflowRuleInput = {
   name: string;
   description?: string | null;
   organizationId: string;
   triggerType: TriggerType;
   triggerConfig?: TriggerConfig;
   conditions: ConditionGroup[];
   actions: Action[];
   isActive?: boolean;
   priority?: number;
   stopOnFirstMatch?: boolean;
   tags?: string[];
   category?: string;
   metadata?: Record<string, unknown>;
   createdBy?: string;
};

export type WorkflowRuleUpdate = Partial<
   Omit<WorkflowRuleInput, "organizationId">
>;

export type RuleExecutionContext = {
   event: WorkflowEvent;
   rule: WorkflowRule;
   organizationId: string;
   dryRun?: boolean;
   triggeredBy?: "event" | "manual";
};

export type ActionExecutionStatus = "success" | "failed" | "skipped";

export type ExecutedAction = {
   actionId: string;
   type: ActionType;
   status: ActionExecutionStatus;
   result?: unknown;
   error?: string;
   skippedReason?: string;
   durationMs?: number;
};

export type RuleExecutionResult = {
   ruleId: string;
   ruleName: string;
   matched: boolean;
   conditionsPassed: boolean;
   actionsExecuted: ExecutedAction[];
   stopProcessing: boolean;
   durationMs: number;
   error?: string;
};

export type WorkflowExecutionResult = {
   eventId: string;
   eventType: string;
   organizationId: string;
   rulesEvaluated: number;
   rulesMatched: number;
   results: RuleExecutionResult[];
   totalDurationMs: number;
   stoppedEarly: boolean;
   stoppedByRuleId?: string;
};

export function toWorkflowRule(rule: AutomationRule): WorkflowRule {
   return {
      actions: rule.actions,
      category: rule.category,
      conditions: rule.conditions,
      createdAt: rule.createdAt,
      createdBy: rule.createdBy,
      description: rule.description,
      id: rule.id,
      isActive: rule.isActive,
      metadata: rule.metadata,
      name: rule.name,
      organizationId: rule.organizationId,
      priority: rule.priority,
      stopOnFirstMatch: rule.stopOnFirstMatch,
      tags: rule.tags,
      triggerConfig: rule.triggerConfig ?? {},
      triggerType: rule.triggerType,
      updatedAt: rule.updatedAt,
   };
}

export function fromWorkflowRule(rule: WorkflowRule): AutomationRule {
   return {
      actions: rule.actions,
      category: rule.category ?? null,
      conditions: rule.conditions,
      createdAt: rule.createdAt,
      createdBy: rule.createdBy ?? null,
      description: rule.description ?? null,
      flowData: null,
      id: rule.id,
      isActive: rule.isActive,
      metadata: rule.metadata,
      name: rule.name,
      organizationId: rule.organizationId,
      priority: rule.priority,
      stopOnFirstMatch: rule.stopOnFirstMatch ?? null,
      tags: rule.tags,
      triggerConfig: rule.triggerConfig,
      triggerType: rule.triggerType,
      updatedAt: rule.updatedAt,
   };
}
