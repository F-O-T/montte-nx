import type { Consequence } from "@packages/database/schema";
import { transaction } from "@packages/database/schema";
import { eq } from "drizzle-orm";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const setCostCenterHandler: ActionHandler = {
   type: "set_cost_center",

   async execute(consequence: Consequence, context: ActionHandlerContext) {
      const { costCenterId } = consequence.payload;
      const transactionId = context.eventData.id as string;

      if (!costCenterId) {
         return createSkippedResult(consequence, "No cost center ID provided");
      }

      if (!transactionId) {
         return createActionResult(
            consequence,
            false,
            undefined,
            "No transaction ID in event data",
         );
      }

      if (context.dryRun) {
         return createActionResult(consequence, true, {
            costCenterId,
            dryRun: true,
            transactionId,
         });
      }

      try {
         const result = await context.db
            .update(transaction)
            .set({ costCenterId })
            .where(eq(transaction.id, transactionId))
            .returning();

         if (result.length === 0) {
            return createActionResult(
               consequence,
               false,
               undefined,
               "Transconsequence not found",
            );
         }

         return createActionResult(consequence, true, {
            costCenterId,
            transactionId,
         });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "Unknown error";
         return createActionResult(consequence, false, undefined, message);
      }
   },

   validate(config) {
      const errors: string[] = [];
      if (!config.costCenterId) {
         errors.push("Cost center ID is required");
      }
      return { errors, valid: errors.length === 0 };
   },
};
