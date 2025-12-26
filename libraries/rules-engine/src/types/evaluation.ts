import type { GroupEvaluationResult } from "@f-o-t/condition-evaluator";
import { z } from "zod";
import type {
   AggregatedConsequence,
   ConsequenceDefinitions,
   DefaultConsequences,
} from "./consequence";
import type { Rule } from "./rule";

// ============================================================================
// Zod Schemas - Define schemas first, then infer types
// ============================================================================

export const ConflictResolutionStrategySchema = z.enum([
   "priority",
   "first-match",
   "all",
   "most-specific",
]);
export type ConflictResolutionStrategy = z.infer<
   typeof ConflictResolutionStrategySchema
>;

export const EvaluateOptionsSchema = z.object({
   conflictResolution: ConflictResolutionStrategySchema.optional(),
   maxRules: z.number().int().positive().optional(),
   timeout: z.number().int().positive().optional(),
   skipDisabled: z.boolean().optional(),
   tags: z.array(z.string()).optional(),
   category: z.string().optional(),
   ruleSetId: z.string().optional(),
   bypassCache: z.boolean().optional(),
});
export type EvaluateOptions = z.infer<typeof EvaluateOptionsSchema>;

export const EvaluateConfigSchema = z.object({
   conflictResolution: ConflictResolutionStrategySchema,
   continueOnError: z.boolean(),
   collectAllConsequences: z.boolean(),
});
export type EvaluateConfig = z.infer<typeof EvaluateConfigSchema>;

// ============================================================================
// Types that cannot be Zod schemas (contain complex generics)
// ============================================================================

export type EvaluationContext<TContext = unknown> = {
   readonly data: TContext;
   readonly timestamp: Date;
   readonly correlationId?: string;
   readonly metadata?: Readonly<Record<string, unknown>>;
};

export type RuleEvaluationResult<
   _TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly ruleId: string;
   readonly ruleName: string;
   readonly matched: boolean;
   readonly conditionResult: GroupEvaluationResult;
   readonly consequences: ReadonlyArray<AggregatedConsequence<TConsequences>>;
   readonly evaluationTimeMs: number;
   readonly skipped: boolean;
   readonly skipReason?: string;
   readonly error?: Error;
};

export type EngineExecutionResult<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly context: EvaluationContext<TContext>;
   readonly results: ReadonlyArray<
      RuleEvaluationResult<TContext, TConsequences>
   >;
   readonly matchedRules: ReadonlyArray<Rule<TContext, TConsequences>>;
   readonly consequences: ReadonlyArray<AggregatedConsequence<TConsequences>>;
   readonly totalRulesEvaluated: number;
   readonly totalRulesMatched: number;
   readonly totalRulesSkipped: number;
   readonly totalRulesErrored: number;
   readonly executionTimeMs: number;
   readonly stoppedEarly: boolean;
   readonly stoppedByRuleId?: string;
   readonly cacheHit: boolean;
};
