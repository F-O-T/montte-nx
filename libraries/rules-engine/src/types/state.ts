import { z } from "zod";
import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "./consequence";
import type { Rule, RuleSet } from "./rule";

// ============================================================================
// Zod Schemas - Define schemas first, then infer types
// ============================================================================

export const RuleStatsSchema = z.object({
   evaluations: z.number().int().nonnegative(),
   matches: z.number().int().nonnegative(),
   errors: z.number().int().nonnegative(),
   totalTimeMs: z.number().nonnegative(),
   avgTimeMs: z.number().nonnegative(),
   lastEvaluated: z.date().optional(),
});
export type RuleStats = z.infer<typeof RuleStatsSchema>;

export const CacheStatsSchema = z.object({
   size: z.number().int().nonnegative(),
   maxSize: z.number().int().positive(),
   hits: z.number().int().nonnegative(),
   misses: z.number().int().nonnegative(),
   hitRate: z.number().min(0).max(1),
   evictions: z.number().int().nonnegative(),
});
export type CacheStats = z.infer<typeof CacheStatsSchema>;

export const EngineStatsSchema = z.object({
   totalRules: z.number().int().nonnegative(),
   enabledRules: z.number().int().nonnegative(),
   disabledRules: z.number().int().nonnegative(),
   totalRuleSets: z.number().int().nonnegative(),
   totalEvaluations: z.number().int().nonnegative(),
   totalMatches: z.number().int().nonnegative(),
   totalErrors: z.number().int().nonnegative(),
   avgEvaluationTimeMs: z.number().nonnegative(),
   cacheHits: z.number().int().nonnegative(),
   cacheMisses: z.number().int().nonnegative(),
   cacheHitRate: z.number().min(0).max(1),
});
export type EngineStats = z.infer<typeof EngineStatsSchema>;

// ============================================================================
// Types that cannot be Zod schemas (contain Maps or complex generics)
// ============================================================================

export type EngineState<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly rules: ReadonlyMap<string, Rule<TContext, TConsequences>>;
   readonly ruleSets: ReadonlyMap<string, RuleSet>;
   readonly ruleOrder: ReadonlyArray<string>;
};

// Internal mutable version - not exported from index.ts
export type MutableEngineState<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   rules: Map<string, Rule<TContext, TConsequences>>;
   ruleSets: Map<string, RuleSet>;
   ruleOrder: string[];
};

// Internal mutable version - not exported from index.ts
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

// Internal mutable version - not exported from index.ts
export type MutableOptimizerState = {
   ruleStats: Map<string, MutableRuleStats>;
   lastOptimized?: Date;
};

// ============================================================================
// Factory functions
// ============================================================================

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
