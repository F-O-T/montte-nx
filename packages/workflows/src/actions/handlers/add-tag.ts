import type { Action } from "@packages/database/schema";
import { transactionTag } from "@packages/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const addTagHandler: ActionHandler = {
   type: "add_tag",

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
         const existingTags = await context.db
            .select()
            .from(transactionTag)
            .where(
               and(
                  eq(transactionTag.transactionId, transactionId),
                  inArray(transactionTag.tagId, tagIds),
               ),
            );

         const existingTagIds = new Set(existingTags.map((t) => t.tagId));
         const newTagIds = tagIds.filter((id) => !existingTagIds.has(id));

         if (newTagIds.length > 0) {
            await context.db.insert(transactionTag).values(
               newTagIds.map((tagId) => ({
                  tagId,
                  transactionId,
               })),
            );
         }

         return createActionResult(action, true, {
            addedTagIds: newTagIds,
            skippedTagIds: tagIds.filter((id) => existingTagIds.has(id)),
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
