import type { Job } from "@packages/queue/bullmq";
import type { AutomationEvent, TransactionEventData } from "../types/events";
import {
   type AutomationJobData,
   type AutomationJobResult,
   defaultJobOptions,
   getAutomationQueue,
} from "./queues";

export async function emitAutomationEvent(
   event: AutomationEvent,
   options?: {
      triggeredBy?: "event" | "manual";
      delay?: number;
      priority?: number;
   },
): Promise<Job<AutomationJobData, AutomationJobResult>> {
   const queue = getAutomationQueue();

   const jobData: AutomationJobData = {
      event,
      metadata: {
         retryCount: 0,
         triggeredBy: options?.triggeredBy || "event",
      },
   };

   const jobOptions = {
      ...defaultJobOptions,
      delay: options?.delay,
      jobId: `${event.type.replace(/\./g, "-")}-${event.id}`,
      priority: options?.priority,
   };

   return queue.add(event.type, jobData, jobOptions);
}

export async function emitTransactionCreatedEvent(
   organizationId: string,
   transactionData: TransactionEventData,
): Promise<Job<AutomationJobData, AutomationJobResult>> {
   const event: AutomationEvent = {
      data: transactionData,
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date().toISOString(),
      type: "transaction.created",
   };

   return emitAutomationEvent(event, { triggeredBy: "event" });
}

export async function emitTransactionUpdatedEvent(
   organizationId: string,
   transactionData: TransactionEventData,
): Promise<Job<AutomationJobData, AutomationJobResult>> {
   const event: AutomationEvent = {
      data: transactionData,
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date().toISOString(),
      type: "transaction.updated",
   };

   return emitAutomationEvent(event, { triggeredBy: "event" });
}

export async function emitManualTrigger(
   event: AutomationEvent,
): Promise<Job<AutomationJobData, AutomationJobResult>> {
   return emitAutomationEvent(event, { triggeredBy: "manual" });
}

export async function getQueueStats(): Promise<{
   waiting: number;
   active: number;
   completed: number;
   failed: number;
   delayed: number;
}> {
   const queue = getAutomationQueue();
   const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
   ]);

   return { active, completed, delayed, failed, waiting };
}

export async function cleanOldJobs(
   gracePeriodMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
   const queue = getAutomationQueue();
   await queue.clean(gracePeriodMs, 1000, "completed");
   await queue.clean(gracePeriodMs * 7, 5000, "failed");
}
