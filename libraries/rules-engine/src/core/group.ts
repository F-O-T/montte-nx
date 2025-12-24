import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { Rule } from "../types/rule";

export type GroupByField = "category" | "priority" | "enabled";

export type GroupedRules<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = ReadonlyMap<
   string | number | boolean,
   ReadonlyArray<Rule<TContext, TConsequences>>
>;

export const groupRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   field: GroupByField,
) => {
   return (
      rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ): GroupedRules<TContext, TConsequences> => {
      const groups = new Map<
         string | number | boolean,
         Rule<TContext, TConsequences>[]
      >();

      for (const rule of rules) {
         let key: string | number | boolean;

         switch (field) {
            case "category":
               key = rule.category ?? "uncategorized";
               break;
            case "priority":
               key = rule.priority;
               break;
            case "enabled":
               key = rule.enabled;
               break;
         }

         const existing = groups.get(key);
         if (existing) {
            existing.push(rule);
         } else {
            groups.set(key, [rule]);
         }
      }

      return groups;
   };
};

export const groupByCategory = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>() => {
   return groupRules<TContext, TConsequences>("category");
};

export const groupByPriority = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>() => {
   return groupRules<TContext, TConsequences>("priority");
};

export const groupByEnabled = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>() => {
   return groupRules<TContext, TConsequences>("enabled");
};

export const groupByCustom = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
   TKey extends string | number | boolean = string,
>(
   keyFn: (rule: Rule<TContext, TConsequences>) => TKey,
) => {
   return (
      rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ): ReadonlyMap<TKey, ReadonlyArray<Rule<TContext, TConsequences>>> => {
      const groups = new Map<TKey, Rule<TContext, TConsequences>[]>();

      for (const rule of rules) {
         const key = keyFn(rule);
         const existing = groups.get(key);
         if (existing) {
            existing.push(rule);
         } else {
            groups.set(key, [rule]);
         }
      }

      return groups;
   };
};
