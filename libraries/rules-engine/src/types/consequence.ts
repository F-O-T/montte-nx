import type { z } from "zod";

export type ConsequenceDefinitions = Record<string, z.ZodType>;

export type DefaultConsequences = Record<string, z.ZodType>;

export type InferConsequenceType<T extends ConsequenceDefinitions> = keyof T;

export type InferConsequencePayload<
   T extends ConsequenceDefinitions,
   K extends keyof T,
> = z.infer<T[K]>;

export type Consequence<
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
   TType extends keyof TConsequences = keyof TConsequences,
> = {
   readonly type: TType;
   readonly payload: z.infer<TConsequences[TType]>;
};

export type ConsequenceInput<
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
   TType extends keyof TConsequences = keyof TConsequences,
> = {
   type: TType;
   payload: z.infer<TConsequences[TType]>;
};

export type AggregatedConsequence<
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly type: keyof TConsequences;
   readonly payload: unknown;
   readonly ruleId: string;
   readonly ruleName?: string;
   readonly priority: number;
};
