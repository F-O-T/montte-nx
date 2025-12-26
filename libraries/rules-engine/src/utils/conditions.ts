import {
   type Condition,
   type ConditionGroup,
   isConditionGroup,
} from "@f-o-t/condition-evaluator";

/**
 * Collects all unique field names from a condition tree.
 * Traverses nested condition groups recursively.
 */
export const collectConditionFields = (
   condition: ConditionGroup,
): Set<string> => {
   const fields = new Set<string>();

   const traverse = (c: Condition | ConditionGroup) => {
      if (isConditionGroup(c)) {
         for (const child of c.conditions) {
            traverse(child as Condition | ConditionGroup);
         }
      } else {
         fields.add(c.field);
      }
   };

   traverse(condition);
   return fields;
};

/**
 * Collects all unique operators from a condition tree.
 * Returns a map of operator to its type (e.g., "equals" -> "string").
 */
export const collectConditionOperators = (
   condition: ConditionGroup,
): Map<string, Set<string>> => {
   const operators = new Map<string, Set<string>>();

   const traverse = (c: Condition | ConditionGroup) => {
      if (isConditionGroup(c)) {
         for (const child of c.conditions) {
            traverse(child as Condition | ConditionGroup);
         }
      } else {
         const existing = operators.get(c.operator) ?? new Set<string>();
         existing.add(c.type);
         operators.set(c.operator, existing);
      }
   };

   traverse(condition);
   return operators;
};

/**
 * Counts the total number of leaf conditions in a condition tree.
 */
export const countConditions = (
   condition: Condition | ConditionGroup,
): number => {
   if (isConditionGroup(condition)) {
      return condition.conditions.reduce(
         (sum, c) => sum + countConditions(c as Condition | ConditionGroup),
         0,
      );
   }
   return 1;
};

/**
 * Calculates the maximum depth of a condition tree.
 */
export const calculateMaxDepth = (
   condition: Condition | ConditionGroup,
   currentDepth = 1,
): number => {
   if (isConditionGroup(condition)) {
      if (condition.conditions.length === 0) return currentDepth;
      return Math.max(
         ...condition.conditions.map((c) =>
            calculateMaxDepth(
               c as Condition | ConditionGroup,
               currentDepth + 1,
            ),
         ),
      );
   }
   return currentDepth;
};

/**
 * Counts the number of condition groups in a condition tree.
 */
export const countConditionGroups = (
   condition: Condition | ConditionGroup,
): number => {
   if (isConditionGroup(condition)) {
      return (
         1 +
         condition.conditions.reduce(
            (sum, c) =>
               sum + countConditionGroups(c as Condition | ConditionGroup),
            0,
         )
      );
   }
   return 0;
};
