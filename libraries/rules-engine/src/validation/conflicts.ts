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

export type ConflictType =
   | "DUPLICATE_ID"
   | "DUPLICATE_CONDITIONS"
   | "OVERLAPPING_CONDITIONS"
   | "CONTRADICTORY_CONSEQUENCES"
   | "PRIORITY_COLLISION"
   | "UNREACHABLE_RULE";

export type Conflict<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly type: ConflictType;
   readonly severity: "error" | "warning" | "info";
   readonly message: string;
   readonly ruleIds: ReadonlyArray<string>;
   readonly rules: ReadonlyArray<Rule<TContext, TConsequences>>;
   readonly details?: Readonly<Record<string, unknown>>;
};

export type ConflictDetectionOptions = {
   readonly checkDuplicateIds?: boolean;
   readonly checkDuplicateConditions?: boolean;
   readonly checkOverlappingConditions?: boolean;
   readonly checkPriorityCollisions?: boolean;
   readonly checkUnreachableRules?: boolean;
};

const DEFAULT_OPTIONS: ConflictDetectionOptions = {
   checkDuplicateIds: true,
   checkDuplicateConditions: true,
   checkOverlappingConditions: true,
   checkPriorityCollisions: true,
   checkUnreachableRules: true,
};

const collectConditionFields = (
   condition: Condition | ConditionGroup,
): Set<string> => {
   const fields = new Set<string>();

   if (isConditionGroup(condition)) {
      for (const child of condition.conditions) {
         const childFields = collectConditionFields(
            child as Condition | ConditionGroup,
         );
         for (const field of childFields) {
            fields.add(field);
         }
      }
   } else {
      fields.add(condition.field);
   }

   return fields;
};

const hashConditionGroup = (condition: ConditionGroup): string => {
   const serialize = (c: Condition | ConditionGroup): string => {
      if (isConditionGroup(c)) {
         const sortedConditions = [...c.conditions]
            .map((child) => serialize(child as Condition | ConditionGroup))
            .sort();
         return `GROUP:${c.operator}:[${sortedConditions.join(",")}]`;
      }
      return `COND:${c.type}:${c.field}:${c.operator}:${JSON.stringify(c.value)}`;
   };
   return serialize(condition);
};

const getConditionOperatorValues = (
   condition: ConditionGroup,
   field: string,
): Array<{ operator: string; value: unknown }> => {
   const results: Array<{ operator: string; value: unknown }> = [];

   const traverse = (c: Condition | ConditionGroup) => {
      if (isConditionGroup(c)) {
         for (const child of c.conditions) {
            traverse(child as Condition | ConditionGroup);
         }
      } else if (c.field === field) {
         results.push({ operator: c.operator, value: c.value });
      }
   };

   traverse(condition);
   return results;
};

const areConditionsOverlapping = (
   conditions1: ConditionGroup,
   conditions2: ConditionGroup,
): boolean => {
   const fields1 = collectConditionFields(conditions1);
   const fields2 = collectConditionFields(conditions2);

   const commonFields = new Set([...fields1].filter((f) => fields2.has(f)));
   if (commonFields.size === 0) return false;

   for (const field of commonFields) {
      const ops1 = getConditionOperatorValues(conditions1, field);
      const ops2 = getConditionOperatorValues(conditions2, field);

      for (const op1 of ops1) {
         for (const op2 of ops2) {
            if (op1.operator === op2.operator && op1.value === op2.value) {
               return true;
            }

            if (
               (op1.operator === "gt" && op2.operator === "lt") ||
               (op1.operator === "lt" && op2.operator === "gt") ||
               (op1.operator === "gte" && op2.operator === "lte") ||
               (op1.operator === "lte" && op2.operator === "gte")
            ) {
               const val1 = op1.value as number;
               const val2 = op2.value as number;
               if (typeof val1 === "number" && typeof val2 === "number") {
                  if (op1.operator === "gt" && op2.operator === "lt") {
                     if (val1 < val2) return true;
                  }
                  if (op1.operator === "lt" && op2.operator === "gt") {
                     if (val1 > val2) return true;
                  }
               }
            }
         }
      }
   }

   return false;
};

const findDuplicateIds = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   const conflicts: Conflict<TContext, TConsequences>[] = [];
   const idMap = new Map<string, Rule<TContext, TConsequences>[]>();

   for (const rule of rules) {
      const existing = idMap.get(rule.id) ?? [];
      existing.push(rule);
      idMap.set(rule.id, existing);
   }

   for (const [id, duplicates] of idMap) {
      if (duplicates.length > 1) {
         conflicts.push({
            type: "DUPLICATE_ID",
            severity: "error",
            message: `Multiple rules share the same ID: ${id}`,
            ruleIds: duplicates.map((r) => r.id),
            rules: duplicates,
            details: { duplicateId: id, count: duplicates.length },
         });
      }
   }

   return conflicts;
};

const findDuplicateConditions = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   const conflicts: Conflict<TContext, TConsequences>[] = [];
   const hashMap = new Map<string, Rule<TContext, TConsequences>[]>();

   for (const rule of rules) {
      const hash = hashConditionGroup(rule.conditions);
      const existing = hashMap.get(hash) ?? [];
      existing.push(rule);
      hashMap.set(hash, existing);
   }

   for (const [hash, duplicates] of hashMap) {
      if (duplicates.length > 1) {
         conflicts.push({
            type: "DUPLICATE_CONDITIONS",
            severity: "warning",
            message: `Multiple rules have identical conditions: ${duplicates.map((r) => r.name).join(", ")}`,
            ruleIds: duplicates.map((r) => r.id),
            rules: duplicates,
            details: { conditionHash: hash, count: duplicates.length },
         });
      }
   }

   return conflicts;
};

const findOverlappingConditions = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   const conflicts: Conflict<TContext, TConsequences>[] = [];
   const checked = new Set<string>();

   for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
         const rule1 = rules[i];
         const rule2 = rules[j];
         if (!rule1 || !rule2) continue;
         const key = [rule1.id, rule2.id].sort().join(":");

         if (checked.has(key)) continue;
         checked.add(key);

         if (areConditionsOverlapping(rule1.conditions, rule2.conditions)) {
            conflicts.push({
               type: "OVERLAPPING_CONDITIONS",
               severity: "info",
               message: `Rules "${rule1.name}" and "${rule2.name}" have overlapping conditions`,
               ruleIds: [rule1.id, rule2.id],
               rules: [rule1, rule2],
               details: {
                  rule1Fields: [...collectConditionFields(rule1.conditions)],
                  rule2Fields: [...collectConditionFields(rule2.conditions)],
               },
            });
         }
      }
   }

   return conflicts;
};

const findPriorityCollisions = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   const conflicts: Conflict<TContext, TConsequences>[] = [];
   const priorityMap = new Map<number, Rule<TContext, TConsequences>[]>();

   for (const rule of rules) {
      const existing = priorityMap.get(rule.priority) ?? [];
      existing.push(rule);
      priorityMap.set(rule.priority, existing);
   }

   for (const [priority, rulesWithPriority] of priorityMap) {
      if (rulesWithPriority.length > 1) {
         const overlappingPairs: Set<string> = new Set();

         for (let i = 0; i < rulesWithPriority.length; i++) {
            for (let j = i + 1; j < rulesWithPriority.length; j++) {
               const r1 = rulesWithPriority[i];
               const r2 = rulesWithPriority[j];
               if (!r1 || !r2) continue;
               if (areConditionsOverlapping(r1.conditions, r2.conditions)) {
                  overlappingPairs.add(r1.id);
                  overlappingPairs.add(r2.id);
               }
            }
         }

         if (overlappingPairs.size > 1) {
            const overlapping = rulesWithPriority.filter((r) =>
               overlappingPairs.has(r.id),
            );
            conflicts.push({
               type: "PRIORITY_COLLISION",
               severity: "warning",
               message: `Multiple overlapping rules share priority ${priority}: ${overlapping.map((r) => r.name).join(", ")}`,
               ruleIds: overlapping.map((r) => r.id),
               rules: overlapping,
               details: { priority, count: overlapping.length },
            });
         }
      }
   }

   return conflicts;
};

const findUnreachableRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   const conflicts: Conflict<TContext, TConsequences>[] = [];
   const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

   for (let i = 0; i < sortedRules.length; i++) {
      const rule = sortedRules[i];
      if (!rule) continue;

      if (!rule.enabled) continue;

      for (let j = 0; j < i; j++) {
         const higherPriorityRule = sortedRules[j];
         if (!higherPriorityRule) continue;

         if (!higherPriorityRule.enabled || !higherPriorityRule.stopOnMatch) {
            continue;
         }

         if (
            hashConditionGroup(rule.conditions) ===
            hashConditionGroup(higherPriorityRule.conditions)
         ) {
            conflicts.push({
               type: "UNREACHABLE_RULE",
               severity: "warning",
               message: `Rule "${rule.name}" may be unreachable because rule "${higherPriorityRule.name}" has higher priority and stops on match`,
               ruleIds: [rule.id, higherPriorityRule.id],
               rules: [rule, higherPriorityRule],
               details: {
                  unreachableRule: rule.id,
                  blockingRule: higherPriorityRule.id,
                  priorityDifference:
                     higherPriorityRule.priority - rule.priority,
               },
            });
         }
      }
   }

   return conflicts;
};

export const detectConflicts = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   options: ConflictDetectionOptions = {},
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   const opts = { ...DEFAULT_OPTIONS, ...options };
   const conflicts: Conflict<TContext, TConsequences>[] = [];

   if (opts.checkDuplicateIds) {
      conflicts.push(...findDuplicateIds(rules));
   }

   if (opts.checkDuplicateConditions) {
      conflicts.push(...findDuplicateConditions(rules));
   }

   if (opts.checkOverlappingConditions) {
      conflicts.push(...findOverlappingConditions(rules));
   }

   if (opts.checkPriorityCollisions) {
      conflicts.push(...findPriorityCollisions(rules));
   }

   if (opts.checkUnreachableRules) {
      conflicts.push(...findUnreachableRules(rules));
   }

   return conflicts;
};

export const hasConflicts = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   options: ConflictDetectionOptions = {},
): boolean => {
   return detectConflicts(rules, options).length > 0;
};

export const hasErrors = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   options: ConflictDetectionOptions = {},
): boolean => {
   return detectConflicts(rules, options).some((c) => c.severity === "error");
};

export const getConflictsByType = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   conflicts: ReadonlyArray<Conflict<TContext, TConsequences>>,
   type: ConflictType,
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   return conflicts.filter((c) => c.type === type);
};

export const getConflictsBySeverity = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   conflicts: ReadonlyArray<Conflict<TContext, TConsequences>>,
   severity: "error" | "warning" | "info",
): ReadonlyArray<Conflict<TContext, TConsequences>> => {
   return conflicts.filter((c) => c.severity === severity);
};

export const formatConflicts = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   conflicts: ReadonlyArray<Conflict<TContext, TConsequences>>,
): string => {
   if (conflicts.length === 0) {
      return "No conflicts detected";
   }

   const lines: string[] = [`Found ${conflicts.length} conflict(s):`];

   for (const conflict of conflicts) {
      const severityIcon =
         conflict.severity === "error"
            ? "[ERROR]"
            : conflict.severity === "warning"
              ? "[WARN]"
              : "[INFO]";
      lines.push(`  ${severityIcon} ${conflict.type}: ${conflict.message}`);
   }

   return lines.join("\n");
};
