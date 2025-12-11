import type { Action } from "@packages/database/schema";
import { transactionCategory } from "@packages/database/schema";
import { and, eq } from "drizzle-orm";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const setCategoryHandler: ActionHandler = {
   type: "set_category",

   async execute(action: Action, context: ActionHandlerContext) {
      const { categoryId } = action.config;
      const transactionId = context.eventData.id as string;

      if (!categoryId) {
         return createSkippedResult(action, "No category ID provided");
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
            categoryId,
            dryRun: true,
            transactionId,
         });
      }

      try {
         const existing = await context.db
            .select()
            .from(transactionCategory)
            .where(
               and(
                  eq(transactionCategory.transactionId, transactionId),
                  eq(transactionCategory.categoryId, categoryId),
               ),
            )
            .limit(1);

         if (existing.length === 0) {
            await context.db.insert(transactionCategory).values({
               categoryId,
               transactionId,
            });
         }

         return createActionResult(action, true, { categoryId, transactionId });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "Unknown error";
         return createActionResult(action, false, undefined, message);
      }
   },

   validate(config) {
      const errors: string[] = [];
      if (!config.categoryId) {
         errors.push("Category ID is required");
      }
      return { errors, valid: errors.length === 0 };
   },
};
