import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { Rule } from "../types/rule";

export type SortField = "priority" | "name" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export type SortOptions = {
   readonly field: SortField;
   readonly direction?: SortDirection;
};

export const sortRules = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   options: SortField | SortOptions,
) => {
   const normalizedOptions: SortOptions =
      typeof options === "string"
         ? { field: options, direction: "desc" }
         : options;

   const { field, direction = "desc" } = normalizedOptions;

   return (
      rules: ReadonlyArray<Rule<TContext, TConsequences>>,
   ): ReadonlyArray<Rule<TContext, TConsequences>> => {
      const sorted = [...rules].sort((a, b) => {
         let comparison = 0;

         switch (field) {
            case "priority":
               comparison = a.priority - b.priority;
               break;
            case "name":
               comparison = a.name.localeCompare(b.name);
               break;
            case "createdAt":
               comparison = a.createdAt.getTime() - b.createdAt.getTime();
               break;
            case "updatedAt":
               comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
               break;
         }

         return direction === "desc" ? -comparison : comparison;
      });

      return sorted;
   };
};

export const sortByPriority = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   direction: SortDirection = "desc",
) => {
   return sortRules<TContext, TConsequences>({ field: "priority", direction });
};

export const sortByName = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   direction: SortDirection = "asc",
) => {
   return sortRules<TContext, TConsequences>({ field: "name", direction });
};

export const sortByCreatedAt = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   direction: SortDirection = "desc",
) => {
   return sortRules<TContext, TConsequences>({ field: "createdAt", direction });
};

export const sortByUpdatedAt = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   direction: SortDirection = "desc",
) => {
   return sortRules<TContext, TConsequences>({ field: "updatedAt", direction });
};
