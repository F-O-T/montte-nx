import type { z } from "zod";

export type ConditionType =
   | "string"
   | "number"
   | "date"
   | "boolean"
   | "array"
   | "custom";

export type CustomOperatorConfig<
   TName extends string = string,
   TValue = unknown,
   TOptions = unknown,
> = {
   readonly name: TName;
   readonly type: ConditionType;
   readonly description?: string;
   readonly evaluate: (
      currentValue: unknown,
      expectedValue: TValue,
      options?: TOptions,
   ) => boolean;
   readonly valueSchema?: z.ZodSchema<TValue>;
   readonly optionsSchema?: z.ZodSchema<TOptions>;
   readonly reasonGenerator?: (
      passed: boolean,
      currentValue: unknown,
      expectedValue: TValue,
      field: string,
   ) => string;
};

export type OperatorMap = Record<string, CustomOperatorConfig>;

export type InferOperatorNames<T extends OperatorMap> = keyof T & string;

export type CustomCondition<TOperator extends string = string> = {
   readonly id: string;
   readonly type: "custom";
   readonly field: string;
   readonly operator: TOperator;
   readonly value?: unknown;
   readonly valueRef?: string;
   readonly options?: {
      readonly negate?: boolean;
      readonly weight?: number;
      readonly [key: string]: unknown;
   };
};

export type EvaluatorConfig<T extends OperatorMap = OperatorMap> = {
   readonly operators?: T;
};
