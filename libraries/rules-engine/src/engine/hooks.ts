import type { EngineHooks } from "../types/config.ts";
import type {
   AggregatedConsequence,
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence.ts";
import type {
   EngineExecutionResult,
   EvaluationContext,
   RuleEvaluationResult,
} from "../types/evaluation.ts";
import type { Rule } from "../types/rule.ts";

export const executeBeforeEvaluation = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   context: EvaluationContext<TContext>,
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): Promise<void> => {
   if (!hooks.beforeEvaluation) return;
   try {
      await hooks.beforeEvaluation(context, rules);
   } catch {}
};

export const executeAfterEvaluation = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   result: EngineExecutionResult<TContext, TConsequences>,
): Promise<void> => {
   if (!hooks.afterEvaluation) return;
   try {
      await hooks.afterEvaluation(result);
   } catch {}
};

export const executeBeforeRuleEvaluation = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   context: EvaluationContext<TContext>,
): Promise<void> => {
   if (!hooks.beforeRuleEvaluation) return;
   try {
      await hooks.beforeRuleEvaluation(rule, context);
   } catch {}
};

export const executeAfterRuleEvaluation = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   result: RuleEvaluationResult<TContext, TConsequences>,
): Promise<void> => {
   if (!hooks.afterRuleEvaluation) return;
   try {
      await hooks.afterRuleEvaluation(rule, result);
   } catch {}
};

export const executeOnRuleMatch = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   context: EvaluationContext<TContext>,
): Promise<void> => {
   if (!hooks.onRuleMatch) return;
   try {
      await hooks.onRuleMatch(rule, context);
   } catch {}
};

export const executeOnRuleSkip = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   reason: string,
): Promise<void> => {
   if (!hooks.onRuleSkip) return;
   try {
      await hooks.onRuleSkip(rule, reason);
   } catch {}
};

export const executeOnRuleError = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   error: Error,
): Promise<void> => {
   if (!hooks.onRuleError) return;
   try {
      await hooks.onRuleError(rule, error);
   } catch {}
};

export const executeOnConsequenceCollected = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   consequence: AggregatedConsequence<TConsequences>,
): Promise<void> => {
   if (!hooks.onConsequenceCollected) return;
   try {
      await hooks.onConsequenceCollected(rule, consequence);
   } catch {}
};

export const executeOnCacheHit = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   key: string,
   result: EngineExecutionResult<TContext, TConsequences>,
): Promise<void> => {
   if (!hooks.onCacheHit) return;
   try {
      await hooks.onCacheHit(key, result);
   } catch {}
};

export const executeOnCacheMiss = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   key: string,
): Promise<void> => {
   if (!hooks.onCacheMiss) return;
   try {
      await hooks.onCacheMiss(key);
   } catch {}
};

export const executeOnSlowRule = async <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   hooks: EngineHooks<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   timeMs: number,
   threshold: number,
): Promise<void> => {
   if (!hooks.onSlowRule) return;
   try {
      await hooks.onSlowRule(rule, timeMs, threshold);
   } catch {}
};
