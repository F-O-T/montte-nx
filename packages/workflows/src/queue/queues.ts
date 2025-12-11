import type { ConnectionOptions } from "@packages/queue/bullmq";
import { Queue } from "@packages/queue/bullmq";
import type { WorkflowEvent } from "../types/events";

export const WORKFLOW_QUEUE_NAME = "workflow-events";

export type WorkflowJobData = {
   event: WorkflowEvent;
   metadata?: {
      triggeredBy?: "event" | "manual";
      correlationId?: string;
   };
};

export type WorkflowJobResult = {
   eventId: string;
   rulesEvaluated: number;
   rulesMatched: number;
   success: boolean;
   error?: string;
};

let workflowQueue: Queue<WorkflowJobData, WorkflowJobResult> | null = null;

export function createWorkflowQueue(
   connection: ConnectionOptions,
): Queue<WorkflowJobData, WorkflowJobResult> {
   if (workflowQueue) {
      return workflowQueue;
   }

   workflowQueue = new Queue<WorkflowJobData, WorkflowJobResult>(
      WORKFLOW_QUEUE_NAME,
      {
         connection,
         defaultJobOptions: {
            attempts: 3,
            backoff: {
               delay: 1000,
               type: "exponential",
            },
            removeOnComplete: {
               age: 24 * 60 * 60,
               count: 1000,
            },
            removeOnFail: {
               age: 7 * 24 * 60 * 60,
            },
         },
      },
   );

   return workflowQueue;
}

export function getWorkflowQueue(): Queue<
   WorkflowJobData,
   WorkflowJobResult
> | null {
   return workflowQueue;
}

export async function closeWorkflowQueue(): Promise<void> {
   if (workflowQueue) {
      await workflowQueue.close();
      workflowQueue = null;
   }
}
