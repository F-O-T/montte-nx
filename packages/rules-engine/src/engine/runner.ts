import type { DatabaseInstance } from "@packages/database/client";
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
         return {
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

      return {
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
   } catch (error) {
      const completedAt = new Date();
      return {
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
