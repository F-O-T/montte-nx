import { evaluateRule, evaluateRules } from "../core/evaluate";
import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type {
   EvaluationContext,
   RuleEvaluationResult,
} from "../types/evaluation";
import type { Rule } from "../types/rule";

export type SimulationContext<TContext = unknown> = {
   readonly data: TContext;
   readonly metadata?: Record<string, unknown>;
};

export type SimulationResult<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly context: SimulationContext<TContext>;
   readonly matchedRules: ReadonlyArray<
      RuleEvaluationResult<TContext, TConsequences>
   >;
   readonly unmatchedRules: ReadonlyArray<{
      ruleId: string;
      ruleName: string;
      reason: string;
   }>;
   readonly consequences: ReadonlyArray<{
      type: keyof TConsequences;
      payload: unknown;
      ruleId: string;
      ruleName: string;
   }>;
   readonly executionTimeMs: number;
};

export type WhatIfResult<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly original: SimulationResult<TContext, TConsequences>;
   readonly modified: SimulationResult<TContext, TConsequences>;
   readonly differences: {
      readonly newMatches: ReadonlyArray<string>;
      readonly lostMatches: ReadonlyArray<string>;
      readonly consequenceChanges: ReadonlyArray<{
         type: "added" | "removed" | "modified";
         consequenceType: string;
         ruleId: string;
      }>;
   };
};

export type BatchSimulationResult<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly results: ReadonlyArray<SimulationResult<TContext, TConsequences>>;
   readonly summary: {
      readonly totalContexts: number;
      readonly averageMatchedRules: number;
      readonly ruleMatchFrequency: ReadonlyMap<string, number>;
      readonly consequenceFrequency: ReadonlyMap<string, number>;
      readonly averageExecutionTimeMs: number;
   };
};

const toEvaluationContext = <TContext>(
   simContext: SimulationContext<TContext>,
): EvaluationContext<TContext> => ({
   data: simContext.data,
   timestamp: new Date(),
   metadata: simContext.metadata,
});

export const simulate = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   context: SimulationContext<TContext>,
): SimulationResult<TContext, TConsequences> => {
   const startTime = performance.now();

   const enabledRules = rules.filter((r) => r.enabled);
   const evalContext = toEvaluationContext(context);
   const results = evaluateRules(enabledRules, evalContext);

   const matchedRules = results.results.filter((r) => r.matched);
   const unmatchedRules: Array<{
      ruleId: string;
      ruleName: string;
      reason: string;
   }> = [];

   for (const result of results.results) {
      if (!result.matched) {
         const reason = result.skipped
            ? (result.skipReason ?? "Skipped")
            : result.error
              ? `Error: ${result.error.message}`
              : "Conditions not met";
         unmatchedRules.push({
            ruleId: result.ruleId,
            ruleName: result.ruleName,
            reason,
         });
      }
   }

   const consequences: Array<{
      type: keyof TConsequences;
      payload: unknown;
      ruleId: string;
      ruleName: string;
   }> = [];

   for (const match of matchedRules) {
      for (const consequence of match.consequences) {
         consequences.push({
            type: consequence.type,
            payload: consequence.payload,
            ruleId: consequence.ruleId,
            ruleName: consequence.ruleName ?? match.ruleName,
         });
      }
   }

   const executionTimeMs = performance.now() - startTime;

   return {
      context,
      matchedRules,
      unmatchedRules,
      consequences,
      executionTimeMs,
   };
};

export const simulateSingleRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: Rule<TContext, TConsequences>,
   context: SimulationContext<TContext>,
): {
   matched: boolean;
   conditionResult: unknown;
   consequences: ReadonlyArray<{ type: keyof TConsequences; payload: unknown }>;
} => {
   const evalContext = toEvaluationContext(context);
   const result = evaluateRule(rule, evalContext);

   return {
      matched: result.matched,
      conditionResult: result.conditionResult,
      consequences: result.matched
         ? rule.consequences.map((c) => ({ type: c.type, payload: c.payload }))
         : [],
   };
};

export const whatIf = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   originalRules: ReadonlyArray<Rule<TContext, TConsequences>>,
   modifiedRules: ReadonlyArray<Rule<TContext, TConsequences>>,
   context: SimulationContext<TContext>,
): WhatIfResult<TContext, TConsequences> => {
   const original = simulate(originalRules, context);
   const modified = simulate(modifiedRules, context);

   const originalMatchIds = new Set(original.matchedRules.map((r) => r.ruleId));
   const modifiedMatchIds = new Set(modified.matchedRules.map((r) => r.ruleId));

   const newMatches = [...modifiedMatchIds].filter(
      (id) => !originalMatchIds.has(id),
   );
   const lostMatches = [...originalMatchIds].filter(
      (id) => !modifiedMatchIds.has(id),
   );

   const consequenceChanges: Array<{
      type: "added" | "removed" | "modified";
      consequenceType: string;
      ruleId: string;
   }> = [];

   const originalConsequenceKeys = new Set(
      original.consequences.map((c) => `${c.ruleId}:${c.type as string}`),
   );
   const modifiedConsequenceKeys = new Set(
      modified.consequences.map((c) => `${c.ruleId}:${c.type as string}`),
   );

   for (const key of modifiedConsequenceKeys) {
      if (!originalConsequenceKeys.has(key)) {
         const [ruleId, consequenceType] = key.split(":");
         consequenceChanges.push({
            type: "added",
            consequenceType: consequenceType ?? "",
            ruleId: ruleId ?? "",
         });
      }
   }

   for (const key of originalConsequenceKeys) {
      if (!modifiedConsequenceKeys.has(key)) {
         const [ruleId, consequenceType] = key.split(":");
         consequenceChanges.push({
            type: "removed",
            consequenceType: consequenceType ?? "",
            ruleId: ruleId ?? "",
         });
      }
   }

   return {
      original,
      modified,
      differences: {
         newMatches,
         lostMatches,
         consequenceChanges,
      },
   };
};

export const batchSimulate = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   contexts: ReadonlyArray<SimulationContext<TContext>>,
): BatchSimulationResult<TContext, TConsequences> => {
   const results = contexts.map((context) => simulate(rules, context));

   const ruleMatchFrequency = new Map<string, number>();
   const consequenceFrequency = new Map<string, number>();
   let totalMatchedRules = 0;
   let totalExecutionTime = 0;

   for (const result of results) {
      totalMatchedRules += result.matchedRules.length;
      totalExecutionTime += result.executionTimeMs;

      for (const match of result.matchedRules) {
         const count = ruleMatchFrequency.get(match.ruleId) ?? 0;
         ruleMatchFrequency.set(match.ruleId, count + 1);
      }

      for (const consequence of result.consequences) {
         const key = consequence.type as string;
         const count = consequenceFrequency.get(key) ?? 0;
         consequenceFrequency.set(key, count + 1);
      }
   }

   return {
      results,
      summary: {
         totalContexts: contexts.length,
         averageMatchedRules:
            contexts.length > 0 ? totalMatchedRules / contexts.length : 0,
         ruleMatchFrequency,
         consequenceFrequency,
         averageExecutionTimeMs:
            contexts.length > 0 ? totalExecutionTime / contexts.length : 0,
      },
   };
};

export const findRulesAffectedByContextChange = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   originalContext: SimulationContext<TContext>,
   modifiedContext: SimulationContext<TContext>,
): {
   becameTrue: ReadonlyArray<Rule<TContext, TConsequences>>;
   becameFalse: ReadonlyArray<Rule<TContext, TConsequences>>;
   unchanged: ReadonlyArray<Rule<TContext, TConsequences>>;
} => {
   const originalResult = simulate(rules, originalContext);
   const modifiedResult = simulate(rules, modifiedContext);

   const originalMatchIds = new Set(
      originalResult.matchedRules.map((r) => r.ruleId),
   );
   const modifiedMatchIds = new Set(
      modifiedResult.matchedRules.map((r) => r.ruleId),
   );

   const becameTrue: Rule<TContext, TConsequences>[] = [];
   const becameFalse: Rule<TContext, TConsequences>[] = [];
   const unchanged: Rule<TContext, TConsequences>[] = [];

   for (const rule of rules) {
      const wasMatched = originalMatchIds.has(rule.id);
      const isMatched = modifiedMatchIds.has(rule.id);

      if (!wasMatched && isMatched) {
         becameTrue.push(rule);
      } else if (wasMatched && !isMatched) {
         becameFalse.push(rule);
      } else {
         unchanged.push(rule);
      }
   }

   return { becameTrue, becameFalse, unchanged };
};

export const formatSimulationResult = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   result: SimulationResult<TContext, TConsequences>,
): string => {
   const lines: string[] = [
      "=== Simulation Result ===",
      "",
      `Execution Time: ${result.executionTimeMs.toFixed(2)}ms`,
      "",
      `Matched Rules (${result.matchedRules.length}):`,
   ];

   for (const match of result.matchedRules) {
      lines.push(`  - ${match.ruleName} (${match.ruleId})`);
   }

   lines.push("");
   lines.push(`Unmatched Rules (${result.unmatchedRules.length}):`);

   for (const unmatched of result.unmatchedRules) {
      lines.push(`  - ${unmatched.ruleName}: ${unmatched.reason}`);
   }

   lines.push("");
   lines.push(`Consequences (${result.consequences.length}):`);

   for (const consequence of result.consequences) {
      lines.push(
         `  - ${consequence.type as string} from "${consequence.ruleName}"`,
      );
   }

   return lines.join("\n");
};
