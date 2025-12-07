import type { DatabaseInstance } from "@packages/database/client";
import type { Job, Worker } from "bullmq";
import { runRulesForEvent } from "../engine/runner";
import type { AutomationRule } from "../types/rules";
import {
   type AutomationJobData,
   type AutomationJobResult,
   createAutomationWorker,
} from "./queues";

export type AutomationConsumerConfig = {
   db: DatabaseInstance;
   getRulesForOrganization: (
      organizationId: string,
      triggerType: string,
   ) => Promise<AutomationRule[]>;
   onJobCompleted?: (
      job: Job<AutomationJobData, AutomationJobResult>,
      result: AutomationJobResult,
   ) => Promise<void>;
   onJobFailed?: (
      job: Job<AutomationJobData, AutomationJobResult> | undefined,
      error: Error,
   ) => Promise<void>;
   concurrency?: number;
};

export async function processAutomationJob(
   job: Job<AutomationJobData, AutomationJobResult>,
   config: AutomationConsumerConfig,
): Promise<AutomationJobResult> {
   const { event, metadata } = job.data;
   const startTime = Date.now();

   try {
      const rules = await config.getRulesForOrganization(
         event.organizationId,
         event.type,
      );

      const result = await runRulesForEvent(event, rules, config.db, {
         triggeredBy: metadata?.triggeredBy,
      });

      return {
         duration: Date.now() - startTime,
         eventId: event.id,
         rulesEvaluated: result.rulesEvaluated,
         rulesExecuted: result.rulesExecuted,
         rulesFailed: result.rulesFailed,
         rulesMatched: result.rulesMatched,
      };
   } catch (error) {
      return {
         duration: Date.now() - startTime,
         error: error instanceof Error ? error.message : "Unknown error",
         eventId: event.id,
         rulesEvaluated: 0,
         rulesExecuted: 0,
         rulesFailed: 0,
         rulesMatched: 0,
      };
   }
}

export function createAutomationConsumer(
   config: AutomationConsumerConfig,
): Worker<AutomationJobData, AutomationJobResult> {
   const worker = createAutomationWorker(
      async (job) =>
         processAutomationJob(
            job as Job<AutomationJobData, AutomationJobResult>,
            config,
         ),
      { concurrency: config.concurrency },
   );

   worker.on("completed", async (job, result) => {
      if (config.onJobCompleted) {
         await config.onJobCompleted(job, result);
      }
   });

   worker.on("failed", async (job, error) => {
      if (config.onJobFailed) {
         await config.onJobFailed(job, error);
      }
   });

   return worker;
}

export async function startAutomationConsumer(
   config: AutomationConsumerConfig,
): Promise<{
   worker: Worker<AutomationJobData, AutomationJobResult>;
   stop: () => Promise<void>;
}> {
   const worker = createAutomationConsumer(config);

   const stop = async () => {
      await worker.close();
   };

   return { stop, worker };
}
