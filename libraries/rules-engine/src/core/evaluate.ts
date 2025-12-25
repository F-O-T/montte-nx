import {
   evaluateConditionGroup,
   type GroupEvaluationResult,
} from "@f-o-t/condition-evaluator";
import type {
   AggregatedConsequence,
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type {
   EvaluateConfig,
   EvaluationContext,
   RuleEvaluationResult,
} from "../types/evaluation";
import type { Rule } from "../types/rule";
import { measureTime } from "../utils/time";

export type EvaluateRuleOptions = {
   readonly skipDisabled?: boolean;
};

export const evaluateRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: Rule<TContext, TConsequences>,
   context: EvaluationContext<TContext>,
   options: EvaluateRuleOptions = {},
): RuleEvaluationResult<TContext, TConsequences> => {
   if (options.skipDisabled && !rule.enabled) {
      return {
         ruleId: rule.id,
         ruleName: rule.name,
         matched: false,
         conditionResult: createEmptyGroupResult(rule.conditions.id),
         consequences: [],
         evaluationTimeMs: 0,
         skipped: true,
         skipReason: "Rule is disabled",
      };
   }

   const { result: conditionResult, durationMs } = measureTime(() => {
      try {
         const evalContext = {
            data: context.data as Record<string, unknown>,
            metadata: context.metadata as Record<string, unknown> | undefined,
         };
         return evaluateConditionGroup(rule.conditions, evalContext);
      } catch (error) {
         return {
            error,
            result: createEmptyGroupResult(rule.conditions.id),
         };
      }
   });

   if ("error" in conditionResult) {
      return {
         ruleId: rule.id,
         ruleName: rule.name,
         matched: false,
         conditionResult: conditionResult.result,
         consequences: [],
         evaluationTimeMs: durationMs,
         skipped: false,
         error:
            conditionResult.error instanceof Error
               ? conditionResult.error
               : new Error(String(conditionResult.error)),
      };
   }

   const matched = conditionResult.passed;

   const consequences: AggregatedConsequence<TConsequences>[] = matched
      ? rule.consequences.map((consequence) => ({
           type: consequence.type,
           payload: consequence.payload,
           ruleId: rule.id,
           ruleName: rule.name,
           priority: rule.priority,
        }))
      : [];

   return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      conditionResult,
      consequences,
      evaluationTimeMs: durationMs,
      skipped: false,
   };
};

const createEmptyGroupResult = (groupId: string): GroupEvaluationResult => ({
   groupId,
   operator: "AND",
   passed: false,
   results: [],
});

export type EvaluateRulesOptions<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly config?: Partial<EvaluateConfig>;
   readonly onRuleEvaluated?: (
      result: RuleEvaluationResult<TContext, TConsequences>,
   ) => void;
};

export type EvaluateRulesResult<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly results: ReadonlyArray<
      RuleEvaluationResult<TContext, TConsequences>
   >;
   readonly matchedRules: ReadonlyArray<Rule<TContext, TConsequences>>;
   readonly consequences: ReadonlyArray<AggregatedConsequence<TConsequences>>;
   readonly stoppedEarly: boolean;
   readonly stoppedByRuleId?: string;
};

export const evaluateRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   context: EvaluationContext<TContext>,
   options: EvaluateRulesOptions<TContext, TConsequences> = {},
): EvaluateRulesResult<TContext, TConsequences> => {
   const config: EvaluateConfig = {
      conflictResolution: options.config?.conflictResolution ?? "priority",
      continueOnError: options.config?.continueOnError ?? true,
      collectAllConsequences: options.config?.collectAllConsequences ?? true,
   };

   const results: RuleEvaluationResult<TContext, TConsequences>[] = [];
   const matchedRules: Rule<TContext, TConsequences>[] = [];
   const consequences: AggregatedConsequence<TConsequences>[] = [];
   let stoppedEarly = false;
   let stoppedByRuleId: string | undefined;

   for (const rule of rules) {
      const result = evaluateRule(rule, context, { skipDisabled: true });
      results.push(result);

      options.onRuleEvaluated?.(result);

      if (result.error && !config.continueOnError) {
         break;
      }

      if (result.matched) {
         matchedRules.push(rule);
         consequences.push(...result.consequences);

         if (rule.stopOnMatch) {
            stoppedEarly = true;
            stoppedByRuleId = rule.id;
            break;
         }

         if (config.conflictResolution === "first-match") {
            stoppedEarly = true;
            stoppedByRuleId = rule.id;
            break;
         }
      }
   }

   return {
      results,
      matchedRules,
      consequences,
      stoppedEarly,
      stoppedByRuleId,
   };
};
