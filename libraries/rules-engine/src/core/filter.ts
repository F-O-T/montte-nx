import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { Rule, RuleFilters } from "../types/rule";

export const filterRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   filters: RuleFilters,
) => {
   return (
      rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ): ReadonlyArray<Rule<TContext, TConsequences>> => {
      return rules.filter((rule) => {
         if (
            filters.enabled !== undefined &&
            rule.enabled !== filters.enabled
         ) {
            return false;
         }

         if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some((tag) =>
               rule.tags.includes(tag),
            );
            if (!hasMatchingTag) {
               return false;
            }
         }

         if (
            filters.category !== undefined &&
            rule.category !== filters.category
         ) {
            return false;
         }

         if (filters.ids && filters.ids.length > 0) {
            if (!filters.ids.includes(rule.id)) {
               return false;
            }
         }

         return true;
      });
   };
};

export const filterByEnabled = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   enabled: boolean,
) => {
   return filterRules<TContext, TConsequences>({ enabled });
};

export const filterByTags = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   tags: ReadonlyArray<string>,
) => {
   return filterRules<TContext, TConsequences>({ tags });
};

export const filterByCategory = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   category: string,
) => {
   return filterRules<TContext, TConsequences>({ category });
};

export const filterByIds = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   ids: ReadonlyArray<string>,
) => {
   return filterRules<TContext, TConsequences>({ ids });
};
