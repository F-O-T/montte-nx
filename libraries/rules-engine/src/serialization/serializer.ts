import type { ConditionGroup } from "@f-o-t/condition-evaluator";
import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { Rule, RuleSet } from "../types/rule";
import { generateId } from "../utils/id";

export type SerializedRule = {
   readonly id: string;
   readonly name: string;
   readonly description?: string;
   readonly conditions: ConditionGroup;
   readonly consequences: ReadonlyArray<{
      type: string;
      payload: unknown;
   }>;
   readonly priority: number;
   readonly enabled: boolean;
   readonly stopOnMatch: boolean;
   readonly tags: ReadonlyArray<string>;
   readonly category?: string;
   readonly metadata?: Readonly<Record<string, unknown>>;
   readonly createdAt: string;
   readonly updatedAt: string;
};

export type SerializedRuleSet = {
   readonly id: string;
   readonly name: string;
   readonly description?: string;
   readonly ruleIds: ReadonlyArray<string>;
   readonly enabled: boolean;
   readonly metadata?: Readonly<Record<string, unknown>>;
};

export type ExportFormat = {
   readonly version: string;
   readonly exportedAt: string;
   readonly rules: ReadonlyArray<SerializedRule>;
   readonly ruleSets?: ReadonlyArray<SerializedRuleSet>;
   readonly metadata?: Readonly<Record<string, unknown>>;
};

export type ImportOptions = {
   readonly generateNewIds?: boolean;
   readonly idPrefix?: string;
   readonly preserveDates?: boolean;
   readonly validateSchema?: boolean;
};

export type OrphanedReference = {
   readonly ruleSetId: string;
   readonly ruleSetName: string;
   readonly missingRuleIds: ReadonlyArray<string>;
};

export type ImportResult<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly success: boolean;
   readonly rules: ReadonlyArray<Rule<TContext, TConsequences>>;
   readonly ruleSets: ReadonlyArray<RuleSet>;
   readonly errors: ReadonlyArray<{
      index: number;
      type: "rule" | "ruleSet";
      message: string;
   }>;
   readonly idMapping: ReadonlyMap<string, string>;
   readonly orphanedReferences: ReadonlyArray<OrphanedReference>;
};

const EXPORT_VERSION = "1.0.0";

export const serializeRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: Rule<TContext, TConsequences>,
): SerializedRule => ({
   id: rule.id,
   name: rule.name,
   description: rule.description,
   conditions: rule.conditions,
   consequences: rule.consequences.map((c) => ({
      type: c.type as string,
      payload: c.payload,
   })),
   priority: rule.priority,
   enabled: rule.enabled,
   stopOnMatch: rule.stopOnMatch,
   tags: rule.tags,
   category: rule.category,
   metadata: rule.metadata,
   createdAt: rule.createdAt.toISOString(),
   updatedAt: rule.updatedAt.toISOString(),
});

export const deserializeRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   serialized: SerializedRule,
   options: ImportOptions = {},
): Rule<TContext, TConsequences> => {
   const id = options.generateNewIds
      ? `${options.idPrefix ?? ""}${generateId()}`
      : serialized.id;

   const now = new Date();

   return {
      id,
      name: serialized.name,
      description: serialized.description,
      conditions: serialized.conditions,
      consequences: serialized.consequences as Rule<
         TContext,
         TConsequences
      >["consequences"],
      priority: serialized.priority,
      enabled: serialized.enabled,
      stopOnMatch: serialized.stopOnMatch,
      tags: serialized.tags,
      category: serialized.category,
      metadata: serialized.metadata,
      createdAt: options.preserveDates ? new Date(serialized.createdAt) : now,
      updatedAt: options.preserveDates ? new Date(serialized.updatedAt) : now,
   };
};

export const serializeRuleSet = (ruleSet: RuleSet): SerializedRuleSet => ({
   id: ruleSet.id,
   name: ruleSet.name,
   description: ruleSet.description,
   ruleIds: ruleSet.ruleIds,
   enabled: ruleSet.enabled,
   metadata: ruleSet.metadata,
});

export const deserializeRuleSet = (
   serialized: SerializedRuleSet,
   idMapping: Map<string, string>,
   options: ImportOptions = {},
): RuleSet => {
   const id = options.generateNewIds
      ? `${options.idPrefix ?? ""}${generateId()}`
      : serialized.id;

   const ruleIds = serialized.ruleIds.map(
      (oldId) => idMapping.get(oldId) ?? oldId,
   );

   return {
      id,
      name: serialized.name,
      description: serialized.description,
      ruleIds,
      enabled: serialized.enabled,
      metadata: serialized.metadata,
   };
};

export const exportRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ruleSets?: ReadonlyArray<RuleSet>,
   metadata?: Record<string, unknown>,
): ExportFormat => ({
   version: EXPORT_VERSION,
   exportedAt: new Date().toISOString(),
   rules: rules.map(serializeRule),
   ruleSets: ruleSets?.map(serializeRuleSet),
   metadata,
});

export const exportToJson = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ruleSets?: ReadonlyArray<RuleSet>,
   metadata?: Record<string, unknown>,
): string => {
   const exportData = exportRules(rules, ruleSets, metadata);
   return JSON.stringify(exportData, null, 2);
};

export const importRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   data: ExportFormat,
   options: ImportOptions = {},
): ImportResult<TContext, TConsequences> => {
   const rules: Rule<TContext, TConsequences>[] = [];
   const ruleSets: RuleSet[] = [];
   const errors: Array<{
      index: number;
      type: "rule" | "ruleSet";
      message: string;
   }> = [];
   const idMapping = new Map<string, string>();

   for (let i = 0; i < data.rules.length; i++) {
      try {
         const serialized = data.rules[i];
         if (!serialized) continue;
         const rule = deserializeRule<TContext, TConsequences>(
            serialized,
            options,
         );
         idMapping.set(serialized.id, rule.id);
         rules.push(rule);
      } catch (error) {
         errors.push({
            index: i,
            type: "rule",
            message: error instanceof Error ? error.message : String(error),
         });
      }
   }

   if (data.ruleSets) {
      for (let i = 0; i < data.ruleSets.length; i++) {
         try {
            const serialized = data.ruleSets[i];
            if (!serialized) continue;
            const ruleSet = deserializeRuleSet(serialized, idMapping, options);
            ruleSets.push(ruleSet);
         } catch (error) {
            errors.push({
               index: i,
               type: "ruleSet",
               message: error instanceof Error ? error.message : String(error),
            });
         }
      }
   }

   // Detect orphaned references (ruleSets referencing non-existent rules)
   const importedRuleIds = new Set(rules.map((r) => r.id));
   const orphanedReferences: OrphanedReference[] = [];

   for (const ruleSet of ruleSets) {
      const missingRuleIds = ruleSet.ruleIds.filter(
         (id) => !importedRuleIds.has(id),
      );
      if (missingRuleIds.length > 0) {
         orphanedReferences.push({
            ruleSetId: ruleSet.id,
            ruleSetName: ruleSet.name,
            missingRuleIds,
         });
      }
   }

   return {
      success: errors.length === 0,
      rules,
      ruleSets,
      errors,
      idMapping,
      orphanedReferences,
   };
};

export const importFromJson = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   json: string,
   options: ImportOptions = {},
): ImportResult<TContext, TConsequences> => {
   try {
      const data = JSON.parse(json) as ExportFormat;
      return importRules<TContext, TConsequences>(data, options);
   } catch (error) {
      return {
         success: false,
         rules: [],
         ruleSets: [],
         errors: [
            {
               index: -1,
               type: "rule",
               message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
            },
         ],
         idMapping: new Map(),
         orphanedReferences: [],
      };
   }
};

export const cloneRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   rule: Rule<TContext, TConsequences>,
   newId?: string,
   newName?: string,
): Rule<TContext, TConsequences> => {
   const now = new Date();
   return {
      ...rule,
      id: newId ?? generateId(),
      name: newName ?? `${rule.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
   };
};

export const mergeRuleSets = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   baseRules: ReadonlyArray<Rule<TContext, TConsequences>>,
   incomingRules: ReadonlyArray<Rule<TContext, TConsequences>>,
   strategy: "replace" | "skip" | "merge" = "replace",
): ReadonlyArray<Rule<TContext, TConsequences>> => {
   const ruleMap = new Map<string, Rule<TContext, TConsequences>>();

   for (const rule of baseRules) {
      ruleMap.set(rule.id, rule);
   }

   for (const rule of incomingRules) {
      const existing = ruleMap.get(rule.id);

      if (!existing) {
         ruleMap.set(rule.id, rule);
      } else {
         switch (strategy) {
            case "replace":
               ruleMap.set(rule.id, rule);
               break;
            case "skip":
               break;
            case "merge": {
               const merged: Rule<TContext, TConsequences> = {
                  ...existing,
                  ...rule,
                  tags: [...new Set([...existing.tags, ...rule.tags])],
                  metadata: { ...existing.metadata, ...rule.metadata },
                  updatedAt: new Date(),
               };
               ruleMap.set(rule.id, merged);
               break;
            }
         }
      }
   }

   return [...ruleMap.values()];
};

export const diffRuleSets = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   oldRules: ReadonlyArray<Rule<TContext, TConsequences>>,
   newRules: ReadonlyArray<Rule<TContext, TConsequences>>,
): {
   added: ReadonlyArray<Rule<TContext, TConsequences>>;
   removed: ReadonlyArray<Rule<TContext, TConsequences>>;
   modified: ReadonlyArray<{
      old: Rule<TContext, TConsequences>;
      new: Rule<TContext, TConsequences>;
   }>;
   unchanged: ReadonlyArray<Rule<TContext, TConsequences>>;
} => {
   const oldMap = new Map(oldRules.map((r) => [r.id, r]));
   const newMap = new Map(newRules.map((r) => [r.id, r]));

   const added: Rule<TContext, TConsequences>[] = [];
   const removed: Rule<TContext, TConsequences>[] = [];
   const modified: Array<{
      old: Rule<TContext, TConsequences>;
      new: Rule<TContext, TConsequences>;
   }> = [];
   const unchanged: Rule<TContext, TConsequences>[] = [];

   for (const [id, newRule] of newMap) {
      const oldRule = oldMap.get(id);
      if (!oldRule) {
         added.push(newRule);
      } else if (
         JSON.stringify({ ...oldRule, updatedAt: null, createdAt: null }) !==
         JSON.stringify({ ...newRule, updatedAt: null, createdAt: null })
      ) {
         modified.push({ old: oldRule, new: newRule });
      } else {
         unchanged.push(newRule);
      }
   }

   for (const [id, oldRule] of oldMap) {
      if (!newMap.has(id)) {
         removed.push(oldRule);
      }
   }

   return { added, removed, modified, unchanged };
};
