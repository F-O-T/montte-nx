import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
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
   RESEND_API_KEY: z.string(),
   STRIPE_SECRET_KEY: z.string(),
   VAPID_PRIVATE_KEY: z.string().optional(),
   VAPID_PUBLIC_KEY: z.string().optional(),
   VAPID_SUBJECT: z.string().optional().default("mailto:contato@montte.co"),
});
export type ServerEnv = z.infer<typeof EnvSchema>;
export const serverEnv: ServerEnv = parseEnv(process.env, EnvSchema);
