import type { CustomOperatorConfig } from "./types";

export function createOperator<
   TName extends string,
   TValue = unknown,
   TOptions = unknown,
>(
   config: CustomOperatorConfig<TName, TValue, TOptions>,
): CustomOperatorConfig<TName, TValue, TOptions> {
   return Object.freeze(config);
}
