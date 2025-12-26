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
   "one_of",
   "not_one_of",
   "contains_any",
   "contains_all",
   "ilike",
   "not_ilike",
]);

export type StringOperator = z.infer<typeof StringOperator>;

export const StringCondition = z.object({
   id: z.string(),
   type: z.literal("string"),
   field: z.string(),
   operator: StringOperator,
   value: z.union([z.string(), z.array(z.string())]).optional(),
   valueRef: z.string().optional(),
   options: z
      .object({
         caseSensitive: z.boolean().optional(),
         negate: z.boolean().optional(),
         trim: z.boolean().optional(),
         weight: z.number().min(0).optional(),
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

export const NumberCondition = z
   .object({
      id: z.string(),
      type: z.literal("number"),
      field: z.string(),
      operator: NumberOperator,
      value: z
         .union([z.number(), z.tuple([z.number(), z.number()])])
         .optional(),
      valueRef: z.string().optional(),
      options: z
         .object({
            negate: z.boolean().optional(),
            weight: z.number().min(0).optional(),
         })
         .optional(),
   })
   .refine(
      (data) => {
         if (data.operator === "between" || data.operator === "not_between") {
            return data.value !== undefined;
         }
         return data.value !== undefined || data.valueRef !== undefined;
      },
      { message: "Either 'value' or 'valueRef' must be provided" },
   );

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
   valueRef: z.string().optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
         weight: z.number().min(0).optional(),
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
   valueRef: z.string().optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
         weight: z.number().min(0).optional(),
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
   valueRef: z.string().optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
         weight: z.number().min(0).optional(),
      })
      .optional(),
});

export type ArrayCondition = z.infer<typeof ArrayCondition>;

// =============================================================================
// Custom Condition (for plugin system)
// =============================================================================

export const CustomCondition = z.object({
   id: z.string(),
   type: z.literal("custom"),
   field: z.string(),
   operator: z.string(),
   value: z.unknown().optional(),
   valueRef: z.string().optional(),
   options: z
      .object({
         negate: z.boolean().optional(),
         weight: z.number().min(0).optional(),
      })
      .passthrough()
      .optional(),
});

export type CustomCondition = z.infer<typeof CustomCondition>;

// =============================================================================
// Condition (Discriminated Union)
// =============================================================================

const BaseCondition = z.discriminatedUnion("type", [
   StringCondition,
   NumberCondition,
   BooleanCondition,
   DateCondition,
   ArrayCondition,
]);

export const Condition = z.union([BaseCondition, CustomCondition]);

export type Condition = z.infer<typeof Condition>;

// =============================================================================
// Condition Group (Recursive)
// =============================================================================

export const LogicalOperator = z.enum(["AND", "OR"]);

export type LogicalOperator = z.infer<typeof LogicalOperator>;

// Recursive type for ConditionGroup - the Zod schema is self-referential
// We define the base shape first, then use z.lazy for recursion
const ConditionGroupBase = z.object({
   id: z.string(),
   operator: LogicalOperator,
   scoringMode: z.enum(["binary", "weighted"]).optional(),
   threshold: z.number().optional(),
   weight: z.number().min(0).optional(),
});

type ConditionGroupShape = z.infer<typeof ConditionGroupBase> & {
   conditions: (Condition | ConditionGroupShape)[];
};

export const ConditionGroup: z.ZodType<ConditionGroupShape> = z.lazy(() =>
   ConditionGroupBase.extend({
      conditions: z.array(z.union([Condition, ConditionGroup])),
   }),
);

export type ConditionGroup = z.infer<typeof ConditionGroup>;

// =============================================================================
// Evaluation Results
// =============================================================================

export const EvaluationMetadata = z.object({
   valueSource: z.enum(["static", "reference"]),
   resolvedRef: z.string().optional(),
});

export type EvaluationMetadata = z.infer<typeof EvaluationMetadata>;

export const NumericDiff = z.object({
   type: z.literal("numeric"),
   applicable: z.literal(true),
   numericDistance: z.number(),
   proximity: z.number(),
});

export const DateDiff = z.object({
   type: z.literal("date"),
   applicable: z.literal(true),
   milliseconds: z.number(),
   humanReadable: z.string(),
});

export const NotApplicableDiff = z.object({
   type: z.enum(["numeric", "date", "string", "boolean", "array"]),
   applicable: z.literal(false),
});

export const DiffAnalysis = z.union([NumericDiff, DateDiff, NotApplicableDiff]);

export type DiffAnalysis = z.infer<typeof DiffAnalysis>;

export const EvaluationResult = z.object({
   conditionId: z.string(),
   passed: z.boolean(),
   field: z.string(),
   operator: z.string(),
   actualValue: z.unknown(),
   expectedValue: z.unknown().optional(),
   error: z.string().optional(),
   reason: z.string().optional(),
   metadata: EvaluationMetadata.optional(),
   diff: DiffAnalysis.optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResult>;

// Recursive type for GroupEvaluationResult - the Zod schema is self-referential
const GroupEvaluationResultBase = z.object({
   groupId: z.string(),
   operator: LogicalOperator,
   passed: z.boolean(),
   scoringMode: z.enum(["binary", "weighted"]).optional(),
   totalScore: z.number().optional(),
   maxPossibleScore: z.number().optional(),
   threshold: z.number().optional(),
   scorePercentage: z.number().optional(),
});

type GroupEvaluationResultShape = z.infer<typeof GroupEvaluationResultBase> & {
   results: (EvaluationResult | GroupEvaluationResultShape)[];
};

export const GroupEvaluationResult: z.ZodType<GroupEvaluationResultShape> =
   z.lazy(() =>
      GroupEvaluationResultBase.extend({
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
