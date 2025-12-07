import { createDb } from "@packages/database/client";
import { findActiveAutomationRulesByTrigger } from "@packages/database/repositories/automation-repository";
import { serverEnv as env } from "@packages/environment/server";
import { closeRedisConnection, createConnectionFromUrl } from "@packages/queue";
import { startAutomationConsumer } from "@packages/rules-engine/queue";
import type { AutomationRule, TriggerType } from "@packages/rules-engine/types";

const MEMORY_THRESHOLD_MB = 512;
const HEALTH_CHECK_INTERVAL_MS = 30000;

const db = createDb({ databaseUrl: env.DATABASE_URL });

createConnectionFromUrl(env.REDIS_URL);

console.log("Starting automation worker...");

let isShuttingDown = false;

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
      console.log(
         `[Job Completed] ${job.id}: ${result.rulesExecuted}/${result.rulesEvaluated} rules executed in ${result.duration}ms`,
      );

      if (global.gc) {
         global.gc();
      }
   },
   onJobFailed: async (job, error) => {
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
   if (isShuttingDown) {
      console.log("Shutdown already in progress...");
      return;
   }

   isShuttingDown = true;
   console.log(`Received ${signal}, shutting down gracefully...`);

   const shutdownTimeout = setTimeout(() => {
      console.error("Shutdown timeout exceeded, forcing exit...");
      process.exit(1);
   }, 30000);

   try {
      console.log("Pausing worker to stop accepting new jobs...");
      await worker.pause();

      console.log("Waiting for active jobs to complete...");
      await stop();

      console.log("Closing Redis connection...");
      await closeRedisConnection();

      clearTimeout(shutdownTimeout);
      console.log("Worker shut down complete");
      process.exit(0);
   } catch (error) {
      clearTimeout(shutdownTimeout);
      console.error("Error during shutdown:", error);
      process.exit(1);
   }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
   console.error("[Uncaught Exception]", error);
   gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
   console.error("[Unhandled Rejection] at:", promise, "reason:", reason);
});

const healthCheckInterval = setInterval(() => {
   if (isShuttingDown) {
      clearInterval(healthCheckInterval);
      return;
   }

   const memUsage = process.memoryUsage();
   const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
   const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
   const rssMB = Math.round(memUsage.rss / 1024 / 1024);

   console.log(
      `[Health] Heap: ${heapUsedMB}MB / ${heapTotalMB}MB | RSS: ${rssMB}MB`,
   );

   if (heapUsedMB > MEMORY_THRESHOLD_MB) {
      console.warn(
         `[Memory Warning] Heap usage (${heapUsedMB}MB) exceeds threshold (${MEMORY_THRESHOLD_MB}MB)`,
      );

      if (global.gc) {
         console.log("[Memory] Triggering garbage collection...");
         global.gc();
      }

      const afterGC = process.memoryUsage();
      const afterHeapMB = Math.round(afterGC.heapUsed / 1024 / 1024);

      if (afterHeapMB > MEMORY_THRESHOLD_MB * 1.5) {
         console.error(
            `[Memory Critical] Heap still at ${afterHeapMB}MB after GC, initiating graceful restart...`,
         );
         gracefulShutdown("MEMORY_PRESSURE");
      }
   }
}, HEALTH_CHECK_INTERVAL_MS);
