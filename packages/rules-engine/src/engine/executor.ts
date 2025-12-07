import type { DatabaseInstance } from "@packages/database/client";
import type { Action, ActionType } from "@packages/database/schema";
import type {
   ActionExecutionContext,
   ActionExecutionResult,
} from "../types/actions";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
   const parts = path.split(".");
   let current: unknown = obj;

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

function interpolateTemplate(
   template: string,
   data: Record<string, unknown>,
): string {
   return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const value = getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : "";
   });
}

export type ActionHandler = (
   action: Action,
   context: ActionExecutionContext,
   db?: DatabaseInstance,
) => Promise<ActionExecutionResult>;

export type ActionHandlers = {
   [K in ActionType]: ActionHandler;
};

async function executeSetCategory(
   action: Action,
   context: ActionExecutionContext,
   _db?: DatabaseInstance,
): Promise<ActionExecutionResult> {
   const { categoryId } = action.config;

   if (!categoryId) {
      return {
         actionId: action.id,
         error: "Category ID is required",
         success: false,
         type: action.type,
      };
   }

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { categoryId, dryRun: true },
         success: true,
         type: action.type,
      };
   }

   const transactionId = context.eventData.id as string | undefined;
   if (!transactionId) {
      return {
         actionId: action.id,
         error: "Transaction ID not found in event data",
         success: false,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { categoryId, transactionId },
      success: true,
      type: action.type,
   };
}

async function executeAddTag(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const { tagIds } = action.config;

   if (!tagIds || tagIds.length === 0) {
      return {
         actionId: action.id,
         error: "Tag IDs are required",
         success: false,
         type: action.type,
      };
   }

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { dryRun: true, tagIds },
         success: true,
         type: action.type,
      };
   }

   const transactionId = context.eventData.id as string | undefined;
   if (!transactionId) {
      return {
         actionId: action.id,
         error: "Transaction ID not found in event data",
         success: false,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { tagIds, transactionId },
      success: true,
      type: action.type,
   };
}

async function executeRemoveTag(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const { tagIds } = action.config;

   if (!tagIds || tagIds.length === 0) {
      return {
         actionId: action.id,
         error: "Tag IDs are required",
         success: false,
         type: action.type,
      };
   }

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { dryRun: true, tagIds },
         success: true,
         type: action.type,
      };
   }

   const transactionId = context.eventData.id as string | undefined;
   if (!transactionId) {
      return {
         actionId: action.id,
         error: "Transaction ID not found in event data",
         success: false,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { removed: true, tagIds, transactionId },
      success: true,
      type: action.type,
   };
}

async function executeSetCostCenter(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const { costCenterId } = action.config;

   if (!costCenterId) {
      return {
         actionId: action.id,
         error: "Cost Center ID is required",
         success: false,
         type: action.type,
      };
   }

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { costCenterId, dryRun: true },
         success: true,
         type: action.type,
      };
   }

   const transactionId = context.eventData.id as string | undefined;
   if (!transactionId) {
      return {
         actionId: action.id,
         error: "Transaction ID not found in event data",
         success: false,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { costCenterId, transactionId },
      success: true,
      type: action.type,
   };
}

async function executeUpdateDescription(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const { mode = "replace", value, template } = action.config;

   if (!value) {
      return {
         actionId: action.id,
         error: "Value is required",
         success: false,
         type: action.type,
      };
   }

   const currentDescription = (context.eventData.description as string) || "";
   const newValue = template
      ? interpolateTemplate(value, context.eventData)
      : value;

   let finalDescription: string;
   switch (mode) {
      case "append":
         finalDescription = `${currentDescription}${newValue}`;
         break;
      case "prepend":
         finalDescription = `${newValue}${currentDescription}`;
         break;
      case "replace":
      default:
         finalDescription = newValue;
   }

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { description: finalDescription, dryRun: true },
         success: true,
         type: action.type,
      };
   }

   const transactionId = context.eventData.id as string | undefined;
   if (!transactionId) {
      return {
         actionId: action.id,
         error: "Transaction ID not found in event data",
         success: false,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { description: finalDescription, transactionId },
      success: true,
      type: action.type,
   };
}

async function executeCreateTransaction(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const {
      type,
      description,
      amountField,
      amountFixed,
      bankAccountId,
      categoryId,
      dateField,
   } = action.config;

   if (!type || !bankAccountId) {
      return {
         actionId: action.id,
         error: "Transaction type and bank account ID are required",
         success: false,
         type: action.type,
      };
   }

   let amount: number;
   if (amountFixed !== undefined) {
      amount = amountFixed;
   } else if (amountField) {
      const fieldValue = getNestedValue(context.eventData, amountField);
      amount = Number(fieldValue);
      if (Number.isNaN(amount)) {
         return {
            actionId: action.id,
            error: `Invalid amount value from field: ${amountField}`,
            success: false,
            type: action.type,
         };
      }
   } else {
      return {
         actionId: action.id,
         error: "Either amountFixed or amountField is required",
         success: false,
         type: action.type,
      };
   }

   let date: Date;
   if (dateField) {
      const dateValue = getNestedValue(context.eventData, dateField);
      date = new Date(String(dateValue));
      if (Number.isNaN(date.getTime())) {
         date = new Date();
      }
   } else {
      date = new Date();
   }

   const transactionData = {
      amount,
      bankAccountId,
      categoryId,
      date: date.toISOString(),
      description: description
         ? interpolateTemplate(description, context.eventData)
         : "Auto-generated transaction",
      organizationId: context.organizationId,
      status: "pending" as const,
      type,
   };

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { dryRun: true, transaction: transactionData },
         success: true,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { transaction: transactionData },
      success: true,
      type: action.type,
   };
}

async function executeSendPushNotification(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const { title, body, url } = action.config;

   if (!title || !body) {
      return {
         actionId: action.id,
         error: "Title and body are required",
         success: false,
         type: action.type,
      };
   }

   const notification = {
      body: interpolateTemplate(body, context.eventData),
      organizationId: context.organizationId,
      title: interpolateTemplate(title, context.eventData),
      url: url ? interpolateTemplate(url, context.eventData) : undefined,
   };

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { dryRun: true, notification },
         success: true,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { notification, queued: true },
      success: true,
      type: action.type,
   };
}

async function executeSendEmail(
   action: Action,
   context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   const { to, customEmail, subject, body } = action.config;

   if (!subject || !body) {
      return {
         actionId: action.id,
         error: "Subject and body are required",
         success: false,
         type: action.type,
      };
   }

   if (to === "custom" && !customEmail) {
      return {
         actionId: action.id,
         error: "Custom email address is required",
         success: false,
         type: action.type,
      };
   }

   const email = {
      body: interpolateTemplate(body, context.eventData),
      organizationId: context.organizationId,
      subject: interpolateTemplate(subject, context.eventData),
      to: to === "custom" ? customEmail : "owner",
   };

   if (context.dryRun) {
      return {
         actionId: action.id,
         result: { dryRun: true, email },
         success: true,
         type: action.type,
      };
   }

   return {
      actionId: action.id,
      result: { email, queued: true },
      success: true,
      type: action.type,
   };
}

async function executeStopExecution(
   action: Action,
   _context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
   return {
      actionId: action.id,
      result: {
         reason: action.config.reason || "Stop action executed",
         stopped: true,
      },
      success: true,
      type: action.type,
   };
}

const actionHandlers: ActionHandlers = {
   add_tag: executeAddTag,
   create_transaction: executeCreateTransaction,
   remove_tag: executeRemoveTag,
   send_email: executeSendEmail,
   send_push_notification: executeSendPushNotification,
   set_category: executeSetCategory,
   set_cost_center: executeSetCostCenter,
   stop_execution: executeStopExecution,
   update_description: executeUpdateDescription,
};

export async function executeAction(
   action: Action,
   context: ActionExecutionContext,
   db?: DatabaseInstance,
): Promise<ActionExecutionResult> {
   const handler = actionHandlers[action.type];

   if (!handler) {
      return {
         actionId: action.id,
         error: `Unknown action type: ${action.type}`,
         success: false,
         type: action.type,
      };
   }

   try {
      return await handler(action, context, db);
   } catch (error) {
      return {
         actionId: action.id,
         error:
            error instanceof Error ? error.message : "Unknown error occurred",
         success: false,
         type: action.type,
      };
   }
}

export async function executeActions(
   actions: Action[],
   context: ActionExecutionContext,
   db?: DatabaseInstance,
): Promise<{
   results: ActionExecutionResult[];
   stoppedEarly: boolean;
   stoppedByAction?: string;
}> {
   const results: ActionExecutionResult[] = [];
   let stoppedEarly = false;
   let stoppedByAction: string | undefined;

   for (const action of actions) {
      const result = await executeAction(action, context, db);
      results.push(result);

      if (action.type === "stop_execution" && result.success) {
         stoppedEarly = true;
         stoppedByAction = action.id;
         break;
      }

      if (!result.success && !action.continueOnError) {
         break;
      }
   }

   return { results, stoppedByAction, stoppedEarly };
}

export function isStopAction(action: Action): boolean {
   return action.type === "stop_execution";
}
