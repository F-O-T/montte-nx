import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type {
   Rule,
   RuleFilters,
   RuleInput,
   RuleSet,
   RuleSetInput,
} from "../types/rule";
import type { MutableEngineState } from "../types/state";
import { createInitialState } from "../types/state";
import { generateId } from "../utils/id";

export const addRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   input: RuleInput<TContext, TConsequences>,
): Rule<TContext, TConsequences> => {
   const now = new Date();
   const rule: Rule<TContext, TConsequences> = {
      id: input.id ?? generateId(),
      name: input.name,
      description: input.description,
      conditions: input.conditions,
      consequences: input.consequences.map((c) => ({
         type: c.type,
         payload: c.payload,
      })) as Rule<TContext, TConsequences>["consequences"],
      priority: input.priority ?? 0,
      enabled: input.enabled ?? true,
      stopOnMatch: input.stopOnMatch ?? false,
      tags: input.tags ?? [],
      category: input.category,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
   };

   state.rules.set(rule.id, rule);

   if (!state.ruleOrder.includes(rule.id)) {
      state.ruleOrder.push(rule.id);
      sortRuleOrder(state);
   }

   return rule;
};

export const addRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   inputs: RuleInput<TContext, TConsequences>[],
): Rule<TContext, TConsequences>[] => {
   return inputs.map((input) => addRule(state, input));
};

export const removeRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleId: string,
): boolean => {
   const deleted = state.rules.delete(ruleId);
   if (deleted) {
      const index = state.ruleOrder.indexOf(ruleId);
      if (index !== -1) {
         state.ruleOrder.splice(index, 1);
      }
   }
   return deleted;
};

export const updateRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleId: string,
   updates: Partial<RuleInput<TContext, TConsequences>>,
): Rule<TContext, TConsequences> | undefined => {
   const existing = state.rules.get(ruleId);
   if (!existing) return undefined;

   const updated: Rule<TContext, TConsequences> = {
      ...existing,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && {
         description: updates.description,
      }),
      ...(updates.conditions !== undefined && {
         conditions: updates.conditions,
      }),
      ...(updates.consequences !== undefined && {
         consequences: updates.consequences.map((c) => ({
            type: c.type,
            payload: c.payload,
         })) as Rule<TContext, TConsequences>["consequences"],
      }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.stopOnMatch !== undefined && {
         stopOnMatch: updates.stopOnMatch,
      }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.metadata !== undefined && { metadata: updates.metadata }),
      updatedAt: new Date(),
   };

   state.rules.set(ruleId, updated);

   if (updates.priority !== undefined) {
      sortRuleOrder(state);
   }

   return updated;
};

export const getRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleId: string,
): Rule<TContext, TConsequences> | undefined => {
   return state.rules.get(ruleId);
};

export const getRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   filters?: RuleFilters,
): ReadonlyArray<Rule<TContext, TConsequences>> => {
   const rules: Rule<TContext, TConsequences>[] = [];

   for (const id of state.ruleOrder) {
      const rule = state.rules.get(id);
      if (!rule) continue;

      if (filters) {
         if (
            filters.enabled !== undefined &&
            rule.enabled !== filters.enabled
         ) {
            continue;
         }
         if (filters.tags && filters.tags.length > 0) {
            const hasTag = filters.tags.some((tag) => rule.tags.includes(tag));
            if (!hasTag) continue;
         }
         if (
            filters.category !== undefined &&
            rule.category !== filters.category
         ) {
            continue;
         }
         if (
            filters.ids &&
            filters.ids.length > 0 &&
            !filters.ids.includes(rule.id)
         ) {
            continue;
         }
      }

      rules.push(rule);
   }

   return rules;
};

export const enableRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleId: string,
): boolean => {
   const rule = state.rules.get(ruleId);
   if (!rule) return false;

   state.rules.set(ruleId, { ...rule, enabled: true, updatedAt: new Date() });
   return true;
};

export const disableRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleId: string,
): boolean => {
   const rule = state.rules.get(ruleId);
   if (!rule) return false;

   state.rules.set(ruleId, { ...rule, enabled: false, updatedAt: new Date() });
   return true;
};

export const clearRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
): void => {
   state.rules.clear();
   state.ruleOrder.length = 0;
};

export const addRuleSet = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   input: RuleSetInput,
): RuleSet => {
   const ruleSet: RuleSet = {
      id: input.id ?? generateId(),
      name: input.name,
      description: input.description,
      ruleIds: input.ruleIds,
      enabled: input.enabled ?? true,
      metadata: input.metadata,
   };

   state.ruleSets.set(ruleSet.id, ruleSet);
   return ruleSet;
};

export const getRuleSet = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleSetId: string,
): RuleSet | undefined => {
   return state.ruleSets.get(ruleSetId);
};

export const getRuleSets = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
): ReadonlyArray<RuleSet> => {
   return Array.from(state.ruleSets.values());
};

export const removeRuleSet = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleSetId: string,
): boolean => {
   return state.ruleSets.delete(ruleSetId);
};

export const getRulesInSet = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
   ruleSetId: string,
): ReadonlyArray<Rule<TContext, TConsequences>> => {
   const ruleSet = state.ruleSets.get(ruleSetId);
   if (!ruleSet || !ruleSet.enabled) return [];

   const rules: Rule<TContext, TConsequences>[] = [];
   for (const ruleId of ruleSet.ruleIds) {
      const rule = state.rules.get(ruleId);
      if (rule) {
         rules.push(rule);
      }
   }

   return rules;
};

const sortRuleOrder = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
): void => {
   state.ruleOrder.sort((a, b) => {
      const ruleA = state.rules.get(a);
      const ruleB = state.rules.get(b);
      if (!ruleA || !ruleB) return 0;
      return ruleB.priority - ruleA.priority;
   });
};

export const cloneState = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: MutableEngineState<TContext, TConsequences>,
): MutableEngineState<TContext, TConsequences> => {
   const newState = createInitialState<TContext, TConsequences>();

   for (const [id, rule] of state.rules) {
      newState.rules.set(id, { ...rule });
   }

   for (const [id, ruleSet] of state.ruleSets) {
      newState.ruleSets.set(id, { ...ruleSet, ruleIds: [...ruleSet.ruleIds] });
   }

   newState.ruleOrder.push(...state.ruleOrder);

   return newState;
};
