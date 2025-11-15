import cors from "@elysiajs/cors";
import { createApi } from "@packages/api/server";
import { serverEnv as env } from "@packages/environment/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { auth, polarClient, OpenAPI } from "./integrations/auth";
import { db } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { posthogPlugin } from "./integrations/posthog";
import { openapi } from "@elysiajs/openapi";

const trpcApi = createApi({
   auth,
   db,
   minioBucket: env.MINIO_BUCKET,
   minioClient,
   polarClient,
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
      polarClient,
   }))
   .use(
      cors({
         allowedHeaders: [
            "Content-Type",
            "Authorization",
            "sdk-api-key",
            "Accept-Language",
            "X-Locale",
         ],
         credentials: true,
         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origin: (request: Request) => {
            const url = new URL(request.url);

            // Allow all origins for SDK endpoints
            if (url.pathname.startsWith("/sdk")) {
               return true;
            }

            // Use trusted origins for other endpoints
            const origin = request.headers.get("origin");
            const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
            return trustedOrigins.includes(origin || "");
         },
      }),
   )
   .use(posthogPlugin)
   .use(
      openapi({
         path: "/docs",
         documentation: {
            components: await OpenAPI.components,
            paths: await OpenAPI.getPaths(),
         },
      }),
   )
   .mount(auth.handler)
   .all(
      "/trpc/*",
      async (opts) => {
         const res = await fetchRequestHandler({
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  headers: opts.request.headers,
               }),
            endpoint: "/trpc",
            req: opts.request,
            router: trpcApi.trpcRouter,
         });

         return res;
      },
      {
         parse: "none",
      },
   )
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;
