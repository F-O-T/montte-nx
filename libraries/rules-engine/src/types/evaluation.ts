import type { GroupEvaluationResult } from "@f-o-t/condition-evaluator";
import type {
   AggregatedConsequence,
   ConsequenceDefinitions,
   DefaultConsequences,
} from "./consequence.ts";
import type { Rule } from "./rule.ts";

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

export type ConflictResolutionStrategy =
   | "priority"
   | "first-match"
   | "all"
   | "most-specific";

export type EvaluateOptions = {
   readonly conflictResolution?: ConflictResolutionStrategy;
   readonly maxRules?: number;
   readonly timeout?: number;
   readonly skipDisabled?: boolean;
   readonly tags?: ReadonlyArray<string>;
   readonly category?: string;
   readonly ruleSetId?: string;
   readonly bypassCache?: boolean;
};

export type EvaluateConfig = {
   readonly conflictResolution: ConflictResolutionStrategy;
   readonly continueOnError: boolean;
   readonly collectAllConsequences: boolean;
};
