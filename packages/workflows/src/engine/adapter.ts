import type { ConditionGroup as EvaluatorConditionGroup } from "@f-o-t/condition-evaluator";
import type { ConditionGroup } from "@packages/database/schema";
import type { TransactionEventData } from "../types/events";

export function adaptConditionGroupsToEvaluator(
   dbConditions: ConditionGroup[],
): EvaluatorConditionGroup {
   const validConditions = dbConditions.filter(
      (c): c is NonNullable<ConditionGroup> =>
         c !== undefined && c !== null && typeof c === "object" && "id" in c,
   );

   if (validConditions.length === 0) {
      return {
         conditions: [],
         id: crypto.randomUUID(),
         operator: "AND",
      };
   }

   if (validConditions.length === 1) {
      return validConditions[0] as EvaluatorConditionGroup;
   }

   return {
      conditions: validConditions as EvaluatorConditionGroup[],
      id: crypto.randomUUID(),
      operator: "AND",
   };
}

export function adaptEventDataToContext(
   eventData: TransactionEventData,
): Record<string, unknown> {
   return {
      amount: eventData.amount,
      bankAccountId: eventData.bankAccountId,
      categoryIds: eventData.categoryIds ?? [],
      costCenterId: eventData.costCenterId,
      counterpartyId: eventData.counterpartyId,
      date: eventData.date,
      description: eventData.description,
      id: eventData.id,
      metadata: eventData.metadata ?? {},
      organizationId: eventData.organizationId,
      tagIds: eventData.tagIds ?? [],
      type: eventData.type,
   };
}

export function getContextValue(
   context: Record<string, unknown>,
   path: string,
): unknown {
   const parts = path.split(".");
   let current: unknown = context;

   for (const part of parts) {
      if (current === null || current === undefined) {
         return undefined;
      }
      if (typeof current !== "object") {
         return undefined;
      }
      current = (current as Record<string, unknown>)[part];
   }

   return current;
}
