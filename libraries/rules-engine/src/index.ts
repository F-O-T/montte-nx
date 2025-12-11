export type {
   ArrayCondition,
   BooleanCondition,
   Condition,
   ConditionGroup,
   CustomCondition,
   DateCondition,
   EvaluationResult,
   GroupEvaluationResult,
   LogicalOperator,
   NumberCondition,
   StringCondition,
} from "@f-o-t/condition-evaluator";
export {
   analyzeConsequenceUsage,
   analyzeFieldUsage,
   analyzeOperatorUsage,
   analyzeRuleComplexity,
   analyzeRuleSet,
   type ConsequenceUsage,
   type FieldUsage,
   findLeastUsedFields,
   findMostComplexRules,
   formatRuleSetAnalysis,
   type OperatorUsage,
   type RuleComplexity,
   type RuleSetAnalysis,
} from "./analyzer/analysis.ts";
export {
   all,
   and,
   any,
   arr,
   bool,
   type ConditionBuilder,
   type ConditionBuilderState,
   conditions,
   date,
   num,
   or,
   resetBuilderIds,
   str,
} from "./builder/conditions.ts";
export {
   createRule,
   type RuleBuilder,
   type RuleBuilderState,
   rule,
} from "./builder/rule.ts";
export {
   type Cache,
   type CacheEntry,
   type CacheOptions,
   createCache,
} from "./cache/cache.ts";
export { createNoopCache } from "./cache/noop.ts";
export {
   type EvaluateRuleOptions,
   type EvaluateRulesOptions,
   type EvaluateRulesResult,
   evaluateRule,
   evaluateRules,
} from "./core/evaluate.ts";
export {
   filterByCategory,
   filterByEnabled,
   filterByIds,
   filterByTags,
   filterRules,
} from "./core/filter.ts";
export {
   type GroupByField,
   type GroupedRules,
   groupByCategory,
   groupByCustom,
   groupByEnabled,
   groupByPriority,
   groupRules,
} from "./core/group.ts";
export {
   type SortDirection,
   type SortField,
   type SortOptions,
   sortByCreatedAt,
   sortByName,
   sortByPriority,
   sortByUpdatedAt,
   sortRules,
} from "./core/sort.ts";
export { createEngine, type Engine } from "./engine/engine.ts";
export {
   addRule,
   addRuleSet,
   addRules,
   clearRules,
   cloneState,
   disableRule,
   enableRule,
   getRule,
   getRuleSet,
   getRuleSets,
   getRules,
   getRulesInSet,
   removeRule,
   removeRuleSet,
   updateRule,
} from "./engine/state.ts";
export {
   analyzeOptimizations,
   buildIndex,
   type CategoryIndex,
   type FieldIndex,
   filterRulesForContext,
   getIndexStats,
   getRuleById,
   getRulesByCategory,
   getRulesByField,
   getRulesByFields,
   getRulesByPriority,
   getRulesByPriorityRange,
   getRulesByTag,
   getRulesByTags,
   type IndexOptions,
   type OptimizationSuggestion,
   type PriorityIndex,
   type RuleIndex,
   type TagIndex,
} from "./optimizer/index-builder.ts";
export {
   cloneRule,
   deserializeRule,
   deserializeRuleSet,
   diffRuleSets,
   type ExportFormat,
   exportRules,
   exportToJson,
   type ImportOptions,
   type ImportResult,
   importFromJson,
   importRules,
   mergeRuleSets,
   type SerializedRule,
   type SerializedRuleSet,
   serializeRule,
   serializeRuleSet,
} from "./serialization/serializer.ts";
export {
   type BatchSimulationResult,
   batchSimulate,
   findRulesAffectedByContextChange,
   formatSimulationResult,
   type SimulationContext,
   type SimulationResult,
   simulate,
   simulateSingleRule,
   type WhatIfResult,
   whatIf,
} from "./simulation/simulator.ts";
export type {
   CacheConfig,
   EngineConfig,
   EngineHooks,
   Logger,
   LogLevel,
   ResolvedEngineConfig,
   ValidationConfig,
   VersioningConfig,
} from "./types/config.ts";
export {
   DEFAULT_CACHE_CONFIG,
   DEFAULT_ENGINE_CONFIG,
   DEFAULT_VALIDATION_CONFIG,
   DEFAULT_VERSIONING_CONFIG,
} from "./types/config.ts";
export type {
   AggregatedConsequence,
   Consequence,
   ConsequenceDefinitions,
   ConsequenceInput,
   DefaultConsequences,
   InferConsequencePayload,
   InferConsequenceType,
} from "./types/consequence.ts";
export type {
   ConflictResolutionStrategy,
   EngineExecutionResult,
   EvaluateConfig,
   EvaluateOptions,
   EvaluationContext,
   RuleEvaluationResult,
} from "./types/evaluation.ts";
export type {
   Rule,
   RuleFilters,
   RuleInput,
   RuleSchemaType,
   RuleSet,
   RuleSetInput,
   RuleSetSchemaType,
} from "./types/rule.ts";
export { RuleSchema, RuleSetSchema } from "./types/rule.ts";
export type {
   CacheStats,
   EngineState,
   EngineStats,
   MutableEngineState,
   MutableOptimizerState,
   MutableRuleStats,
   OptimizerState,
   RuleStats,
} from "./types/state.ts";
export {
   createInitialOptimizerState,
   createInitialRuleStats,
   createInitialState,
} from "./types/state.ts";
export { hashContext, hashRules } from "./utils/hash.ts";
export { generateId } from "./utils/id.ts";
export { always, compose, identity, pipe, tap } from "./utils/pipe.ts";
export {
   delay,
   measureTime,
   measureTimeAsync,
   type TimingResult,
   withTimeout,
} from "./utils/time.ts";
export {
   type Conflict,
   type ConflictDetectionOptions,
   type ConflictType,
   detectConflicts,
   formatConflicts,
   getConflictsBySeverity,
   getConflictsByType,
   hasConflicts,
   hasErrors,
} from "./validation/conflicts.ts";
export {
   checkIntegrity,
   checkRuleFieldCoverage,
   formatIntegrityResult,
   getUsedFields,
   getUsedOperators,
   type IntegrityCheckOptions,
   type IntegrityCheckResult,
   type IntegrityIssue,
} from "./validation/integrity.ts";
export {
   createRuleValidator,
   parseRule,
   safeParseRule,
   type ValidationError,
   type ValidationOptions,
   type ValidationResult,
   validateConditions,
   validateRule,
   validateRuleSet,
   validateRules,
} from "./validation/schema.ts";
export {
   addVersion,
   compareVersions,
   createVersionStore,
   formatVersionHistory,
   getAllVersions,
   getHistory,
   getLatestVersion,
   getVersion,
   getVersionsByChangeType,
   getVersionsByDateRange,
   pruneOldVersions,
   type RuleVersion,
   rollbackToVersion,
   type VersionHistory,
   type VersionStore,
} from "./versioning/version-store.ts";
