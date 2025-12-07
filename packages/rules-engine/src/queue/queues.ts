import { getRedisConnection } from "@packages/queue";
import { type JobsOptions, Queue, Worker, type WorkerOptions } from "bullmq";
import type { AutomationEvent } from "../types/events";

export const AUTOMATION_QUEUE_NAME = "automation-events";

export type AutomationJobData = {
   event: AutomationEvent;
   metadata?: {
      triggeredBy?: "event" | "manual" | "webhook";
      retryCount?: number;
   };
};

export type AutomationJobResult = {
   eventId: string;
   rulesEvaluated: number;
   rulesMatched: number;
   rulesExecuted: number;
   rulesFailed: number;
   duration: number;
   error?: string;
};

export const defaultJobOptions: JobsOptions = {
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
      count: 5000,
   },
};

let automationQueue: Queue<AutomationJobData, AutomationJobResult> | null =
   null;

export function getAutomationQueue(): Queue<
   AutomationJobData,
   AutomationJobResult
> {
   if (!automationQueue) {
      const connection = getRedisConnection();
      if (!connection) {
         throw new Error(
            "Redis connection not initialized. Call createRedisConnection first.",
         );
      }
      automationQueue = new Queue(AUTOMATION_QUEUE_NAME, {
         connection,
         defaultJobOptions,
      });
   }
   return automationQueue as Queue<AutomationJobData, AutomationJobResult>;
}

export function createAutomationWorker(
   processor: (job: {
      data: AutomationJobData;
   }) => Promise<AutomationJobResult>,
   options?: Partial<WorkerOptions>,
): Worker<AutomationJobData, AutomationJobResult> {
   const connection = getRedisConnection();
   if (!connection) {
      throw new Error(
         "Redis connection not initialized. Call createRedisConnection first.",
      );
   }
   return new Worker(AUTOMATION_QUEUE_NAME, processor, {
      concurrency: 5,
      connection,
      ...options,
   });
}

export async function closeAutomationQueue(): Promise<void> {
   if (automationQueue) {
      await automationQueue.close();
      automationQueue = null;
   }
}
