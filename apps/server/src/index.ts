import cors from "@elysiajs/cors";
import { createApi } from "@packages/api/server";
import { serverEnv as env } from "@packages/environment/server";
import { createRedisConnection } from "@packages/queue/connection";
import { initializeWorkflowQueue } from "@packages/workflows/queue/producer";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { auth, stripeClient } from "./integrations/auth";
import { db } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { posthog, posthogPlugin } from "./integrations/posthog";

const redisConnection = createRedisConnection(env.REDIS_URL);
initializeWorkflowQueue(redisConnection);

const trpcApi = createApi({
   auth,
   db,
   minioBucket: env.MINIO_BUCKET,
   minioClient,
   posthog,
   stripeClient,
});
const app = new Elysia({
   serve: {
      idleTimeout: 0,
   },
})
   .derive(() => ({
      auth,
      db,
      minioBucket: env.MINIO_BUCKET,
      minioClient,
   }))
   .use(
      cors({
         allowedHeaders: [
            "Content-Type",
            "Authorization",
            "sdk-api-key",
            "Accept-Language",
            "X-Locale",
            "X-Organization-Slug",
            "user-agent",
         ],
         credentials: true,
         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origin: (request: Request) => {
            const url = new URL(request.url);

            if (url.pathname.startsWith("/sdk")) {
               return true;
            }

            const origin = request.headers.get("origin");
            const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
            return trustedOrigins.includes(origin || "");
         },
      }),
   )
   .use(posthogPlugin)
   .mount(auth.handler)
   .all(
      "/trpc/*",
      async (opts) => {
         const responseHeaders = new Headers();

         const res = await fetchRequestHandler({
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  request: opts.request,
                  responseHeaders,
               }),
            endpoint: "/trpc",
            req: opts.request,
            router: trpcApi.trpcRouter,
         });

         responseHeaders.forEach((value, key) => {
            res.headers.append(key, value);
         });

         return res;
      },
      {
         parse: "none",
      },
   )
   .listen(process.env.PORT ?? 9876);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
export type App = typeof app;
