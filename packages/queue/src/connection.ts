import type { ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";
import type { RedisConfig } from "./schemas";

let redisConnection: Redis | null = null;

export function parseRedisUrl(url: string): RedisConfig {
   const parsed = new URL(url);
   return {
      db: parsed.pathname ? Number.parseInt(parsed.pathname.slice(1), 10) : 0,
      host: parsed.hostname,
      password: parsed.password || undefined,
      port: Number.parseInt(parsed.port, 10) || 6379,
   };
}

export function createRedisConnection(config: RedisConfig): Redis {
   if (redisConnection) {
      return redisConnection;
   }

   redisConnection = new Redis({
      db: config.db,
      enableReadyCheck: false,
      host: config.host,
      maxRetriesPerRequest: null,
      password: config.password,
      port: config.port,
      retryStrategy: (times) => {
         if (times > 10) {
            return null;
         }
         return Math.min(times * 100, 3000);
      },
   });

   redisConnection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
   });

   redisConnection.on("connect", () => {
      console.log("[Redis] Connected successfully");
   });

   return redisConnection;
}

export function createConnectionFromUrl(url: string): Redis {
   const config = parseRedisUrl(url);
   return createRedisConnection(config);
}

export function getConnectionOptions(url: string): ConnectionOptions {
   const config = parseRedisUrl(url);
   return {
      db: config.db,
      host: config.host,
      maxRetriesPerRequest: null,
      password: config.password,
      port: config.port,
   };
}

export async function closeRedisConnection(): Promise<void> {
   if (redisConnection) {
      await redisConnection.quit();
      redisConnection = null;
      console.log("[Redis] Connection closed");
   }
}

export function getRedisConnection(): Redis | null {
   return redisConnection;
}
