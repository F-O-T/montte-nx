import type { Action } from "@packages/database/schema";
import { transactionTag } from "@packages/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const removeTagHandler: ActionHandler = {
   type: "remove_tag",

   async execute(action: Action, context: ActionHandlerContext) {
      const { tagIds } = action.config;
      const transactionId = context.eventData.id as string;

      if (!tagIds || tagIds.length === 0) {
         return createSkippedResult(action, "No tag IDs provided");
      }

      if (!transactionId) {
         return createActionResult(
            action,
            false,
            undefined,
            "No transaction ID in event data",
         );
      }

      if (context.dryRun) {
         return createActionResult(action, true, {
            dryRun: true,
            tagIds,
            transactionId,
         });
      }

      try {
         const result = await context.db
            .delete(transactionTag)
            .where(
               and(
                  eq(transactionTag.transactionId, transactionId),
                  inArray(transactionTag.tagId, tagIds),
               ),
            )
            .returning();

         return createActionResult(action, true, {
            removedCount: result.length,
            tagIds,
            transactionId,
         });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "Unknown error";
         return createActionResult(action, false, undefined, message);
      }
   },

   validate(config) {
      const errors: string[] = [];
      if (!config.tagIds || config.tagIds.length === 0) {
         errors.push("At least one tag ID is required");
      }
      return { errors, valid: errors.length === 0 };
   },
};
