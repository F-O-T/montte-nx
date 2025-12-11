import type { DatabaseInstance } from "@packages/database/client";
import { deleteOldAutomationLogsGlobal } from "@packages/database/repositories/automation-log-repository";
import type { ConnectionOptions, WorkerOptions } from "@packages/queue/bullmq";
import { type Job, Worker } from "@packages/queue/bullmq";
import {
   MAINTENANCE_QUEUE_NAME,
   type MaintenanceJobData,
   type MaintenanceJobResult,
} from "./queues";

const DEFAULT_RETENTION_DAYS = 7;

export type MaintenanceWorkerConfig = {
   connection: ConnectionOptions;
   db: DatabaseInstance;
   concurrency?: number;
   onCompleted?: (
      job: Job<MaintenanceJobData, MaintenanceJobResult>,
      result: MaintenanceJobResult,
   ) => void | Promise<void>;
   onFailed?: (
      job: Job<MaintenanceJobData, MaintenanceJobResult> | undefined,
      error: Error,
   ) => void | Promise<void>;
};

export type MaintenanceWorker = {
   worker: Worker<MaintenanceJobData, MaintenanceJobResult>;
   close: () => Promise<void>;
};

export function createMaintenanceWorker(
   config: MaintenanceWorkerConfig,
): MaintenanceWorker {
   const { connection, db, concurrency = 1, onCompleted, onFailed } = config;

   const workerOptions: WorkerOptions = {
      concurrency,
      connection,
   };

   const worker = new Worker<MaintenanceJobData, MaintenanceJobResult>(
      MAINTENANCE_QUEUE_NAME,
      async (job: Job<MaintenanceJobData, MaintenanceJobResult>) => {
         const { type, retentionDays = DEFAULT_RETENTION_DAYS } = job.data;

         if (type === "cleanup-automation-logs") {
            try {
               const deletedCount = await deleteOldAutomationLogsGlobal(
                  db,
                  retentionDays,
               );

               return {
                  deletedCount,
                  success: true,
               };
            } catch (error) {
               const message =
                  error instanceof Error ? error.message : "Unknown error";
               return {
                  deletedCount: 0,
                  error: message,
                  success: false,
               };
            }
         }

         return {
            deletedCount: 0,
            error: `Unknown maintenance job type: ${type}`,
            success: false,
         };
      },
      workerOptions,
   );

   if (onCompleted) {
      worker.on("completed", onCompleted);
   }

   if (onFailed) {
      worker.on("failed", onFailed);
   }

   return {
      close: async () => {
         await worker.close();
      },
      worker,
   };
}
