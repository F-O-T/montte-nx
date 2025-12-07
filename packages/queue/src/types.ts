import type { ConnectionOptions, JobsOptions } from "bullmq";

export interface QueueConfig {
   connection: ConnectionOptions;
   defaultJobOptions?: JobsOptions;
}

export interface RedisConfig {
   host: string;
   port: number;
   password?: string;
   db?: number;
   maxRetriesPerRequest?: number | null;
}

export type QueueName = "automation" | "notification" | "webhook";

export interface BaseJobData {
   organizationId: string;
   timestamp: string;
}

export interface AutomationJobData extends BaseJobData {
   eventType: string;
   payload: Record<string, unknown>;
   metadata?: Record<string, unknown>;
}

export interface NotificationJobData extends BaseJobData {
   userId: string;
   type: string;
   title: string;
   body: string;
   url?: string;
   metadata?: Record<string, unknown>;
}

export interface WebhookJobData extends BaseJobData {
   source: string;
   event: string;
   rawPayload: unknown;
   headers: Record<string, string>;
   signature?: string;
}

export type JobData = AutomationJobData | NotificationJobData | WebhookJobData;
