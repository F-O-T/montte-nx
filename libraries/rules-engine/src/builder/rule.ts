import type { ConditionGroup } from "@f-o-t/condition-evaluator";
import type { z } from "zod";
import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { RuleInput } from "../types/rule";
import {
   type ConditionBuilder,
   conditions as createConditions,
} from "./conditions";

export type RuleBuilderState<
   _TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly id?: string;
   readonly name?: string;
   readonly description?: string;
   readonly conditions?: ConditionGroup;
   readonly consequences: Array<{
      type: keyof TConsequences;
      payload: z.infer<TConsequences[keyof TConsequences]>;
   }>;
   readonly priority: number;
   readonly enabled: boolean;
   readonly stopOnMatch: boolean;
   readonly tags: string[];
   readonly category?: string;
   readonly metadata?: Record<string, unknown>;
};

export type RuleBuilder<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly id: (id: string) => RuleBuilder<TContext, TConsequences>;

   readonly named: (name: string) => RuleBuilder<TContext, TConsequences>;

   readonly describedAs: (
      description: string,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly when: (
      conditions: ConditionGroup | ((cb: ConditionBuilder) => ConditionBuilder),
   ) => RuleBuilder<TContext, TConsequences>;

   readonly then: <K extends keyof TConsequences>(
      type: K,
      payload: z.infer<TConsequences[K]>,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly withPriority: (
      priority: number,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly enabled: (
      enabled?: boolean,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly disabled: () => RuleBuilder<TContext, TConsequences>;

   readonly stopOnMatch: (
      stop?: boolean,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly tagged: (...tags: string[]) => RuleBuilder<TContext, TConsequences>;

   readonly inCategory: (
      category: string,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly withMetadata: (
      metadata: Record<string, unknown>,
   ) => RuleBuilder<TContext, TConsequences>;

   readonly build: () => RuleInput<TContext, TConsequences>;

   readonly getState: () => RuleBuilderState<TContext, TConsequences>;
};

const createRuleBuilder = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   state: RuleBuilderState<TContext, TConsequences> = {
      consequences: [],
      priority: 0,
      enabled: true,
      stopOnMatch: false,
      tags: [],
   },
): RuleBuilder<TContext, TConsequences> => {
   const update = (
      updates: Partial<RuleBuilderState<TContext, TConsequences>>,
   ): RuleBuilder<TContext, TConsequences> => {
      return createRuleBuilder({ ...state, ...updates });
   };

   return {
      id: (id) => update({ id }),

      named: (name) => update({ name }),

      describedAs: (description) => update({ description }),

      when: (conditionsOrBuilder) => {
         if (typeof conditionsOrBuilder === "function") {
            const builder = createConditions();
            const result = conditionsOrBuilder(builder);
            return update({ conditions: result.build() });
         }
         return update({ conditions: conditionsOrBuilder });
      },

      // biome-ignore lint/suspicious/noThenProperty: Intentional fluent API method for rule builder (when().then())
      then: (type, payload) => {
         return update({
            consequences: [
               ...state.consequences,
               { type, payload } as {
                  type: keyof TConsequences;
                  payload: z.infer<TConsequences[keyof TConsequences]>;
               },
            ],
         });
      },

      withPriority: (priority) => update({ priority }),

      enabled: (enabled = true) => update({ enabled }),

      disabled: () => update({ enabled: false }),

      stopOnMatch: (stop = true) => update({ stopOnMatch: stop }),

      tagged: (...tags) => update({ tags: [...state.tags, ...tags] }),

      inCategory: (category) => update({ category }),

      withMetadata: (metadata) =>
         update({ metadata: { ...state.metadata, ...metadata } }),

      build: (): RuleInput<TContext, TConsequences> => {
         if (!state.name) {
            throw new Error("Rule must have a name");
         }
         if (!state.conditions) {
            throw new Error("Rule must have conditions");
         }
         if (state.consequences.length === 0) {
            throw new Error("Rule must have at least one consequence");
         }

         return {
            id: state.id,
            name: state.name,
            description: state.description,
            conditions: state.conditions,
            consequences: state.consequences,
            priority: state.priority,
            enabled: state.enabled,
            stopOnMatch: state.stopOnMatch,
            tags: state.tags,
            category: state.category,
            metadata: state.metadata,
         };
      },

      getState: () => state,
   };
};

export const rule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(): RuleBuilder<TContext, TConsequences> => {
   return createRuleBuilder<TContext, TConsequences>();
};

export const createRule = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   builderFn: (
      rb: RuleBuilder<TContext, TConsequences>,
   ) => RuleBuilder<TContext, TConsequences>,
): RuleInput<TContext, TConsequences> => {
   const builder = createRuleBuilder<TContext, TConsequences>();
   return builderFn(builder).build();
};
