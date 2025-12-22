import {
   type Condition,
   type ConditionGroup,
   isConditionGroup,
} from "@f-o-t/condition-evaluator";
import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence.ts";
import { type Rule, RuleSchema, RuleSetSchema } from "../types/rule.ts";

export type ValidationError = {
   readonly path: string;
   readonly message: string;
   readonly code: string;
};

export type ValidationResult = {
   readonly valid: boolean;
   readonly errors: ReadonlyArray<ValidationError>;
};

export type ValidationOptions = {
   readonly validateConditions?: boolean;
   readonly validateConsequences?: boolean;
   readonly strictMode?: boolean;
};

const DEFAULT_OPTIONS: ValidationOptions = {
   validateConditions: true,
   validateConsequences: true,
   strictMode: false,
};

const createError = (
   path: string,
   message: string,
   code: string,
): ValidationError => ({
   path,
   message,
   code,
});

const validResult = (): ValidationResult => ({
   valid: true,
   errors: [],
});

const invalidResult = (
   errors: ReadonlyArray<ValidationError>,
): ValidationResult => ({
   valid: false,
   errors,
});

const validateConditionStructure = (
   condition: Condition | ConditionGroup,
   path: string,
): ReadonlyArray<ValidationError> => {
   const errors: ValidationError[] = [];

   if (isConditionGroup(condition)) {
      if (!condition.id || typeof condition.id !== "string") {
         errors.push(
            createError(
               `${path}.id`,
               "Condition group must have a string id",
               "MISSING_GROUP_ID",
            ),
         );
      }

      if (!["AND", "OR"].includes(condition.operator)) {
         errors.push(
            createError(
               `${path}.operator`,
               `Invalid operator: ${condition.operator}. Must be "AND" or "OR"`,
               "INVALID_GROUP_OPERATOR",
            ),
         );
      }

      if (!Array.isArray(condition.conditions)) {
         errors.push(
            createError(
               `${path}.conditions`,
               "Condition group must have a conditions array",
               "MISSING_CONDITIONS_ARRAY",
            ),
         );
      } else if (condition.conditions.length === 0) {
         errors.push(
            createError(
               `${path}.conditions`,
               "Condition group must have at least one condition",
               "EMPTY_CONDITIONS_ARRAY",
            ),
         );
      } else {
         for (let i = 0; i < condition.conditions.length; i++) {
            const nestedErrors = validateConditionStructure(
               condition.conditions[i] as Condition | ConditionGroup,
               `${path}.conditions[${i}]`,
            );
            errors.push(...nestedErrors);
         }
      }
   } else {
      if (!condition.id || typeof condition.id !== "string") {
         errors.push(
            createError(
               `${path}.id`,
               "Condition must have a string id",
               "MISSING_CONDITION_ID",
            ),
         );
      }

      if (!condition.type || typeof condition.type !== "string") {
         errors.push(
            createError(
               `${path}.type`,
               "Condition must have a type",
               "MISSING_CONDITION_TYPE",
            ),
         );
      }

      if (!condition.field || typeof condition.field !== "string") {
         errors.push(
            createError(
               `${path}.field`,
               "Condition must have a field",
               "MISSING_CONDITION_FIELD",
            ),
         );
      }

      if (!condition.operator || typeof condition.operator !== "string") {
         errors.push(
            createError(
               `${path}.operator`,
               "Condition must have an operator",
               "MISSING_CONDITION_OPERATOR",
            ),
         );
      }
   }

   return errors;
};

const validateConsequenceStructure = <
   TConsequences extends ConsequenceDefinitions,
>(
   consequences: ReadonlyArray<{ type: unknown; payload: unknown }>,
   consequenceSchemas?: TConsequences,
   strictMode = false,
): ReadonlyArray<ValidationError> => {
   const errors: ValidationError[] = [];

   for (let i = 0; i < consequences.length; i++) {
      const consequence = consequences[i];
      if (!consequence) continue;
      const path = `consequences[${i}]`;

      if (!consequence.type || typeof consequence.type !== "string") {
         errors.push(
            createError(
               `${path}.type`,
               "Consequence must have a type",
               "MISSING_CONSEQUENCE_TYPE",
            ),
         );
         continue;
      }

      if (strictMode && consequenceSchemas) {
         const schema = consequenceSchemas[consequence.type as string];
         if (!schema) {
            errors.push(
               createError(
                  `${path}.type`,
                  `Unknown consequence type: ${consequence.type}`,
                  "UNKNOWN_CONSEQUENCE_TYPE",
               ),
            );
         } else {
            const result = schema.safeParse(consequence.payload);
            if (!result.success) {
               for (const issue of result.error.issues) {
                  errors.push(
                     createError(
                        `${path}.payload.${issue.path.join(".")}`,
                        issue.message,
                        "INVALID_CONSEQUENCE_PAYLOAD",
                     ),
                  );
               }
            }
         }
      }
   }

   return errors;
};

export const validateRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: unknown,
   options: ValidationOptions & { consequenceSchemas?: TConsequences } = {},
): ValidationResult => {
   const opts = { ...DEFAULT_OPTIONS, ...options };
   const errors: ValidationError[] = [];

   const schemaResult = RuleSchema.safeParse(rule);
   if (!schemaResult.success) {
      for (const issue of schemaResult.error.issues) {
         errors.push(
            createError(
               issue.path.join("."),
               issue.message,
               "SCHEMA_VALIDATION_FAILED",
            ),
         );
      }
      return invalidResult(errors);
   }

   const validRule = schemaResult.data as Rule<TContext, TConsequences>;

   if (opts.validateConditions) {
      const conditionErrors = validateConditionStructure(
         validRule.conditions,
         "conditions",
      );
      errors.push(...conditionErrors);
   }

   if (opts.validateConsequences) {
      const consequenceErrors = validateConsequenceStructure(
         validRule.consequences as ReadonlyArray<{
            type: unknown;
            payload: unknown;
         }>,
         opts.consequenceSchemas,
         opts.strictMode,
      );
      errors.push(...consequenceErrors);
   }

   return errors.length > 0 ? invalidResult(errors) : validResult();
};

export const validateRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<unknown>,
   options: ValidationOptions & { consequenceSchemas?: TConsequences } = {},
): ValidationResult => {
   const errors: ValidationError[] = [];

   for (let i = 0; i < rules.length; i++) {
      const result = validateRule<TContext, TConsequences>(rules[i], options);
      if (!result.valid) {
         for (const error of result.errors) {
            errors.push(
               createError(
                  `rules[${i}].${error.path}`,
                  error.message,
                  error.code,
               ),
            );
         }
      }
   }

   return errors.length > 0 ? invalidResult(errors) : validResult();
};

export const validateRuleSet = (ruleSet: unknown): ValidationResult => {
   const errors: ValidationError[] = [];

   const schemaResult = RuleSetSchema.safeParse(ruleSet);
   if (!schemaResult.success) {
      for (const issue of schemaResult.error.issues) {
         errors.push(
            createError(
               issue.path.join("."),
               issue.message,
               "SCHEMA_VALIDATION_FAILED",
            ),
         );
      }
      return invalidResult(errors);
   }

   return validResult();
};

export const validateConditions = (
   conditions: ConditionGroup,
): ValidationResult => {
   const errors = validateConditionStructure(conditions, "conditions");
   return errors.length > 0 ? invalidResult(errors) : validResult();
};

export const parseRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: unknown,
   options: ValidationOptions & { consequenceSchemas?: TConsequences } = {},
): Rule<TContext, TConsequences> => {
   const result = validateRule<TContext, TConsequences>(rule, options);
   if (!result.valid) {
      throw new Error(
         `Invalid rule: ${result.errors.map((e) => e.message).join(", ")}`,
      );
   }
   return rule as Rule<TContext, TConsequences>;
};

export const safeParseRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: unknown,
   options: ValidationOptions & { consequenceSchemas?: TConsequences } = {},
):
   | { success: true; data: Rule<TContext, TConsequences> }
   | { success: false; errors: ReadonlyArray<ValidationError> } => {
   const result = validateRule<TContext, TConsequences>(rule, options);
   if (!result.valid) {
      return { success: false, errors: result.errors };
   }
   return { success: true, data: rule as Rule<TContext, TConsequences> };
};

export const createRuleValidator = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   consequenceSchemas: TConsequences,
   defaultOptions: ValidationOptions = {},
) => {
   return {
      validate: (rule: unknown, options: ValidationOptions = {}) =>
         validateRule<TContext, TConsequences>(rule, {
            ...defaultOptions,
            ...options,
            consequenceSchemas,
         }),
      parse: (rule: unknown, options: ValidationOptions = {}) =>
         parseRule<TContext, TConsequences>(rule, {
            ...defaultOptions,
            ...options,
            consequenceSchemas,
         }),
      safeParse: (rule: unknown, options: ValidationOptions = {}) =>
         safeParseRule<TContext, TConsequences>(rule, {
            ...defaultOptions,
            ...options,
            consequenceSchemas,
         }),
   };
};
