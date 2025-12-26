// =============================================================================
// Evaluation Functions
// =============================================================================

export type { EvaluationOptions } from "./evaluator";
export {
   EvaluationOptionsSchema,
   evaluate,
   evaluateCondition,
   evaluateConditionGroup,
   evaluateConditions,
   evaluateConditionValue,
   isConditionGroup,
} from "./evaluator";

// =============================================================================
// Static Analysis
// =============================================================================

export type { DependencyInfo } from "./dependencies";
export { DependencyInfoSchema, extractDependencies } from "./dependencies";

// =============================================================================
// Low-level Operator Functions
// =============================================================================

export { evaluateArray } from "./operators/array";
export { evaluateBoolean } from "./operators/boolean";
export { evaluateDate } from "./operators/date";
export { evaluateNumber } from "./operators/number";
export { evaluateString } from "./operators/string";

// =============================================================================
// Plugin System
// =============================================================================

export { createEvaluator } from "./plugins/create-evaluator";
export { createOperator } from "./plugins/create-operator";
export type {
   ConditionType,
   CustomCondition as PluginCustomCondition,
   CustomOperatorConfig,
   CustomOperatorConfigData,
   EvaluatorConfig,
   EvaluatorConfigData,
   InferOperatorNames,
   OperatorMap,
   PluginCustomConditionOptions,
} from "./plugins/types";
export {
   ConditionTypeSchema,
   CustomOperatorConfigDataSchema,
   EvaluatorConfigSchema,
   PluginCustomConditionOptionsSchema,
   PluginCustomConditionSchema,
} from "./plugins/types";

// =============================================================================
// Schemas & Types
// =============================================================================

export {
   ArrayCondition,
   ArrayOperator,
   BooleanCondition,
   BooleanOperator,
   Condition,
   ConditionGroup,
   CustomCondition,
   DateCondition,
   DateOperator,
   DiffAnalysis,
   EvaluationContext,
   EvaluationMetadata,
   EvaluationResult,
   GroupEvaluationResult,
   LogicalOperator,
   NumberCondition,
   NumberOperator,
   StringCondition,
   StringOperator,
} from "./schemas";

// =============================================================================
// Shared Utilities
// =============================================================================

export {
   calculateDiff,
   formatValue,
   generateReason,
   getNestedValue,
   getWeight,
} from "./utils";
