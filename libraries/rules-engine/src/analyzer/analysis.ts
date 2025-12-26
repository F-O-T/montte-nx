import {
   type Condition,
   type ConditionGroup,
   isConditionGroup,
} from "@f-o-t/condition-evaluator";
import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { Rule } from "../types/rule";
import {
   calculateMaxDepth,
   collectConditionFields,
   countConditionGroups,
   countConditions,
} from "../utils/conditions";

export type RuleComplexity = {
   readonly ruleId: string;
   readonly ruleName: string;
   readonly totalConditions: number;
   readonly maxDepth: number;
   readonly groupCount: number;
   readonly uniqueFields: number;
   readonly uniqueOperators: number;
   readonly consequenceCount: number;
   readonly complexityScore: number;
};

export type RuleSetAnalysis = {
   readonly ruleCount: number;
   readonly enabledCount: number;
   readonly disabledCount: number;
   readonly totalConditions: number;
   readonly totalConsequences: number;
   readonly uniqueFields: ReadonlyArray<string>;
   readonly uniqueOperators: ReadonlyArray<string>;
   readonly uniqueConsequenceTypes: ReadonlyArray<string>;
   readonly uniqueCategories: ReadonlyArray<string>;
   readonly uniqueTags: ReadonlyArray<string>;
   readonly priorityRange: { min: number; max: number };
   readonly averageComplexity: number;
   readonly complexityDistribution: {
      readonly low: number;
      readonly medium: number;
      readonly high: number;
   };
   readonly ruleComplexities: ReadonlyArray<RuleComplexity>;
};

export type FieldUsage = {
   readonly field: string;
   readonly count: number;
   readonly types: ReadonlyArray<string>;
   readonly operators: ReadonlyArray<string>;
   readonly rules: ReadonlyArray<{ id: string; name: string }>;
};

export type OperatorUsage = {
   readonly operator: string;
   readonly type: string;
   readonly count: number;
   readonly rules: ReadonlyArray<{ id: string; name: string }>;
};

export type ConsequenceUsage = {
   readonly type: string;
   readonly count: number;
   readonly rules: ReadonlyArray<{ id: string; name: string }>;
};

const collectOperators = (
   condition: Condition | ConditionGroup,
): Set<string> => {
   const operators = new Set<string>();

   const traverse = (c: Condition | ConditionGroup) => {
      if (isConditionGroup(c)) {
         operators.add(c.operator);
         for (const child of c.conditions) {
            traverse(child as Condition | ConditionGroup);
         }
      } else {
         operators.add(c.operator);
      }
   };

   traverse(condition);
   return operators;
};

const calculateComplexityScore = (
   totalConditions: number,
   maxDepth: number,
   groupCount: number,
   uniqueFields: number,
): number => {
   return (
      totalConditions * 1 + maxDepth * 2 + groupCount * 1.5 + uniqueFields * 0.5
   );
};

export const analyzeRuleComplexity = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: Rule<TContext, TConsequences>,
): RuleComplexity => {
   const totalConditions = countConditions(rule.conditions);
   const maxDepth = calculateMaxDepth(rule.conditions);
   const groupCount = countConditionGroups(rule.conditions);
   const uniqueFields = collectConditionFields(rule.conditions).size;
   const uniqueOperators = collectOperators(rule.conditions).size;
   const consequenceCount = rule.consequences.length;

   const complexityScore = calculateComplexityScore(
      totalConditions,
      maxDepth,
      groupCount,
      uniqueFields,
   );

   return {
      ruleId: rule.id,
      ruleName: rule.name,
      totalConditions,
      maxDepth,
      groupCount,
      uniqueFields,
      uniqueOperators,
      consequenceCount,
      complexityScore,
   };
};

export const analyzeRuleSet = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): RuleSetAnalysis => {
   const complexities = rules.map(analyzeRuleComplexity);

   const allFields = new Set<string>();
   const allOperators = new Set<string>();
   const allConsequenceTypes = new Set<string>();
   const allCategories = new Set<string>();
   const allTags = new Set<string>();

   let totalConditions = 0;
   let totalConsequences = 0;
   let minPriority = Number.POSITIVE_INFINITY;
   let maxPriority = Number.NEGATIVE_INFINITY;
   let enabledCount = 0;

   for (const rule of rules) {
      totalConditions += countConditions(rule.conditions);
      totalConsequences += rule.consequences.length;

      if (rule.priority < minPriority) minPriority = rule.priority;
      if (rule.priority > maxPriority) maxPriority = rule.priority;

      if (rule.enabled) enabledCount++;

      for (const field of collectConditionFields(rule.conditions)) {
         allFields.add(field);
      }

      for (const operator of collectOperators(rule.conditions)) {
         allOperators.add(operator);
      }

      for (const consequence of rule.consequences) {
         allConsequenceTypes.add(consequence.type as string);
      }

      if (rule.category) allCategories.add(rule.category);
      for (const tag of rule.tags) allTags.add(tag);
   }

   const averageComplexity =
      complexities.length > 0
         ? complexities.reduce((sum, c) => sum + c.complexityScore, 0) /
           complexities.length
         : 0;

   const complexityDistribution = {
      low: complexities.filter((c) => c.complexityScore < 5).length,
      medium: complexities.filter(
         (c) => c.complexityScore >= 5 && c.complexityScore < 15,
      ).length,
      high: complexities.filter((c) => c.complexityScore >= 15).length,
   };

   return {
      ruleCount: rules.length,
      enabledCount,
      disabledCount: rules.length - enabledCount,
      totalConditions,
      totalConsequences,
      uniqueFields: [...allFields].sort(),
      uniqueOperators: [...allOperators].sort(),
      uniqueConsequenceTypes: [...allConsequenceTypes].sort(),
      uniqueCategories: [...allCategories].sort(),
      uniqueTags: [...allTags].sort(),
      priorityRange: {
         min: minPriority === Number.POSITIVE_INFINITY ? 0 : minPriority,
         max: maxPriority === Number.NEGATIVE_INFINITY ? 0 : maxPriority,
      },
      averageComplexity,
      complexityDistribution,
      ruleComplexities: complexities,
   };
};

export const analyzeFieldUsage = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<FieldUsage> => {
   const fieldMap = new Map<
      string,
      {
         types: Set<string>;
         operators: Set<string>;
         rules: Array<{ id: string; name: string }>;
      }
   >();

   for (const rule of rules) {
      const traverse = (c: Condition | ConditionGroup) => {
         if (isConditionGroup(c)) {
            for (const child of c.conditions) {
               traverse(child as Condition | ConditionGroup);
            }
         } else {
            const existing = fieldMap.get(c.field) ?? {
               types: new Set(),
               operators: new Set(),
               rules: [],
            };
            existing.types.add(c.type);
            existing.operators.add(c.operator);
            if (!existing.rules.some((r) => r.id === rule.id)) {
               existing.rules.push({ id: rule.id, name: rule.name });
            }
            fieldMap.set(c.field, existing);
         }
      };

      traverse(rule.conditions);
   }

   return [...fieldMap.entries()]
      .map(([field, data]) => ({
         field,
         count: data.rules.length,
         types: [...data.types].sort(),
         operators: [...data.operators].sort(),
         rules: data.rules,
      }))
      .sort((a, b) => b.count - a.count);
};

export const analyzeOperatorUsage = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<OperatorUsage> => {
   const operatorMap = new Map<
      string,
      { type: string; rules: Array<{ id: string; name: string }> }
   >();

   for (const rule of rules) {
      const traverse = (c: Condition | ConditionGroup) => {
         if (isConditionGroup(c)) {
            for (const child of c.conditions) {
               traverse(child as Condition | ConditionGroup);
            }
         } else {
            const key = `${c.type}:${c.operator}`;
            const existing = operatorMap.get(key) ?? {
               type: c.type,
               rules: [],
            };
            if (!existing.rules.some((r) => r.id === rule.id)) {
               existing.rules.push({ id: rule.id, name: rule.name });
            }
            operatorMap.set(key, existing);
         }
      };

      traverse(rule.conditions);
   }

   return [...operatorMap.entries()]
      .map(([key, data]) => {
         const parts = key.split(":");
         return {
            operator: parts[1] ?? "",
            type: data.type,
            count: data.rules.length,
            rules: data.rules,
         };
      })
      .sort((a, b) => b.count - a.count);
};

export const analyzeConsequenceUsage = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<ConsequenceUsage> => {
   const consequenceMap = new Map<
      string,
      Array<{ id: string; name: string }>
   >();

   for (const rule of rules) {
      for (const consequence of rule.consequences) {
         const type = consequence.type as string;
         const existing = consequenceMap.get(type) ?? [];
         if (!existing.some((r) => r.id === rule.id)) {
            existing.push({ id: rule.id, name: rule.name });
         }
         consequenceMap.set(type, existing);
      }
   }

   return [...consequenceMap.entries()]
      .map(([type, rules]) => ({
         type,
         count: rules.length,
         rules,
      }))
      .sort((a, b) => b.count - a.count);
};

export const findMostComplexRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   limit = 10,
): ReadonlyArray<RuleComplexity> => {
   return rules
      .map(analyzeRuleComplexity)
      .sort((a, b) => b.complexityScore - a.complexityScore)
      .slice(0, limit);
};

export const findLeastUsedFields = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   limit = 10,
): ReadonlyArray<FieldUsage> => {
   return [...analyzeFieldUsage(rules)]
      .sort((a, b) => a.count - b.count)
      .slice(0, limit);
};

export const formatRuleSetAnalysis = (analysis: RuleSetAnalysis): string => {
   const lines: string[] = [
      "=== Rule Set Analysis ===",
      "",
      `Rules: ${analysis.ruleCount} (${analysis.enabledCount} enabled, ${analysis.disabledCount} disabled)`,
      `Total Conditions: ${analysis.totalConditions}`,
      `Total Consequences: ${analysis.totalConsequences}`,
      "",
      `Unique Fields: ${analysis.uniqueFields.length}`,
      `  ${analysis.uniqueFields.join(", ") || "(none)"}`,
      "",
      `Unique Operators: ${analysis.uniqueOperators.length}`,
      `  ${analysis.uniqueOperators.join(", ") || "(none)"}`,
      "",
      `Consequence Types: ${analysis.uniqueConsequenceTypes.length}`,
      `  ${analysis.uniqueConsequenceTypes.join(", ") || "(none)"}`,
      "",
      `Categories: ${analysis.uniqueCategories.length}`,
      `  ${analysis.uniqueCategories.join(", ") || "(none)"}`,
      "",
      `Tags: ${analysis.uniqueTags.length}`,
      `  ${analysis.uniqueTags.join(", ") || "(none)"}`,
      "",
      `Priority Range: ${analysis.priorityRange.min} - ${analysis.priorityRange.max}`,
      "",
      `Average Complexity: ${analysis.averageComplexity.toFixed(2)}`,
      `Complexity Distribution:`,
      `  Low (< 5): ${analysis.complexityDistribution.low}`,
      `  Medium (5-15): ${analysis.complexityDistribution.medium}`,
      `  High (> 15): ${analysis.complexityDistribution.high}`,
   ];

   return lines.join("\n");
};
