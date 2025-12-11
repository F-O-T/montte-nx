// =============================================================================
// Evaluation Functions
// =============================================================================
export {
   evaluate,
   evaluateCondition,
   evaluateConditionGroup,
   evaluateConditions,
} from "./evaluator";

// =============================================================================
// Low-level Operator Functions
// =============================================================================
export {
   evaluateArray,
   evaluateBoolean,
   evaluateConditionValue,
   evaluateDate,
   evaluateNumber,
   evaluateString,
} from "./operators";

// =============================================================================
// Static Analysis
// =============================================================================
export { extractDependencies } from "./dependencies";
export type { DependencyInfo } from "./dependencies";

// =============================================================================
// Plugin System
// =============================================================================
export { createOperator, createEvaluator } from "./plugins";
export type {
   CustomOperatorConfig,
   OperatorMap,
   EvaluatorConfig,
   CustomCondition as PluginCustomCondition,
   ConditionType,
   InferOperatorNames,
} from "./plugins";

// =============================================================================
// Schemas & Types
// =============================================================================
export type {
   ConditionGroupInput,
   GroupEvaluationResultInput,
} from "./schemas";

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
   isConditionGroup,
   LogicalOperator,
   NumberCondition,
   NumberOperator,
   StringCondition,
   StringOperator,
} from "./schemas";
