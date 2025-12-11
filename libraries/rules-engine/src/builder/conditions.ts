import type { Condition, ConditionGroup } from "@f-o-t/condition-evaluator";

export type ConditionBuilderState = {
   readonly conditions: (Condition | ConditionGroup)[];
};

export type ConditionBuilder = {
   readonly number: (
      field: string,
      operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq",
      value: number,
   ) => ConditionBuilder;

   readonly string: (
      field: string,
      operator:
         | "eq"
         | "neq"
         | "contains"
         | "not_contains"
         | "starts_with"
         | "ends_with"
         | "in"
         | "not_in"
         | "like"
         | "not_like"
         | "ilike"
         | "not_ilike"
         | "regex"
         | "not_regex",
      value: string | string[],
   ) => ConditionBuilder;

   readonly boolean: (
      field: string,
      operator: "eq" | "neq",
      value: boolean,
   ) => ConditionBuilder;

   readonly date: (
      field: string,
      operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "between",
      value: string | Date | [string | Date, string | Date],
   ) => ConditionBuilder;

   readonly array: (
      field: string,
      operator:
         | "contains"
         | "not_contains"
         | "contains_all"
         | "contains_any"
         | "is_empty"
         | "is_not_empty"
         | "length_eq"
         | "length_gt"
         | "length_lt",
      value: unknown,
   ) => ConditionBuilder;

   readonly ref: (
      field: string,
      operator: string,
      valueRef: string,
   ) => ConditionBuilder;

   readonly and: (
      builder: (cb: ConditionBuilder) => ConditionBuilder,
   ) => ConditionBuilder;

   readonly or: (
      builder: (cb: ConditionBuilder) => ConditionBuilder,
   ) => ConditionBuilder;

   readonly raw: (condition: Condition | ConditionGroup) => ConditionBuilder;

   readonly build: () => ConditionGroup;

   readonly getConditions: () => ReadonlyArray<Condition | ConditionGroup>;
};

let conditionIdCounter = 0;
let groupIdCounter = 0;

const generateConditionId = (): string => `cond-${++conditionIdCounter}`;
const generateGroupId = (): string => `group-${++groupIdCounter}`;

export const resetBuilderIds = (): void => {
   conditionIdCounter = 0;
   groupIdCounter = 0;
};

const createConditionBuilder = (
   state: ConditionBuilderState = { conditions: [] },
   operator: "AND" | "OR" = "AND",
): ConditionBuilder => {
   const addCondition = (
      condition: Condition | ConditionGroup,
   ): ConditionBuilder => {
      return createConditionBuilder(
         { conditions: [...state.conditions, condition] },
         operator,
      );
   };

   return {
      number: (field, op, value) =>
         addCondition({
            id: generateConditionId(),
            type: "number",
            field,
            operator: op,
            value,
         }),

      string: (field, op, value) =>
         addCondition({
            id: generateConditionId(),
            type: "string",
            field,
            operator: op,
            value: value as string,
         } as Condition),

      boolean: (field, op, value) =>
         addCondition({
            id: generateConditionId(),
            type: "boolean",
            field,
            operator: op,
            value,
         }),

      date: (field, op, value) => {
         const normalizedValue =
            value instanceof Date
               ? value.toISOString()
               : Array.isArray(value)
                 ? value.map((v) => (v instanceof Date ? v.toISOString() : v))
                 : value;

         return addCondition({
            id: generateConditionId(),
            type: "date",
            field,
            operator: op,
            value: normalizedValue as string,
         } as Condition);
      },

      array: (field, op, value) =>
         addCondition({
            id: generateConditionId(),
            type: "array",
            field,
            operator: op,
            value,
         } as Condition),

      ref: (field, op, valueRef) =>
         addCondition({
            id: generateConditionId(),
            type: "number",
            field,
            operator: op,
            valueRef,
         } as Condition),

      and: (builderFn) => {
         const nestedBuilder = createConditionBuilder(
            { conditions: [] },
            "AND",
         );
         const result = builderFn(nestedBuilder);
         return addCondition(result.build());
      },

      or: (builderFn) => {
         const nestedBuilder = createConditionBuilder({ conditions: [] }, "OR");
         const result = builderFn(nestedBuilder);
         return addCondition(result.build());
      },

      raw: (condition) => addCondition(condition),

      build: (): ConditionGroup => ({
         id: generateGroupId(),
         operator,
         conditions: state.conditions,
      }),

      getConditions: () => state.conditions,
   };
};

export const conditions = (): ConditionBuilder =>
   createConditionBuilder({ conditions: [] }, "AND");

export const and = (
   builderFn: (cb: ConditionBuilder) => ConditionBuilder,
): ConditionGroup => {
   const builder = createConditionBuilder({ conditions: [] }, "AND");
   return builderFn(builder).build();
};

export const or = (
   builderFn: (cb: ConditionBuilder) => ConditionBuilder,
): ConditionGroup => {
   const builder = createConditionBuilder({ conditions: [] }, "OR");
   return builderFn(builder).build();
};

export const all = (
   ...items: (Condition | ConditionGroup)[]
): ConditionGroup => ({
   id: generateGroupId(),
   operator: "AND",
   conditions: items,
});

export const any = (
   ...items: (Condition | ConditionGroup)[]
): ConditionGroup => ({
   id: generateGroupId(),
   operator: "OR",
   conditions: items,
});

export const num = (
   field: string,
   operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq",
   value: number,
): Condition => ({
   id: generateConditionId(),
   type: "number",
   field,
   operator,
   value,
});

export const str = (
   field: string,
   operator:
      | "eq"
      | "neq"
      | "contains"
      | "not_contains"
      | "starts_with"
      | "ends_with"
      | "in"
      | "not_in"
      | "like"
      | "not_like"
      | "ilike"
      | "not_ilike"
      | "regex"
      | "not_regex",
   value: string | string[],
): Condition =>
   ({
      id: generateConditionId(),
      type: "string",
      field,
      operator,
      value,
   }) as Condition;

export const bool = (
   field: string,
   operator: "eq" | "neq",
   value: boolean,
): Condition => ({
   id: generateConditionId(),
   type: "boolean",
   field,
   operator,
   value,
});

export const date = (
   field: string,
   operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "between",
   value: string | Date | [string | Date, string | Date],
): Condition => {
   const normalizedValue =
      value instanceof Date
         ? value.toISOString()
         : Array.isArray(value)
           ? value.map((v) => (v instanceof Date ? v.toISOString() : v))
           : value;

   return {
      id: generateConditionId(),
      type: "date",
      field,
      operator,
      value: normalizedValue as string,
   } as Condition;
};

export const arr = (
   field: string,
   operator:
      | "contains"
      | "not_contains"
      | "contains_all"
      | "contains_any"
      | "is_empty"
      | "is_not_empty"
      | "length_eq"
      | "length_gt"
      | "length_lt",
   value?: unknown,
): Condition =>
   ({
      id: generateConditionId(),
      type: "array",
      field,
      operator,
      value,
   }) as Condition;
