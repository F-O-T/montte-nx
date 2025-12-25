import type { ConditionGroup } from "@f-o-t/condition-evaluator";
import { z } from "zod";
import type {
   Consequence,
   ConsequenceDefinitions,
   DefaultConsequences,
} from "./consequence";

export type Rule<
   _TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly id: string;
   readonly name: string;
   readonly description?: string;
   readonly conditions: ConditionGroup;
   readonly consequences: ReadonlyArray<Consequence<TConsequences>>;
   readonly priority: number;
   readonly enabled: boolean;
   readonly stopOnMatch: boolean;
   readonly tags: ReadonlyArray<string>;
   readonly category?: string;
   readonly metadata?: Readonly<Record<string, unknown>>;
   readonly createdAt: Date;
   readonly updatedAt: Date;
};

export type RuleInput<
   _TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   id?: string;
   name: string;
   description?: string;
   conditions: ConditionGroup;
   consequences: Array<{
      type: keyof TConsequences;
      payload: z.infer<TConsequences[keyof TConsequences]>;
   }>;
   priority?: number;
   enabled?: boolean;
   stopOnMatch?: boolean;
   tags?: string[];
   category?: string;
   metadata?: Record<string, unknown>;
};

export type RuleSet = {
   readonly id: string;
   readonly name: string;
   readonly description?: string;
   readonly ruleIds: ReadonlyArray<string>;
   readonly enabled: boolean;
   readonly metadata?: Readonly<Record<string, unknown>>;
};

export type RuleSetInput = {
   id?: string;
   name: string;
   description?: string;
   ruleIds: string[];
   enabled?: boolean;
   metadata?: Record<string, unknown>;
};

export type RuleFilters = {
   readonly enabled?: boolean;
   readonly tags?: ReadonlyArray<string>;
   readonly category?: string;
   readonly ruleSetId?: string;
   readonly ids?: ReadonlyArray<string>;
};

export const RuleSchema = z.object({
   id: z.string().min(1),
   name: z.string().min(1),
   description: z.string().optional(),
   conditions: z.custom<ConditionGroup>((val) => {
      return (
         typeof val === "object" &&
         val !== null &&
         "id" in val &&
         "operator" in val
      );
   }, "Invalid condition group"),
   consequences: z.array(
      z.object({
         type: z.string(),
         payload: z.unknown(),
      }),
   ),
   priority: z.number().int().default(0),
   enabled: z.boolean().default(true),
   stopOnMatch: z.boolean().default(false),
   tags: z.array(z.string()).default([]),
   category: z.string().optional(),
   metadata: z.record(z.string(), z.unknown()).optional(),
   createdAt: z.date().default(() => new Date()),
   updatedAt: z.date().default(() => new Date()),
});

export const RuleSetSchema = z.object({
   id: z.string().min(1),
   name: z.string().min(1),
   description: z.string().optional(),
   ruleIds: z.array(z.string()),
   enabled: z.boolean().default(true),
   metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RuleSchemaType = z.infer<typeof RuleSchema>;
export type RuleSetSchemaType = z.infer<typeof RuleSetSchema>;
