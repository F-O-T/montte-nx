import { evaluate } from "@f-o-t/condition-evaluator";
import type { DatabaseInstance } from "@packages/database/client";
import { createAutomationLog } from "@packages/database/repositories/automation-log-repository";
import { findActiveAutomationRulesByTrigger } from "@packages/database/repositories/automation-repository";
import type {
   ActionExecutionLogResult,
   AutomationLogStatus,
   ConditionEvaluationLogResult,
   TriggerType,
} from "@packages/database/schema";
import type { Resend } from "resend";
import { executeActions } from "../actions/executor";
import type { VapidConfig } from "../actions/types";
import type { TransactionEventData, WorkflowEvent } from "../types/events";
import type {
   ExecutedAction,
   RuleExecutionResult,
   WorkflowExecutionResult,
   WorkflowRule,
} from "../types/rules";
import { toWorkflowRule } from "../types/rules";
import {
   adaptConditionGroupsToEvaluator,
   adaptEventDataToContext,
} from "./adapter";

export type WorkflowRunnerConfig = {
   db: DatabaseInstance;
   dryRun?: boolean;
   resendClient?: Resend;
   vapidConfig?: VapidConfig;
};

export type WorkflowRunner = {
   processEvent: (event: WorkflowEvent) => Promise<WorkflowExecutionResult>;
   processEventForRule: (
      event: WorkflowEvent,
      rule: WorkflowRule,
   ) => Promise<RuleExecutionResult>;
};

export function createWorkflowRunner(
   config: WorkflowRunnerConfig,
): WorkflowRunner {
   const { db, dryRun = false, resendClient, vapidConfig } = config;

   async function processEvent(
      event: WorkflowEvent,
   ): Promise<WorkflowExecutionResult> {
      const startTime = performance.now();
      const results: RuleExecutionResult[] = [];
      let stoppedEarly = false;
      let stoppedByRuleId: string | undefined;

      const dbRules = await findActiveAutomationRulesByTrigger(
         db,
         event.organizationId,
         event.type,
      );

      // Rules are already ordered by priority (descending) from the repository query
      const rules = dbRules.map(toWorkflowRule);

      for (const rule of rules) {
         const result = await processEventForRule(event, rule);
         results.push(result);

         if (result.stopProcessing) {
            stoppedEarly = true;
            stoppedByRuleId = rule.id;
            break;
         }
      }

      const totalDurationMs = performance.now() - startTime;

      return {
         eventId: event.id,
         eventType: event.type,
         organizationId: event.organizationId,
         results,
         rulesEvaluated: results.length,
         rulesMatched: results.filter((r) => r.matched).length,
         stoppedByRuleId,
         stoppedEarly,
         totalDurationMs,
      };
   }

   async function processEventForRule(
      event: WorkflowEvent,
      rule: WorkflowRule,
   ): Promise<RuleExecutionResult> {
      const startedAt = new Date();
      const startTime = performance.now();
      const actionsExecuted: ExecutedAction[] = [];
      let conditionsPassed = false;
      let error: string | undefined;
      let stopProcessing = false;
      let conditionsEvaluated: ConditionEvaluationLogResult[] = [];

      try {
         const conditionGroup = adaptConditionGroupsToEvaluator(
            rule.conditions,
         );
         const context = adaptEventDataToContext(
            event.data as TransactionEventData,
         );

         const evaluationResult = evaluate(conditionGroup, { data: context });
         conditionsPassed = evaluationResult.passed;

         if ("results" in evaluationResult && evaluationResult.results) {
            conditionsEvaluated = flattenEvaluationResults(
               evaluationResult.results,
            );
         }

         if (conditionsPassed) {
            const executionResult = await executeActions(rule.actions, {
               db,
               dryRun,
               eventData: context,
               organizationId: event.organizationId,
               resendClient,
               ruleId: rule.id,
               vapidConfig,
            });

            for (const actionResult of executionResult.results) {
               const executed: ExecutedAction = {
                  actionId: actionResult.actionId,
                  error: actionResult.error,
                  result: actionResult.result,
                  skippedReason: actionResult.skipReason,
                  status: actionResult.skipped
                     ? "skipped"
                     : actionResult.success
                       ? "success"
                       : "failed",
                  type: actionResult.type,
               };
               actionsExecuted.push(executed);
            }

            stopProcessing =
               executionResult.stoppedEarly || (rule.stopOnFirstMatch ?? false);
         }
      } catch (e) {
         error = e instanceof Error ? e.message : "Unknown error";
      }

      const durationMs = Math.round(performance.now() - startTime);
      const completedAt = new Date();

      const actionsLogResults: ActionExecutionLogResult[] = actionsExecuted.map(
         (action) => ({
            actionId: action.actionId,
            error: action.error,
            result: action.result,
            success: action.status === "success",
            type: action.type,
         }),
      );

      let status: AutomationLogStatus;
      if (error) {
         status = "failed";
      } else if (!conditionsPassed) {
         status = "skipped";
      } else {
         const allSuccess = actionsExecuted.every(
            (a) => a.status === "success" || a.status === "skipped",
         );
         const anySuccess = actionsExecuted.some((a) => a.status === "success");
         if (allSuccess) {
            status = "success";
         } else if (anySuccess) {
            status = "partial";
         } else {
            status = "failed";
         }
      }

      const eventData = event.data as TransactionEventData;

      if (!dryRun) {
         try {
            await createAutomationLog(db, {
               actionsExecuted: actionsLogResults,
               completedAt,
               conditionsEvaluated,
               durationMs,
               errorMessage: error ?? null,
               organizationId: event.organizationId,
               relatedEntityId: eventData.id ?? null,
               relatedEntityType: eventData.id ? "transaction" : null,
               ruleId: rule.id,
               ruleName: rule.name,
               startedAt,
               status,
               triggerEvent: event.data,
               triggeredBy: "event",
               triggerType: rule.triggerType as TriggerType,
            });
         } catch (logError) {
            console.error("Failed to create automation log:", logError);
         }
      }

      return {
         actionsExecuted,
         conditionsPassed,
         durationMs,
         error,
         matched: conditionsPassed,
         ruleId: rule.id,
         ruleName: rule.name,
         stopProcessing,
      };
   }

   function flattenEvaluationResults(
      results: unknown[],
   ): ConditionEvaluationLogResult[] {
      const flattened: ConditionEvaluationLogResult[] = [];

      for (const result of results) {
         if (
            result &&
            typeof result === "object" &&
            "conditionId" in result &&
            "passed" in result
         ) {
            const evalResult = result as {
               conditionId: string;
               passed: boolean;
               actualValue?: unknown;
               expectedValue?: unknown;
            };
            flattened.push({
               actualValue: evalResult.actualValue,
               conditionId: evalResult.conditionId,
               expectedValue: evalResult.expectedValue,
               passed: evalResult.passed,
            });
         } else if (
            result &&
            typeof result === "object" &&
            "results" in result
         ) {
            const groupResult = result as { results: unknown[] };
            flattened.push(...flattenEvaluationResults(groupResult.results));
         }
      }

      return flattened;
   }

   return {
      processEvent,
      processEventForRule,
   };
}

export async function runWorkflowForEvent(
   db: DatabaseInstance,
   event: WorkflowEvent,
   options?: {
      dryRun?: boolean;
      resendClient?: Resend;
      vapidConfig?: VapidConfig;
   },
): Promise<WorkflowExecutionResult> {
   const runner = createWorkflowRunner({
      db,
      dryRun: options?.dryRun,
      resendClient: options?.resendClient,
      vapidConfig: options?.vapidConfig,
   });

   return runner.processEvent(event);
}
