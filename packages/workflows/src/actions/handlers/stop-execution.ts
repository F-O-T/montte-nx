import type { Action } from "@packages/database/schema";
import type { ActionExecutionResult } from "../../types/actions";
import type { ActionHandler, ActionHandlerContext } from "../types";

export type StopExecutionResult = ActionExecutionResult & {
   stopProcessing: true;
};

export const stopExecutionHandler: ActionHandler = {
   type: "stop_execution",

   async execute(
      action: Action,
      _context: ActionHandlerContext,
   ): Promise<StopExecutionResult> {
      const { reason } = action.config;

      return {
         actionId: action.id,
         result: {
            reason: reason ?? "Stop execution action triggered",
         },
         stopProcessing: true,
         success: true,
         type: action.type,
      };
   },

   validate() {
      return { errors: [], valid: true };
   },
};

export function isStopExecutionResult(
   result: ActionExecutionResult,
): result is StopExecutionResult {
   return "stopProcessing" in result && result.stopProcessing === true;
}
