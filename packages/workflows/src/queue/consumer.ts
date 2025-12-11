import type { DatabaseInstance } from "@packages/database/client";
import type { ConnectionOptions, WorkerOptions } from "@packages/queue/bullmq";
import { type Job, Worker } from "@packages/queue/bullmq";
import type { Resend } from "resend";
import type { VapidConfig } from "../actions/types";
import { createWorkflowRunner } from "../engine/runner";
import type { WorkflowExecutionResult } from "../types/rules";
import {
   WORKFLOW_QUEUE_NAME,
   type WorkflowJobData,
   type WorkflowJobResult,
} from "./queues";

export type WorkflowWorkerConfig = {
   connection: ConnectionOptions;
   db: DatabaseInstance;
   concurrency?: number;
   resendClient?: Resend;
   vapidConfig?: VapidConfig;
   onCompleted?: (
      job: Job<WorkflowJobData, WorkflowJobResult>,
      result: WorkflowJobResult,
   ) => void | Promise<void>;
   onFailed?: (
      job: Job<WorkflowJobData, WorkflowJobResult> | undefined,
      error: Error,
   ) => void | Promise<void>;
   onProgress?: (
      job: Job<WorkflowJobData, WorkflowJobResult>,
      progress: string | boolean | number | object,
   ) => void | Promise<void>;
};

export type WorkflowWorker = {
   worker: Worker<WorkflowJobData, WorkflowJobResult>;
   close: () => Promise<void>;
};

export function createWorkflowWorker(
   config: WorkflowWorkerConfig,
): WorkflowWorker {
   const {
      connection,
      db,
      concurrency = 5,
      resendClient,
      vapidConfig,
      onCompleted,
      onFailed,
      onProgress,
   } = config;

   const runner = createWorkflowRunner({ db, resendClient, vapidConfig });

   const workerOptions: WorkerOptions = {
      concurrency,
      connection,
   };

   const worker = new Worker<WorkflowJobData, WorkflowJobResult>(
      WORKFLOW_QUEUE_NAME,
      async (job: Job<WorkflowJobData, WorkflowJobResult>) => {
         const { event } = job.data;

         try {
            const result: WorkflowExecutionResult =
               await runner.processEvent(event);

            return {
               error: undefined,
               eventId: event.id,
               rulesEvaluated: result.rulesEvaluated,
               rulesMatched: result.rulesMatched,
               success: true,
            };
         } catch (error) {
            const message =
               error instanceof Error ? error.message : "Unknown error";
            return {
               error: message,
               eventId: event.id,
               rulesEvaluated: 0,
               rulesMatched: 0,
               success: false,
            };
         }
      },
      workerOptions,
   );

   if (onCompleted) {
      worker.on("completed", onCompleted);
   }

   if (onFailed) {
      worker.on("failed", onFailed);
   }

   if (onProgress) {
      worker.on("progress", onProgress);
   }

   return {
      close: async () => {
         await worker.close();
      },
      worker,
   };
}

export async function processWorkflowJob(
   job: Job<WorkflowJobData, WorkflowJobResult>,
   db: DatabaseInstance,
   resendClient?: Resend,
   vapidConfig?: VapidConfig,
): Promise<WorkflowJobResult> {
   const runner = createWorkflowRunner({ db, resendClient, vapidConfig });
   const { event } = job.data;

   try {
      const result = await runner.processEvent(event);

      return {
         error: undefined,
         eventId: event.id,
         rulesEvaluated: result.rulesEvaluated,
         rulesMatched: result.rulesMatched,
         success: true,
      };
   } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
         error: message,
         eventId: event.id,
         rulesEvaluated: 0,
         rulesMatched: 0,
         success: false,
      };
   }
}
