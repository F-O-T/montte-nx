import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import { getOrganizationMembership } from "@packages/database/repositories/auth-repository";
import type { MinioClient } from "@packages/files/client";
import { changeLanguage, type SupportedLng } from "@packages/localization";
import { APIError } from "@packages/utils/errors";
import { sanitizeData } from "@packages/utils/sanitization";
import { initTRPC } from "@trpc/server";
import type { PostHog } from "posthog-node";
import SuperJSON from "superjson";

export const createTRPCContext = async ({
   auth,
   db,
   headers,
   minioClient,
   minioBucket,
   posthog,
   responseHeaders,
}: {
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   minioBucket: string;
   posthog: PostHog;
   headers: Headers;
   responseHeaders: Headers;
}): Promise<{
   minioBucket: string;
   db: DatabaseInstance;
   minioClient: MinioClient;
   auth: AuthInstance;
   headers: Headers;
   posthog: PostHog;
   session: AuthInstance["$Infer"]["Session"] | null;
   language: SupportedLng;
   responseHeaders: Headers;
   organizationId: string;
}> => {
   const session = await auth.api.getSession({
      headers,
   });

   const language = headers.get("x-locale") as SupportedLng;

   if (language) {
      changeLanguage(language);
   }
   const organizationId = session?.session.activeOrganizationId || "";
   return {
      auth,
      db,
      headers,
      language,
      minioBucket,
      minioClient,
      organizationId,
      posthog,
      responseHeaders,
      session,
   };
};

export const t = initTRPC
   .context<ReturnType<typeof createTRPCContext>>()
   .create({
      transformer: SuperJSON,
   });

export const router = t.router;

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
   const apikey = resolvedCtx.headers.get("sdk-api-key");

   if (apikey) {
      throw APIError.forbidden(
         "This endpoint does not accept API Key authentication.",
      );
   }
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

const sdkAuth = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   // 1. Get the Authorization header from the incoming request.
   const authHeader = resolvedCtx.headers.get("sdk-api-key");
   if (!authHeader) {
      throw APIError.unauthorized("Missing API Key.");
   }

   const apiKeyData = await resolvedCtx.auth.api.verifyApiKey({
      body: { key: authHeader },
      headers: resolvedCtx.headers,
   });

   if (!apiKeyData.valid) {
      throw APIError.unauthorized("Invalid API Key.");
   }
   const session = await resolvedCtx.auth.api.getSession({
      headers: new Headers({
         "sdk-api-key": authHeader,
      }),
   });
   return next({
      ctx: {
         session: {
            ...session,
         },
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
      const result = await next();

      try {
         if (type === "mutation") {
            const resolvedCtx = await ctx;
            const posthog = resolvedCtx.posthog;
            const userId = resolvedCtx.session?.user?.id;
            const hasConsent = resolvedCtx.session?.user?.telemetryConsent;

            if (userId && hasConsent) {
               const rootPath = path.split(".")[0];
               const rawInput = await getRawInput();

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
         }
      } catch (err) {
         console.error(`Error on telemetry capture ${path}`, err);
      }

      return result;
   },
);

export const publicProcedure = t.procedure
   .use(loggerMiddleware)
   .use(timingMiddleware);

export const protectedProcedure = publicProcedure
   .use(isAuthed)
   .use(telemetryMiddleware);
export const sdkProcedure = publicProcedure.use(sdkAuth);
