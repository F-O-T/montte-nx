import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
   ASAAS_WEBHOOK_SECRET: z.string().optional(),
   BETTER_AUTH_GOOGLE_CLIENT_ID: z.string(),
   BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string(),
   BETTER_AUTH_SECRET: z.string(),
   BETTER_AUTH_TRUSTED_ORIGINS: z.string(),
   DATABASE_URL: z.string(),
   MINIO_ACCESS_KEY: z.string(),
   MINIO_BUCKET: z.string().default("content-writer"),
   MINIO_ENDPOINT: z.string(),
   MINIO_SECRET_KEY: z.string(),
   POSTHOG_HOST: z.string(),
   POSTHOG_KEY: z.string(),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   RESEND_API_KEY: z.string(),
   STRIPE_WEBHOOK_SECRET: z.string().optional(),
   VAPID_PRIVATE_KEY: z.string().optional(),
   VAPID_PUBLIC_KEY: z.string().optional(),
   VAPID_SUBJECT: z.string().optional().default("mailto:contato@montte.co"),
   WORKER_CONCURRENCY: z.coerce.number().optional().default(5),
});
export type ServerEnv = z.infer<typeof EnvSchema>;
export const serverEnv: ServerEnv = parseEnv(process.env, EnvSchema);
