import { createDb } from "@packages/database/client";
import { workerEnv as env } from "@packages/environment/worker";
import type { Job } from "@packages/queue/bullmq";
import {
   closeRedisConnection,
   createRedisConnection,
} from "@packages/queue/connection";
import { getResendClient } from "@packages/transactional/utils";
import { createWorkflowWorker } from "@packages/workflows/queue/consumer";
import { initializeWorkflowQueue } from "@packages/workflows/queue/producer";
import type {
   WorkflowJobData,
   WorkflowJobResult,
} from "@packages/workflows/queue/queues";

const MEMORY_THRESHOLD_MB = 512;
const HEALTH_CHECK_INTERVAL_MS = 30000;

const db = createDb({ databaseUrl: env.DATABASE_URL });

const redisConnection = createRedisConnection(env.REDIS_URL);

const resendClient = env.RESEND_API_KEY
   ? getResendClient(env.RESEND_API_KEY)
   : undefined;

const vapidConfig =
   env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
      ? {
           privateKey: env.VAPID_PRIVATE_KEY,
           publicKey: env.VAPID_PUBLIC_KEY,
           subject: env.VAPID_SUBJECT ?? "mailto:contato@montte.co",
        }
      : undefined;

console.log("Starting workflow worker...");

let isShuttingDown = false;

initializeWorkflowQueue(redisConnection);

const { worker, close } = createWorkflowWorker({
   concurrency: env.WORKER_CONCURRENCY || 5,
   connection: redisConnection,
   db,
   resendClient,
   vapidConfig,
   onCompleted: async (
      job: Job<WorkflowJobData, WorkflowJobResult>,
      result: WorkflowJobResult,
   ) => {
      console.log(
         `[Job Completed] ${job.id}: ${result.rulesMatched}/${result.rulesEvaluated} rules matched`,
      );

      if (global.gc) {
         global.gc();
      }
   },
   onFailed: async (
      job: Job<WorkflowJobData, WorkflowJobResult> | undefined,
      error: Error,
   ) => {
      console.error(`[Job Failed] ${job?.id}: ${error.message}`);
   },
});

console.log(
   `Workflow worker started with concurrency: ${env.WORKER_CONCURRENCY || 5}`,
);

worker.on("active", (job: Job<WorkflowJobData, WorkflowJobResult>) => {
   console.log(
      `[Job Active] ${job.id}: Processing ${job.data.event.type} event`,
   );
});

worker.on("stalled", (jobId: string) => {
   console.warn(`[Job Stalled] ${jobId}`);
});

worker.on("error", (error: Error) => {
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
      await close();

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
