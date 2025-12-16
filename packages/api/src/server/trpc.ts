import {
   arcjetInstance,
   BOT_DETECTION,
   TRPC_RATE_LIMITS,
} from "@packages/arcjet/config";
import type { AuthInstance } from "@packages/authentication/server";
import { createCacheClient, TTL } from "@packages/cache/client";
import { getRedisConnection } from "@packages/cache/connection";
import type { DatabaseInstance } from "@packages/database/client";
import { getOrganizationMembership } from "@packages/database/repositories/auth-repository";
import type { MinioClient } from "@packages/files/client";
import { changeLanguage, type SupportedLng } from "@packages/localization";
import { captureError, identifyUser, setGroup } from "@packages/posthog/server";
import type { StripeClient } from "@packages/stripe";
import type { ResendClient } from "@packages/transactional/client";
import { APIError } from "@packages/utils/errors";
import { sanitizeData } from "@packages/utils/sanitization";
import { initTRPC } from "@trpc/server";
import type { PostHog } from "posthog-node";
import SuperJSON from "superjson";

// Initialize cache client lazily
let cache: ReturnType<typeof createCacheClient> | null = null;

function getCache() {
   if (!cache) {
      const redis = getRedisConnection();
      if (!redis) {
         throw new Error(
            "[Cache] Redis connection not initialized. Ensure createRedisConnection() is called before using cache.",
         );
      }
      cache = createCacheClient(redis);
   }
   return cache;
}

export const createTRPCContext = async ({
   auth,
   db,
   request,
   minioClient,
   minioBucket,
   posthog,
   resendClient,
   responseHeaders,
   stripeClient,
}: {
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   minioBucket: string;
   posthog: PostHog;
   request: Request;
   resendClient?: ResendClient;
   responseHeaders: Headers;
   stripeClient?: StripeClient;
}) => {
   const headers = request.headers;

   let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
   try {
      session = await auth.api.getSession({ headers });
   } catch (error: unknown) {
      console.error(
         "[tRPC Context] getSession() failed, continuing without session",
         error,
      );
   }

   const language = headers.get("x-locale") as SupportedLng;

   if (language) {
      changeLanguage(language);
   }

   const organizationId = session?.session?.activeOrganizationId || "";

   return {
      auth,
      db,
      headers,
      language,
      minioBucket,
      minioClient,
      organizationId,
      posthog,
      request,
      resendClient,
      responseHeaders,
      session,
      stripeClient,
   };
};

export const t = initTRPC
   .context<ReturnType<typeof createTRPCContext>>()
   .create({
      transformer: SuperJSON,
   });

export const router = t.router;

const arcjetPublicMiddleware = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!arcjetInstance) {
      return next();
   }

   const aj = arcjetInstance
      .withRule(TRPC_RATE_LIMITS.PUBLIC)
      .withRule(BOT_DETECTION);

   const decision = await aj
      .protect(resolvedCtx.request, { requested: 1 })
      .catch((error: unknown) => {
         console.error(
            "[Arcjet tRPC Public] protect() failed, allowing request (fail-open)",
            error,
         );
         return null;
      });

   if (!decision) {
      return next();
   }

   console.log(
      `[Arcjet tRPC Public] ${decision.conclusion} - ${decision.reason.type}`,
   );

   if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
         throw APIError.tooManyRequests(
            "Too many requests. Please try again later.",
         );
      }

      if (decision.reason.isBot()) {
         throw APIError.forbidden("Automated requests are not permitted.");
      }

      if (decision.reason.isShield()) {
         throw APIError.forbidden("Request blocked for security reasons.");
      }

      throw APIError.forbidden("Access denied.");
   }

   return next();
});

const arcjetProtectedMiddleware = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!arcjetInstance) {
      return next();
   }

   const aj = arcjetInstance
      .withRule(TRPC_RATE_LIMITS.PROTECTED)
      .withRule(BOT_DETECTION);

   const decision = await aj
      .protect(resolvedCtx.request, { requested: 1 })
      .catch((error: unknown) => {
         console.error(
            "[Arcjet tRPC Protected] protect() failed, allowing request (fail-open)",
            error,
         );
         return null;
      });

   if (!decision) {
      return next();
   }

   console.log(
      `[Arcjet tRPC Protected] ${decision.conclusion} - ${decision.reason.type}`,
   );

   if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
         throw APIError.tooManyRequests(
            "Too many requests. Please try again later.",
         );
      }

      if (decision.reason.isBot()) {
         throw APIError.forbidden("Automated requests are not permitted.");
      }

      if (decision.reason.isShield()) {
         throw APIError.forbidden("Request blocked for security reasons.");
      }

      throw APIError.forbidden("Access denied.");
   }

   return next();
});

const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
   console.log(`Request: ${type} ${path}`);
   const start = Date.now();
   const result = await next();
   const durationMs = Date.now() - start;
   console.log(`Response: ${type} ${path} - ${durationMs}ms`);
   return result;
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!resolvedCtx.session?.user) {
      throw APIError.forbidden("Access denied.");
   }

   const userId = resolvedCtx.session.user.id;
   const organizationSlug = resolvedCtx.headers.get("x-organization-slug");
   let organizationId = resolvedCtx.session.session.activeOrganizationId;

   if (organizationSlug) {
      const { organization, membership } = await getOrganizationMembership(
         resolvedCtx.db,
         userId,
         organizationSlug,
      );

      if (!organization) {
         throw APIError.notFound("Organization not found.");
      }

      if (!membership) {
         throw APIError.forbidden(
            "You do not have access to this organization.",
         );
      }

      organizationId = organization.id;
   }

   return next({
      ctx: {
         organizationId,
         session: { ...resolvedCtx.session },
      },
   });
});

const timingMiddleware = t.middleware(async ({ next, path }) => {
   const start = Date.now();
   const result = await next();
   const end = Date.now();

   console.info(`[TRPC] ${path} took ${end - start}ms to execute`);

   return result;
});

const telemetryMiddleware = t.middleware(
   async ({ ctx, path, type, meta, getRawInput, next }) => {
      const startDate = new Date();
      const resolvedCtx = await ctx;
      const posthog = resolvedCtx.posthog;
      const userId = resolvedCtx.session?.user?.id;
      const userEmail = resolvedCtx.session?.user?.email;
      const userName = resolvedCtx.session?.user?.name;
      const hasConsent = resolvedCtx.session?.user?.telemetryConsent;
      const organizationId = resolvedCtx.organizationId;

      if (userId && hasConsent) {
         identifyUser(posthog, userId, {
            email: userEmail,
            name: userName,
         });

         if (organizationId) {
            setGroup(posthog, organizationId, {});
         }
      }

      const result = await next();

      try {
         if (type === "mutation" && userId && hasConsent) {
            const rootPath = path.split(".")[0];
            const rawInput = await getRawInput();

            if (!result.ok) {
               const errorId = crypto.randomUUID();

               resolvedCtx.responseHeaders.set("x-error-id", errorId);

               captureError(posthog, {
                  code: result.error.code,
                  errorId,
                  input: sanitizeData(rawInput),
                  message: result.error.message,
                  organizationId: organizationId || undefined,
                  path,
                  userId,
               });
            }

            posthog.capture({
               distinctId: userId,
               event: "trpc_mutation",
               properties: {
                  durationMs: Date.now() - startDate.getTime(),
                  endAt: new Date().toISOString(),
                  input: sanitizeData(rawInput),
                  meta: meta || {},
                  path,
                  rootPath,
                  startAt: startDate.toISOString(),
                  success: result.ok,
                  ...(organizationId
                     ? { $groups: { organization: organizationId } }
                     : {}),
                  ...(result.ok
                     ? {}
                     : {
                          errorCode: result.error.code,
                          errorMessage: result.error.message,
                          errorName: result.error.name,
                       }),
               },
            });
         }
      } catch (err) {
         console.error(`Error on telemetry capture ${path}`, err);
      }

      return result;
   },
);

const baseProcedure = t.procedure.use(loggerMiddleware).use(timingMiddleware);

export const publicProcedure = baseProcedure.use(arcjetPublicMiddleware);

export const protectedProcedure = baseProcedure
   .use(arcjetProtectedMiddleware)
   .use(isAuthed)
   .use(telemetryMiddleware);

// Helper to wrap a query function with lazy caching
export function withCache<T>(
   cacheKey: string,
   fetcher: () => Promise<T>,
   ttl: number = TTL.LONG,
): () => Promise<T> {
   return async (): Promise<T> => {
      const cacheClient = getCache();

      // Check cache first
      const cached = await cacheClient.getJSON<T>(cacheKey);
      if (cached !== null) {
         console.log(`[Cache] Hit for key: ${cacheKey}`);
         return cached;
      }

      // Fetch fresh data
      const result = await fetcher();

      // Store in cache (fire and forget)
      cacheClient.setJSON(cacheKey, result, ttl).catch((error) => {
         console.error(`[Cache] Failed to cache key ${cacheKey}:`, error);
      });
      console.log(`[Cache] Stored key: ${cacheKey} with TTL: ${ttl}s`);

      return result;
   };
}

export { TTL };
