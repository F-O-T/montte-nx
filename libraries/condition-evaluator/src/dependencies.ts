import { z } from "zod";
import { isConditionGroup } from "./evaluator";
import type { Condition, ConditionGroup } from "./schemas";

export const DependencyInfoSchema = z.object({
   fields: z.array(z.string()),
   references: z.array(z.string()),
   allPaths: z.array(z.string()),
   nested: z.boolean(),
   maxDepth: z.number().int().min(0),
});

export type DependencyInfo = z.infer<typeof DependencyInfoSchema>;

export function extractDependencies(
   input: Condition | ConditionGroup,
): DependencyInfo {
   const fields = new Set<string>();
   const references = new Set<string>();

   function traverse(item: Condition | ConditionGroup): void {
      if (isConditionGroup(item)) {
         for (const condition of item.conditions) {
            traverse(condition);
         }
      } else {
         fields.add(item.field);
         if ("valueRef" in item && item.valueRef) {
            references.add(item.valueRef);
         }
      }
   }

   traverse(input);

   const fieldsArray = Array.from(fields);
   const referencesArray = Array.from(references);
   const allPaths = [...new Set([...fieldsArray, ...referencesArray])];
   const nested = allPaths.some((path) => path.includes("."));
   const maxDepth =
      allPaths.length > 0
         ? Math.max(...allPaths.map((p) => p.split(".").length))
         : 0;

   return {
      fields: fieldsArray,
      references: referencesArray,
      allPaths,
      nested,
      maxDepth,
   };
}
