import type { Action } from "@packages/database/schema";
import { transaction } from "@packages/database/schema";
import { eq } from "drizzle-orm";
import { createTemplateContext, renderTemplate } from "../../utils/template";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const updateDescriptionHandler: ActionHandler = {
   type: "update_description",

   async execute(action: Action, context: ActionHandlerContext) {
      const { value, mode = "replace", template = true } = action.config;
      const transactionId = context.eventData.id as string;

      if (!value) {
         return createSkippedResult(action, "No value provided");
      }

      if (!transactionId) {
         return createActionResult(
            action,
            false,
            undefined,
            "No transaction ID in event data",
         );
      }

      let newDescription: string;
      const processedValue = template
         ? renderTemplate(value, createTemplateContext(context.eventData))
         : value;

      const currentDescription =
         (context.eventData.description as string) ?? "";

      switch (mode) {
         case "append":
            newDescription = `${currentDescription}${processedValue}`;
            break;
         case "prepend":
            newDescription = `${processedValue}${currentDescription}`;
            break;
         default:
            newDescription = processedValue;
            break;
      }

      if (context.dryRun) {
         return createActionResult(action, true, {
            dryRun: true,
            newDescription,
            originalDescription: currentDescription,
            transactionId,
         });
      }

      try {
         const result = await context.db
            .update(transaction)
            .set({ description: newDescription })
            .where(eq(transaction.id, transactionId))
            .returning();

         if (result.length === 0) {
            return createActionResult(
               action,
               false,
               undefined,
               "Transaction not found",
            );
         }

         return createActionResult(action, true, {
            newDescription,
            originalDescription: currentDescription,
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
      if (!config.value) {
         errors.push("Value is required");
      }
      if (
         config.mode &&
         !["replace", "append", "prepend"].includes(config.mode)
      ) {
         errors.push("Mode must be replace, append, or prepend");
      }
      return { errors, valid: errors.length === 0 };
   },
};
