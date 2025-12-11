import type { DatabaseInstance } from "@packages/database/client";
import type { Action } from "@packages/database/schema";
import type { ActionExecutionResult } from "../types/actions";

export type ActionHandlerContext = {
   db: DatabaseInstance;
   organizationId: string;
   eventData: Record<string, unknown>;
   ruleId: string;
   dryRun?: boolean;
};

export type ActionHandler = {
   type: Action["type"];
   execute: (
      action: Action,
      context: ActionHandlerContext,
   ) => Promise<ActionExecutionResult>;
   validate?: (config: Action["config"]) => {
      valid: boolean;
      errors: string[];
   };
};

export function createActionResult(
   action: Action,
   success: boolean,
   result?: unknown,
   error?: string,
): ActionExecutionResult {
   return {
      actionId: action.id,
      error,
      result,
      success,
      type: action.type,
   };
}

export function createSkippedResult(
   action: Action,
   reason: string,
): ActionExecutionResult {
   return {
      actionId: action.id,
      skipReason: reason,
      skipped: true,
      success: true,
      type: action.type,
   };
}
