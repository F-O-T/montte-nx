// =============================================================================
// Evaluation Functions
// =============================================================================

export type { DependencyInfo } from "./dependencies";
// =============================================================================
// Static Analysis
// =============================================================================
export { extractDependencies } from "./dependencies";
export {
   evaluate,
   evaluateCondition,
   evaluateConditionGroup,
   evaluateConditions,
   evaluateConditionValue,
} from "./evaluator";
// =============================================================================
// Low-level Operator Functions
// =============================================================================
export { evaluateArray } from "./operators/array";
export { evaluateBoolean } from "./operators/boolean";
export { evaluateDate } from "./operators/date";
export { evaluateNumber } from "./operators/number";
export { evaluateString } from "./operators/string";
export { createEvaluator } from "./plugins/create-evaluator";
// =============================================================================
// Plugin System
// =============================================================================
export { createOperator } from "./plugins/create-operator";
export type {
   ConditionType,
   CustomCondition as PluginCustomCondition,
   CustomOperatorConfig,
   EvaluatorConfig,
   InferOperatorNames,
   OperatorMap,
} from "./plugins/types";

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
