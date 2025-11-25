import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import {
   findMemberByUserId,
   isOrganizationOwner,
} from "@packages/database/repositories/auth-repository";
import type { MinioClient } from "@packages/files/client";
import { changeLanguage, type SupportedLng } from "@packages/localization";
import { initTRPC, TRPCError } from "@trpc/server";
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
}> => {
   const session = await auth.api.getSession({
      headers,
   });

   const language = headers.get("x-locale") as SupportedLng;

   if (language) {
      changeLanguage(language);
   }

   return {
      auth,
      db,
      headers,
      language,
      minioBucket,
      minioClient,
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
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "This endpoint does not accept API Key authentication.",
      });
   }
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }
   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

const sdkAuth = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   // 1. Get the Authorization header from the incoming request.
   const authHeader = resolvedCtx.headers.get("sdk-api-key");
   if (!authHeader) {
      throw new TRPCError({
         code: "UNAUTHORIZED",
         message: "Missing API Key.",
      });
   }

   const apiKeyData = await resolvedCtx.auth.api.verifyApiKey({
      body: { key: authHeader },
      headers: resolvedCtx.headers,
   });

   if (!apiKeyData.valid) {
      throw new TRPCError({
         code: "UNAUTHORIZED",
         message: "Invalid API Key.",
      });
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

function sanitizeData<T>(data: T): T {
   if (!data || typeof data !== "object") {
      return data;
   }

   const SENSITIVE_KEYS = [
      "password",
      "confirmpassword",
      "token",
      "accesstoken",
      "refreshtoken",
      "apiKey",
      "apikey",
      "secret",
      "api_key",
      "auth",
      "authorization",
      "ssn",
      "email",
      "phone",
   ].map((s) => s.toLowerCase());

   const SENSITIVE_SUBSTRINGS = [
      "password",
      "secret",
      "token",
      "api_key",
      "api",
      "auth",
      "authorization",
      "ssn",
      "email",
      "phone",
   ];

   const MASK = "********";

   function maskString(value: string): string {
      return MASK;
   }

   function isLikelyEmail(value: string): boolean {
      // Simple email heuristic
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
   }

   function isLikelyPhone(value: string): boolean {
      // Phone-like if contains only phone chars and at least 7 digits
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && /^[\d\s()+\-\.]+$/.test(value);
   }

   function isLikelySecret(value: string): boolean {
      // Long tokens (base64/hex/etc) -- conservative: length >= 20 and mostly URL-safe/base64/hex
      if (value.length < 20) return false;
      return /^[A-Za-z0-9_\-+/=]+$/.test(value);
   }

   function shouldMaskKey(key: string): boolean {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.includes(lower)) return true;
      return SENSITIVE_SUBSTRINGS.some((sub) => lower.includes(sub));
   }

   function cloneAndSanitize(value: unknown): unknown {
      if (value === null || value === undefined) return value;

      if (Array.isArray(value)) {
         return value.map(cloneAndSanitize);
      }

      if (typeof value === "object") {
         const obj = value as Record<string, unknown>;
         const out: Record<string, unknown> = {};
         for (const [k, v] of Object.entries(obj)) {
            try {
               if (shouldMaskKey(k)) {
                  out[k] = MASK;
               } else {
                  out[k] = cloneAndSanitize(v);
               }
            } catch (e) {
               // In case of unexpected values, fallback to masking that field
               out[k] = MASK;
            }
         }
         return out;
      }

      if (typeof value === "string") {
         if (
            isLikelyEmail(value) ||
            isLikelyPhone(value) ||
            isLikelySecret(value)
         ) {
            return maskString(value);
         }
         return value;
      }

      // primitives (number, boolean, symbol, bigint, function)
      return value;
   }

   // Work on a shallow clone of the top-level to avoid mutating input
   if (Array.isArray(data)) {
      return cloneAndSanitize(data) as unknown as T;
   }

   const topObj = { ...(data as Record<string, unknown>) };

   const sanitized = cloneAndSanitize(topObj) as T;

   return sanitized;
}

const telemetryMiddleware = t.middleware(
   async ({ ctx, path, type, meta, getRawInput, next }) => {
      const startDate = new Date();
      const result = await next();

      try {
         if (type === "mutation") {
            const resolvedCtx = await ctx;
            const posthog = resolvedCtx.posthog;
            const userId = resolvedCtx.session?.user?.id;

            if (userId) {
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

const hasOrganizationAccess = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   // First ensure user is authenticated
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   // Check if user is part of an organization
   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (memberWithOrg) {
      // Find the organization owner
      const ownerMember = await resolvedCtx.db.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.organizationId, memberWithOrg.organizationId),
               eq(member.role, "owner"),
            ),
      });

      if (!ownerMember) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Organization has no owner",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   }

   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

const hasOrganizationOwnerAccess = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (!memberWithOrg) {
      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   }

   // Check if user is the owner of the organization
   const isOwner = await isOrganizationOwner(
      resolvedCtx.db,
      userId,
      memberWithOrg.organizationId,
   );

   if (!isOwner) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "User is not the owner of the organization",
      });
   }

   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

export const hasGenerationCredits = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (!memberWithOrg) {
      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   }

   const ownerMember = await resolvedCtx.db.query.member.findFirst({
      where: (member, { eq, and }) =>
         and(
            eq(member.organizationId, memberWithOrg.organizationId),
            eq(member.role, "owner"),
         ),
   });

   if (!ownerMember) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "Organization has no owner",
      });
   }

   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

export const publicProcedure = t.procedure
   .use(loggerMiddleware)
   .use(timingMiddleware);

export const protectedProcedure = publicProcedure
   .use(isAuthed)
   .use(telemetryMiddleware);
export const sdkProcedure = publicProcedure.use(sdkAuth);

// Organization-specific procedures
export const organizationProcedure = protectedProcedure.use(
   hasOrganizationAccess,
);
export const organizationOwnerProcedure = protectedProcedure.use(
   hasOrganizationOwnerAccess,
);

// Generation credits procedure
export const generationProcedure = protectedProcedure.use(hasGenerationCredits);
