import type {
   AggregatedConsequence,
   ConsequenceDefinitions,
   DefaultConsequences,
} from "./consequence";
import type {
   ConflictResolutionStrategy,
   EngineExecutionResult,
   EvaluationContext,
   RuleEvaluationResult,
} from "./evaluation";
import type { Rule } from "./rule";

export type LogLevel = "none" | "error" | "warn" | "info" | "debug";

export type Logger = {
   readonly error: (...args: unknown[]) => void;
   readonly warn: (...args: unknown[]) => void;
   readonly info: (...args: unknown[]) => void;
   readonly debug: (...args: unknown[]) => void;
};

export type CacheConfig = {
   readonly enabled: boolean;
   readonly ttl: number;
   readonly maxSize: number;
};

export type ValidationConfig = {
   readonly enabled: boolean;
   readonly strict: boolean;
};

export type VersioningConfig = {
   readonly enabled: boolean;
   readonly maxVersions: number;
};

export type EngineHooks<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly beforeEvaluation?: (
      context: EvaluationContext<TContext>,
      rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ) => void | Promise<void>;

   readonly afterEvaluation?: (
      result: EngineExecutionResult<TContext, TConsequences>,
   ) => void | Promise<void>;

   readonly beforeRuleEvaluation?: (
      rule: Rule<TContext, TConsequences>,
      context: EvaluationContext<TContext>,
   ) => void | Promise<void>;

   readonly afterRuleEvaluation?: (
      rule: Rule<TContext, TConsequences>,
      result: RuleEvaluationResult<TContext, TConsequences>,
   ) => void | Promise<void>;

   readonly onRuleMatch?: (
      rule: Rule<TContext, TConsequences>,
      context: EvaluationContext<TContext>,
   ) => void | Promise<void>;

   readonly onRuleSkip?: (
      rule: Rule<TContext, TConsequences>,
      reason: string,
   ) => void | Promise<void>;

   readonly onRuleError?: (
      rule: Rule<TContext, TConsequences>,
      error: Error,
   ) => void | Promise<void>;

   readonly onConsequenceCollected?: (
      rule: Rule<TContext, TConsequences>,
      consequence: AggregatedConsequence<TConsequences>,
   ) => void | Promise<void>;

   readonly onCacheHit?: (
      key: string,
      result: EngineExecutionResult<TContext, TConsequences>,
   ) => void | Promise<void>;

   readonly onCacheMiss?: (key: string) => void | Promise<void>;

   readonly onSlowRule?: (
      rule: Rule<TContext, TConsequences>,
      timeMs: number,
      threshold: number,
   ) => void | Promise<void>;
};

export type EngineConfig<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly consequences?: TConsequences;
   readonly conflictResolution?: ConflictResolutionStrategy;
   readonly cache?: Partial<CacheConfig>;
   readonly validation?: Partial<ValidationConfig>;
   readonly versioning?: Partial<VersioningConfig>;
   readonly hooks?: EngineHooks<TContext, TConsequences>;
   readonly logLevel?: LogLevel;
   readonly logger?: Logger;
   readonly continueOnError?: boolean;
   readonly slowRuleThresholdMs?: number;
};

export type ResolvedEngineConfig<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly consequences: TConsequences | undefined;
   readonly conflictResolution: ConflictResolutionStrategy;
   readonly cache: CacheConfig;
   readonly validation: ValidationConfig;
   readonly versioning: VersioningConfig;
   readonly hooks: EngineHooks<TContext, TConsequences>;
   readonly logLevel: LogLevel;
   readonly logger: Logger;
   readonly continueOnError: boolean;
   readonly slowRuleThresholdMs: number;
};

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
   enabled: true,
   ttl: 60000,
   maxSize: 1000,
};

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
   enabled: true,
   strict: false,
};

export const DEFAULT_VERSIONING_CONFIG: VersioningConfig = {
   enabled: false,
   maxVersions: 10,
};

export const DEFAULT_ENGINE_CONFIG = {
   conflictResolution: "priority" as ConflictResolutionStrategy,
   cache: DEFAULT_CACHE_CONFIG,
   validation: DEFAULT_VALIDATION_CONFIG,
   versioning: DEFAULT_VERSIONING_CONFIG,
   logLevel: "warn" as LogLevel,
   continueOnError: true,
   slowRuleThresholdMs: 10,
};
