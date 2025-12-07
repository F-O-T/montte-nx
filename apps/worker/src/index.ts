import { createDb } from "@packages/database/client";
import { createAutomationLog } from "@packages/database/repositories/automation-log-repository";
import { findActiveAutomationRulesByTrigger } from "@packages/database/repositories/automation-repository";
import { serverEnv as env } from "@packages/environment/server";
import { closeRedisConnection, createConnectionFromUrl } from "@packages/queue";
import { startAutomationConsumer } from "@packages/rules-engine/queue";
import type { AutomationRule, TriggerType } from "@packages/rules-engine/types";

const db = createDb({ databaseUrl: env.DATABASE_URL });

createConnectionFromUrl(env.REDIS_URL);

console.log("Starting automation worker...");

const { worker, stop } = await startAutomationConsumer({
   concurrency: env.WORKER_CONCURRENCY || 5,
   db,
   getRulesForOrganization: async (
      organizationId: string,
      triggerType: string,
   ) => {
      const rules = await findActiveAutomationRulesByTrigger(
         db,
         organizationId,
         triggerType as TriggerType,
      );
      return rules as unknown as AutomationRule[];
   },
   onJobCompleted: async (job, result) => {
      const { event, metadata } = job.data;

      await createAutomationLog(db, {
         completedAt: new Date(),
         durationMs: result.duration,
         organizationId: event.organizationId,
         relatedEntityId: (event.data as Record<string, unknown>).id as string,
         relatedEntityType:
            event.type === "webhook.received" ? "webhook" : "transaction",
         ruleName: `Batch execution: ${result.rulesExecuted} rules`,
         startedAt: new Date(Date.now() - result.duration),
         status: result.rulesFailed > 0 ? "partial" : "success",
         triggerEvent: event.data,
         triggeredBy: metadata?.triggeredBy || "event",
         triggerType: event.type as TriggerType,
      });

      console.log(
         `[Job Completed] ${job.id}: ${result.rulesExecuted}/${result.rulesEvaluated} rules executed in ${result.duration}ms`,
      );
   },
   onJobFailed: async (job, error) => {
      if (job) {
         const { event, metadata } = job.data;

         await createAutomationLog(db, {
            completedAt: new Date(),
            errorMessage: error.message,
            errorStack: error.stack,
            organizationId: event.organizationId,
            ruleName: "Failed execution",
            startedAt: new Date(),
            status: "failed",
            triggerEvent: event.data,
            triggeredBy: metadata?.triggeredBy || "event",
            triggerType: event.type as TriggerType,
         });
      }

      console.error(`[Job Failed] ${job?.id}: ${error.message}`);
   },
});

console.log(
   `Automation worker started with concurrency: ${env.WORKER_CONCURRENCY || 5}`,
);

worker.on("active", (job) => {
   console.log(
      `[Job Active] ${job.id}: Processing ${job.data.event.type} event`,
   );
});

worker.on("stalled", (jobId) => {
   console.warn(`[Job Stalled] ${jobId}`);
});

worker.on("error", (error) => {
   console.error("[Worker Error]", error);
});

async function gracefulShutdown(signal: string) {
   console.log(`Received ${signal}, shutting down gracefully...`);

   await stop();
   await closeRedisConnection();

   console.log("Worker shut down complete");
   process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

setInterval(() => {
   const memUsage = process.memoryUsage();
   console.log(
      `[Health] Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
   );
}, 60000);
