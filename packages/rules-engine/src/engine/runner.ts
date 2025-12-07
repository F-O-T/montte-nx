import type { DatabaseInstance } from "@packages/database/client";
import { createAutomationLog } from "@packages/database/repositories/automation-log-repository";
import type {
   AutomationLogStatus,
   RelatedEntityType,
   TriggerType,
} from "@packages/database/schema";
import type {
   ConditionEvaluationResult,
   ConditionGroupEvaluationResult,
} from "../types/conditions";
import type { AutomationEvent } from "../types/events";
import type {
   AutomationRule,
   RuleEvaluationResult,
   RuleEvaluationStatus,
   RuleExecutionContext,
   RuleExecutionResult,
} from "../types/rules";
import { evaluateConditions } from "./evaluator";
import { executeActions } from "./executor";

function mapStatusToLogStatus(
   status: RuleEvaluationStatus,
): AutomationLogStatus {
   switch (status) {
      case "success":
         return "success";
      case "partial":
         return "partial";
      case "failed":
         return "failed";
      case "skipped":
      case "stopped":
      default:
         return "skipped";
   }
}

function flattenConditionResults(
   results: ConditionGroupEvaluationResult[] | undefined,
): {
   conditionId: string;
   passed: boolean;
   actualValue?: unknown;
   expectedValue?: unknown;
}[] {
   if (!results) return [];

   const flattened: {
      conditionId: string;
      passed: boolean;
      actualValue?: unknown;
      expectedValue?: unknown;
   }[] = [];

   function flatten(
      items: (ConditionEvaluationResult | ConditionGroupEvaluationResult)[],
   ) {
      for (const item of items) {
         if ("groupId" in item) {
            flattened.push({
               actualValue: item.operator,
               conditionId: item.groupId,
               passed: item.passed,
            });
            flatten(item.results);
         } else {
            flattened.push({
               actualValue: item.actualValue,
               conditionId: item.conditionId,
               expectedValue: item.expectedValue,
               passed: item.passed,
            });
         }
      }
   }

   flatten(results);
   return flattened;
}

async function saveExecutionLog(
   db: DatabaseInstance,
   rule: AutomationRule,
   event: AutomationEvent,
   result: RuleEvaluationResult,
   context: RuleExecutionContext,
): Promise<void> {
   try {
      const eventData = event.data as Record<string, unknown>;
      const relatedEntityId = eventData.id as string | undefined;
      let relatedEntityType: RelatedEntityType | undefined;

      if (event.type === "webhook.received") {
         relatedEntityType = "webhook";
      } else if (
         event.type === "transaction.created" ||
         event.type === "transaction.updated"
      ) {
         relatedEntityType = "transaction";
      }

      await createAutomationLog(db, {
         actionsExecuted: result.actionsResults,
         completedAt: result.completedAt,
         conditionsEvaluated: flattenConditionResults(result.conditionsResult),
         durationMs: result.durationMs,
         errorMessage: result.error,
         organizationId: context.organizationId,
         relatedEntityId: relatedEntityId,
         relatedEntityType: relatedEntityType,
         ruleId: rule.id,
         ruleName: rule.name,
         ruleSnapshot: rule,
         startedAt: result.startedAt,
         status: mapStatusToLogStatus(result.status),
         triggerEvent: event.data,
         triggeredBy: context.triggeredBy,
         triggerType: event.type as TriggerType,
      });
   } catch (error) {
      console.error("Failed to save automation log:", error);
   }
}

export async function runRule(
   rule: AutomationRule,
   event: AutomationEvent,
   context: RuleExecutionContext,
   db?: DatabaseInstance,
): Promise<RuleEvaluationResult> {
   const startedAt = new Date();

   try {
      const { passed: conditionsPassed, results: conditionsResult } =
         evaluateConditions(rule.conditions, {
            eventData: event.data as Record<string, unknown>,
            organizationId: context.organizationId,
         });

      if (!conditionsPassed) {
         const completedAt = new Date();
         const result: RuleEvaluationResult = {
            actionsResults: [],
            completedAt,
            conditionsPassed: false,
            conditionsResult,
            durationMs: completedAt.getTime() - startedAt.getTime(),
            ruleId: rule.id,
            ruleName: rule.name,
            startedAt,
            status: "skipped",
         };

         if (db && !context.dryRun) {
            await saveExecutionLog(db, rule, event, result, context);
         }

         return result;
      }

      const {
         results: actionsResults,
         stoppedEarly,
         stoppedByAction: _stoppedByAction,
      } = await executeActions(
         rule.actions,
         {
            dryRun: context.dryRun,
            eventData: event.data as Record<string, unknown>,
            organizationId: context.organizationId,
            ruleId: rule.id,
         },
         db,
      );

      const completedAt = new Date();
      const allActionsSucceeded = actionsResults.every((r) => r.success);
      const someActionsSucceeded = actionsResults.some((r) => r.success);

      let status: RuleEvaluationStatus;
      if (stoppedEarly) {
         status = "stopped";
      } else if (allActionsSucceeded) {
         status = "success";
      } else if (someActionsSucceeded) {
         status = "partial";
      } else {
         status = "failed";
      }

      const result: RuleEvaluationResult = {
         actionsResults,
         completedAt,
         conditionsPassed: true,
         conditionsResult,
         durationMs: completedAt.getTime() - startedAt.getTime(),
         ruleId: rule.id,
         ruleName: rule.name,
         startedAt,
         status,
         stoppedByAction: stoppedEarly,
      };

      if (db && !context.dryRun) {
         await saveExecutionLog(db, rule, event, result, context);
      }

      return result;
   } catch (error) {
      const completedAt = new Date();
      const result: RuleEvaluationResult = {
         actionsResults: [],
         completedAt,
         conditionsPassed: false,
         durationMs: completedAt.getTime() - startedAt.getTime(),
         error: error instanceof Error ? error.message : "Unknown error",
         ruleId: rule.id,
         ruleName: rule.name,
         startedAt,
         status: "failed",
      };

      if (db && !context.dryRun) {
         await saveExecutionLog(db, rule, event, result, context);
      }

      return result;
   }
}

export async function runRules(
   rules: AutomationRule[],
   event: AutomationEvent,
   context: RuleExecutionContext,
   db?: DatabaseInstance,
): Promise<RuleExecutionResult> {
   const startedAt = new Date();
   const results: RuleEvaluationResult[] = [];
   let rulesMatched = 0;
   let rulesExecuted = 0;
   let rulesFailed = 0;
   let stoppedEarly = false;
   let stoppedByRule: string | undefined;

   const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

   for (const rule of sortedRules) {
      if (!rule.isActive) {
         continue;
      }

      const result = await runRule(rule, event, context, db);
      results.push(result);

      if (result.conditionsPassed) {
         rulesMatched++;
         rulesExecuted++;

         if (result.status === "failed") {
            rulesFailed++;
         }

         if (result.stoppedByAction || rule.stopOnFirstMatch) {
            stoppedEarly = true;
            stoppedByRule = rule.id;
            break;
         }
      }
   }

   const completedAt = new Date();

   return {
      completedAt,
      eventId: event.id,
      eventType: event.type,
      organizationId: context.organizationId,
      results,
      rulesEvaluated: sortedRules.filter((r) => r.isActive).length,
      rulesExecuted,
      rulesFailed,
      rulesMatched,
      startedAt,
      stoppedByRule,
      stoppedEarly,
      totalDurationMs: completedAt.getTime() - startedAt.getTime(),
   };
}

export async function runRulesForEvent(
   event: AutomationEvent,
   rules: AutomationRule[],
   db?: DatabaseInstance,
   options?: {
      dryRun?: boolean;
      triggeredBy?: "event" | "manual" | "webhook";
   },
): Promise<RuleExecutionResult> {
   const applicableRules = rules.filter(
      (rule) =>
         rule.isActive &&
         rule.triggerType === event.type &&
         rule.organizationId === event.organizationId,
   );

   return runRules(
      applicableRules,
      event,
      {
         dryRun: options?.dryRun,
         event,
         organizationId: event.organizationId,
         triggeredBy: options?.triggeredBy || "event",
      },
      db,
   );
}
