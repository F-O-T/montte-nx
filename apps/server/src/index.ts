import cors from "@elysiajs/cors";
import { createApi } from "@packages/api/server";
import { serverEnv as env } from "@packages/environment/server";
import { createConnectionFromUrl } from "@packages/queue";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { auth } from "./integrations/auth";
import { db } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { posthog, posthogPlugin } from "./integrations/posthog";
import {
   handleAsaasWebhook,
   handleCustomWebhook,
   handleStripeWebhook,
   type WebhookRequest,
} from "./integrations/webhooks";

createConnectionFromUrl(env.REDIS_URL);

const trpcApi = createApi({
   auth,
   db,
   minioBucket: env.MINIO_BUCKET,
   minioClient,
   posthog,
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
   .mount(auth.handler)
   .all(
      "/trpc/*",
      async (opts) => {
         const responseHeaders = new Headers();

         const res = await fetchRequestHandler({
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  headers: opts.request.headers,
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
   .post("/webhooks/stripe", async ({ request }) => {
      const rawBody = await request.text();
      const headers: Record<string, string | undefined> = {};
      request.headers.forEach((value, key) => {
         headers[key] = value;
      });

      const webhookRequest: WebhookRequest = {
         body: JSON.parse(rawBody),
         headers,
         rawBody,
      };

      const result = await handleStripeWebhook(webhookRequest, db);
      return result;
   })
   .post("/webhooks/asaas", async ({ request }) => {
      const rawBody = await request.text();
      const headers: Record<string, string | undefined> = {};
      request.headers.forEach((value, key) => {
         headers[key] = value;
      });

      const webhookRequest: WebhookRequest = {
         body: JSON.parse(rawBody),
         headers,
         rawBody,
      };

      const result = await handleAsaasWebhook(webhookRequest, db);
      return result;
   })
   .post("/webhooks/:organizationId", async ({ request, params, query }) => {
      const rawBody = await request.text();
      const headers: Record<string, string | undefined> = {};
      request.headers.forEach((value, key) => {
         headers[key] = value;
      });

      let parsedBody: unknown;
      try {
         parsedBody = JSON.parse(rawBody);
      } catch {
         parsedBody = { raw: rawBody };
      }

      const webhookRequest: WebhookRequest = {
         body: parsedBody,
         headers,
         rawBody,
      };

      const eventType =
         (query as Record<string, string>).event || "custom.event";
      const result = await handleCustomWebhook(
         params.organizationId,
         eventType,
         webhookRequest,
         db,
      );
      return result;
   })
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;
