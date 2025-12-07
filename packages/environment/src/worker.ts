import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
   DATABASE_URL: z.string(),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   WORKER_CONCURRENCY: z.coerce.number().optional().default(5),
});
export type WorkerEnv = z.infer<typeof EnvSchema>;
export const workerEnv: WorkerEnv = parseEnv(process.env, EnvSchema);
