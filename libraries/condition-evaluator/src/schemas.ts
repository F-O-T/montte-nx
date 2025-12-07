import { z } from "zod";

// =============================================================================
// String
// =============================================================================

export const StringOperator = z.enum([
   "eq",
   "neq",
   "contains",
   "not_contains",
   "starts_with",
   "ends_with",
   "matches",
   "is_empty",
   "is_not_empty",
   "in",
   "not_in",
]);

export type StringOperator = z.infer<typeof StringOperator>;

export const StringCondition = z.object({
   id: z.string(),
   type: z.literal("string"),
   field: z.string(),
   operator: StringOperator,
   value: z.union([z.string(), z.array(z.string())]).optional(),
   options: z
      .object({
         caseSensitive: z.boolean().optional(),
         negate: z.boolean().optional(),
         trim: z.boolean().optional(),
      })
      .optional(),
});

export type StringCondition = z.infer<typeof StringCondition>;

// =============================================================================
// Number
// =============================================================================

export const NumberOperator = z.enum([
   "eq",
   "neq",
   "gt",
   "gte",
   "lt",
   "lte",
   "between",
   "not_between",
]);

export type NumberOperator = z.infer<typeof NumberOperator>;

export const NumberCondition = z.object({
   id: z.string(),
   type: z.literal("number"),
   field: z.string(),
   operator: NumberOperator,
   value: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
      })
      .optional(),
});

export type NumberCondition = z.infer<typeof NumberCondition>;

// =============================================================================
// Boolean
// =============================================================================

export const BooleanOperator = z.enum(["eq", "neq", "is_true", "is_false"]);

export type BooleanOperator = z.infer<typeof BooleanOperator>;

export const BooleanCondition = z.object({
   id: z.string(),
   type: z.literal("boolean"),
   field: z.string(),
   operator: BooleanOperator,
   value: z.boolean().optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
      })
      .optional(),
});

export type BooleanCondition = z.infer<typeof BooleanCondition>;

// =============================================================================
// Date
// =============================================================================

export const DateOperator = z.enum([
   "eq",
   "neq",
   "before",
   "after",
   "between",
   "not_between",
   "is_weekend",
   "is_weekday",
   "day_of_week",
   "day_of_month",
]);

export type DateOperator = z.infer<typeof DateOperator>;

export const DateCondition = z.object({
   id: z.string(),
   type: z.literal("date"),
   field: z.string(),
   operator: DateOperator,
   value: z
      .union([
         z.string(),
         z.date(),
         z.number(),
         z.tuple([
            z.union([z.string(), z.date(), z.number()]),
            z.union([z.string(), z.date(), z.number()]),
         ]),
         z.array(z.number()),
      ])
      .optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
      })
      .optional(),
});

export type DateCondition = z.infer<typeof DateCondition>;

// =============================================================================
// Array
// =============================================================================

export const ArrayOperator = z.enum([
   "contains",
   "not_contains",
   "contains_all",
   "contains_any",
   "is_empty",
   "is_not_empty",
   "length_eq",
   "length_gt",
   "length_lt",
]);

export type ArrayOperator = z.infer<typeof ArrayOperator>;

export const ArrayCondition = z.object({
   id: z.string(),
   type: z.literal("array"),
   field: z.string(),
   operator: ArrayOperator,
   value: z.union([z.unknown(), z.array(z.unknown()), z.number()]).optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
      })
      .optional(),
});

export type ArrayCondition = z.infer<typeof ArrayCondition>;

// =============================================================================
// Condition (Discriminated Union)
// =============================================================================

export const Condition = z.discriminatedUnion("type", [
   StringCondition,
   NumberCondition,
   BooleanCondition,
   DateCondition,
   ArrayCondition,
]);

export type Condition = z.infer<typeof Condition>;

// =============================================================================
// Condition Group (Recursive)
// =============================================================================

export const LogicalOperator = z.enum(["AND", "OR"]);

export type LogicalOperator = z.infer<typeof LogicalOperator>;

export type ConditionGroupInput = {
   id: string;
   operator: LogicalOperator;
   conditions: (Condition | ConditionGroupInput)[];
};

export const ConditionGroup: z.ZodType<ConditionGroupInput> = z.lazy(() =>
   z.object({
      id: z.string(),
      operator: LogicalOperator,
      conditions: z.array(z.union([Condition, ConditionGroup])),
   }),
);

export type ConditionGroup = z.infer<typeof ConditionGroup>;

// =============================================================================
// Evaluation Results
// =============================================================================

export const EvaluationResult = z.object({
   conditionId: z.string(),
   passed: z.boolean(),
   field: z.string(),
   operator: z.string(),
   actualValue: z.unknown(),
   expectedValue: z.unknown().optional(),
   error: z.string().optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResult>;

export type GroupEvaluationResultInput = {
   groupId: string;
   operator: LogicalOperator;
   passed: boolean;
   results: (EvaluationResult | GroupEvaluationResultInput)[];
};

export const GroupEvaluationResult: z.ZodType<GroupEvaluationResultInput> =
   z.lazy(() =>
      z.object({
         groupId: z.string(),
         operator: LogicalOperator,
         passed: z.boolean(),
         results: z.array(z.union([EvaluationResult, GroupEvaluationResult])),
      }),
   );

export type GroupEvaluationResult = z.infer<typeof GroupEvaluationResult>;

// =============================================================================
// Evaluation Context
// =============================================================================

export const EvaluationContext = z.object({
   data: z.record(z.string(), z.unknown()),
   metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EvaluationContext = z.infer<typeof EvaluationContext>;

// =============================================================================
// Helper to check if item is a ConditionGroup
// =============================================================================

export function isConditionGroup(
   item: Condition | ConditionGroup,
): item is ConditionGroup {
   return "conditions" in item && "operator" in item && !("field" in item);
}
