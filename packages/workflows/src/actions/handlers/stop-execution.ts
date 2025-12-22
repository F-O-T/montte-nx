import type { Consequence } from "@packages/database/schema";
import type { ActionExecutionResult } from "../../types/actions";
import type { ActionHandler, ActionHandlerContext } from "../types";

export type StopExecutionResult = ActionExecutionResult & {
   stopProcessing: true;
};

export const stopExecutionHandler: ActionHandler = {
   type: "stop_execution",

   async execute(
      consequence: Consequence,
      _context: ActionHandlerContext,
   ): Promise<StopExecutionResult> {
      const { reason } = consequence.payload;

      return {
         result: {
            reason: reason ?? "Stop execution action triggered",
         },
         stopProcessing: true,
         success: true,
         type: consequence.type,
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
