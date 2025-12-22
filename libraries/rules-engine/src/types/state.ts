import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "./consequence.ts";
import type { Rule, RuleSet } from "./rule.ts";

export type EngineState<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly rules: ReadonlyMap<string, Rule<TContext, TConsequences>>;
   readonly ruleSets: ReadonlyMap<string, RuleSet>;
   readonly ruleOrder: ReadonlyArray<string>;
};

export type MutableEngineState<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   rules: Map<string, Rule<TContext, TConsequences>>;
   ruleSets: Map<string, RuleSet>;
   ruleOrder: string[];
};

export type RuleStats = {
   readonly evaluations: number;
   readonly matches: number;
   readonly errors: number;
   readonly totalTimeMs: number;
   readonly avgTimeMs: number;
   readonly lastEvaluated?: Date;
};

export type MutableRuleStats = {
   evaluations: number;
   matches: number;
   errors: number;
   totalTimeMs: number;
   avgTimeMs: number;
   lastEvaluated?: Date;
};

export type OptimizerState = {
   readonly ruleStats: ReadonlyMap<string, RuleStats>;
   readonly lastOptimized?: Date;
};

export type MutableOptimizerState = {
   ruleStats: Map<string, MutableRuleStats>;
   lastOptimized?: Date;
};

export type EngineStats = {
   readonly totalRules: number;
   readonly enabledRules: number;
   readonly disabledRules: number;
   readonly totalRuleSets: number;
   readonly totalEvaluations: number;
   readonly totalMatches: number;
   readonly totalErrors: number;
   readonly avgEvaluationTimeMs: number;
   readonly cacheHits: number;
   readonly cacheMisses: number;
   readonly cacheHitRate: number;
};

export type CacheStats = {
   readonly size: number;
   readonly maxSize: number;
   readonly hits: number;
   readonly misses: number;
   readonly hitRate: number;
   readonly evictions: number;
};

export const createInitialState = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(): MutableEngineState<TContext, TConsequences> => ({
   rules: new Map(),
   ruleSets: new Map(),
   ruleOrder: [],
});

export const createInitialOptimizerState = (): MutableOptimizerState => ({
   ruleStats: new Map(),
   lastOptimized: undefined,
});

export const createInitialRuleStats = (): MutableRuleStats => ({
   evaluations: 0,
   matches: 0,
   errors: 0,
   totalTimeMs: 0,
   avgTimeMs: 0,
   lastEvaluated: undefined,
});
