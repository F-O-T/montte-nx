import { evaluate } from "@f-o-t/condition-evaluator";
import type { DatabaseInstance } from "@packages/database/client";
import { findActiveAutomationRulesByTrigger } from "@packages/database/repositories/automation-repository";
import { executeActions } from "../actions/executor";
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
   const { db, dryRun = false } = config;

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

      const rules = dbRules.map(toWorkflowRule);
      const sortedRules = rules.sort(
         (a: WorkflowRule, b: WorkflowRule) => b.priority - a.priority,
      );

      for (const rule of sortedRules) {
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
      const startTime = performance.now();
      const actionsExecuted: ExecutedAction[] = [];
      let conditionsPassed = false;
      let error: string | undefined;
      let stopProcessing = false;

      try {
         const conditionGroup = adaptConditionGroupsToEvaluator(
            rule.conditions,
         );
         const context = adaptEventDataToContext(
            event.data as TransactionEventData,
         );

         const evaluationResult = evaluate(conditionGroup, { data: context });
         conditionsPassed = evaluationResult.passed;

         if (conditionsPassed) {
            const executionResult = await executeActions(rule.actions, {
               db,
               dryRun,
               eventData: context,
               organizationId: event.organizationId,
               ruleId: rule.id,
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

      const durationMs = performance.now() - startTime;

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

   return {
      processEvent,
      processEventForRule,
   };
}

export async function runWorkflowForEvent(
   db: DatabaseInstance,
   event: WorkflowEvent,
   options?: { dryRun?: boolean },
): Promise<WorkflowExecutionResult> {
   const runner = createWorkflowRunner({
      db,
      dryRun: options?.dryRun,
   });

   return runner.processEvent(event);
}
