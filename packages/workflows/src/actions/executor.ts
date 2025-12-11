import type { DatabaseInstance } from "@packages/database/client";
import type { Action } from "@packages/database/schema";
import type { Resend } from "resend";
import type { ActionExecutionResult } from "../types/actions";
import { isStopExecutionResult } from "./handlers/stop-execution";
import { getActionHandler } from "./registry";
import type { ActionHandlerContext, VapidConfig } from "./types";

export type ActionsExecutionContext = {
   db: DatabaseInstance;
   organizationId: string;
   eventData: Record<string, unknown>;
   ruleId: string;
   dryRun?: boolean;
   resendClient?: Resend;
   vapidConfig?: VapidConfig;
};

export type ActionsExecutionResult = {
   results: ActionExecutionResult[];
   success: boolean;
   stoppedEarly: boolean;
   totalActions: number;
   executedActions: number;
   failedActions: number;
   skippedActions: number;
};

export async function executeActions(
   actions: Action[],
   context: ActionsExecutionContext,
): Promise<ActionsExecutionResult> {
   const results: ActionExecutionResult[] = [];
   let stoppedEarly = false;
   let failedActions = 0;
   let skippedActions = 0;

   const handlerContext: ActionHandlerContext = {
      db: context.db,
      dryRun: context.dryRun,
      eventData: context.eventData,
      organizationId: context.organizationId,
      resendClient: context.resendClient,
      ruleId: context.ruleId,
      vapidConfig: context.vapidConfig,
   };

   for (const action of actions) {
      const handler = getActionHandler(action.type);

      if (!handler) {
         const result: ActionExecutionResult = {
            actionId: action.id,
            error: `No handler registered for action type: ${action.type}`,
            success: false,
            type: action.type,
         };
         results.push(result);
         failedActions++;

         if (!action.continueOnError) {
            break;
         }
         continue;
      }

      try {
         const result = await handler.execute(action, handlerContext);
         results.push(result);

         if (result.skipped) {
            skippedActions++;
            continue;
         }

         if (!result.success) {
            failedActions++;
            if (!action.continueOnError) {
               break;
            }
            continue;
         }

         if (isStopExecutionResult(result)) {
            stoppedEarly = true;
            break;
         }
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
         const result: ActionExecutionResult = {
            actionId: action.id,
            error: errorMessage,
            success: false,
            type: action.type,
         };
         results.push(result);
         failedActions++;

         if (!action.continueOnError) {
            break;
         }
      }
   }

   const executedActions = results.filter((r) => !r.skipped).length;

   return {
      executedActions,
      failedActions,
      results,
      skippedActions,
      stoppedEarly,
      success: failedActions === 0,
      totalActions: actions.length,
   };
}

export async function validateActions(
   actions: Action[],
): Promise<{ valid: boolean; errors: Map<string, string[]> }> {
   const errors = new Map<string, string[]>();

   for (const action of actions) {
      const handler = getActionHandler(action.type);

      if (!handler) {
         errors.set(action.id, [
            `No handler registered for action type: ${action.type}`,
         ]);
         continue;
      }

      if (handler.validate) {
         const validationResult = handler.validate(action.config);
         if (!validationResult.valid) {
            errors.set(action.id, validationResult.errors);
         }
      }
   }

   return {
      errors,
      valid: errors.size === 0,
   };
}
