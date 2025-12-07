import type {
   Action,
   ConditionGroup,
   FlowData,
   GroupEvaluationResult,
   TriggerConfig,
   TriggerType,
} from "@packages/database/schema";
import type { ActionExecutionResult } from "./actions";
import type { AutomationEvent } from "./events";

export type { FlowData, TriggerConfig, TriggerType };

export type AutomationRule = {
   id: string;
   organizationId: string;
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
   createdAt: Date;
   updatedAt: Date;
   createdBy?: string | null;
};

export type RuleEvaluationInput = {
   rule: AutomationRule;
   event: AutomationEvent;
};

export type RuleEvaluationStatus =
   | "success"
   | "partial"
   | "failed"
   | "skipped"
   | "stopped";

export type RuleEvaluationResult = {
   ruleId: string;
   ruleName: string;
   status: RuleEvaluationStatus;
   conditionsResult?: GroupEvaluationResult[];
   conditionsPassed: boolean;
   actionsResults: ActionExecutionResult[];
   startedAt: Date;
   completedAt: Date;
   durationMs: number;
   error?: string;
   stoppedByAction?: boolean;
};

export type RuleExecutionContext = {
   organizationId: string;
   event: AutomationEvent;
   dryRun?: boolean;
   triggeredBy?: "event" | "manual";
};

export type RuleExecutionResult = {
   eventId: string;
   eventType: string;
   organizationId: string;
   rulesEvaluated: number;
   rulesMatched: number;
   rulesExecuted: number;
   rulesFailed: number;
   results: RuleEvaluationResult[];
   startedAt: Date;
   completedAt: Date;
   totalDurationMs: number;
   stoppedEarly: boolean;
   stoppedByRule?: string;
};

export type TriggerDefinition = {
   type: TriggerType;
   label: string;
   description: string;
   category: "transaction";
   configSchema: TriggerConfigField[];
};

export type TriggerConfigField = {
   key: keyof TriggerConfig;
   label: string;
   type: "string" | "select" | "multiselect";
   required?: boolean;
   options?: { value: string; label: string }[];
   placeholder?: string;
   helpText?: string;
   dependsOn?: {
      field: keyof TriggerConfig;
      value: unknown;
   };
};

export const TRIGGER_DEFINITIONS: TriggerDefinition[] = [
   {
      category: "transaction",
      configSchema: [],
      description: "Triggers when a new transaction is created",
      label: "Transaction Created",
      type: "transaction.created",
   },
   {
      category: "transaction",
      configSchema: [],
      description: "Triggers when an existing transaction is modified",
      label: "Transaction Updated",
      type: "transaction.updated",
   },
];

export function getTriggerDefinition(
   type: TriggerType,
): TriggerDefinition | undefined {
   return TRIGGER_DEFINITIONS.find((def) => def.type === type);
}

export function validateRule(rule: Partial<AutomationRule>): string[] {
   const errors: string[] = [];

   if (!rule.name?.trim()) {
      errors.push("Rule name is required");
   }

   if (!rule.triggerType) {
      errors.push("Trigger type is required");
   }

   if (!rule.actions || rule.actions.length === 0) {
      errors.push("At least one action is required");
   }

   const triggerDef = rule.triggerType
      ? getTriggerDefinition(rule.triggerType)
      : undefined;

   if (triggerDef) {
      for (const field of triggerDef.configSchema) {
         if (
            field.required &&
            !rule.triggerConfig?.[field.key as keyof TriggerConfig]
         ) {
            errors.push(`Trigger config field "${field.label}" is required`);
         }
      }
   }

   return errors;
}

export function createEmptyRule(
   organizationId: string,
): Partial<AutomationRule> {
   return {
      actions: [],
      conditions: [],
      description: "",
      isActive: false,
      name: "",
      organizationId,
      priority: 0,
      stopOnFirstMatch: false,
      triggerConfig: {},
      triggerType: "transaction.created",
   };
}
