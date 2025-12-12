import type { ArcjetDecision } from "@arcjet/bun";
import type { AuthInstance } from "@packages/authentication/server";
import {
   arcjetInstance,
   BOT_DETECTION,
   EMAIL_VALIDATION,
   getAuthEndpointRateLimit,
   isSignupEndpoint,
} from "./config";

async function extractEmailFromRequest(
   request: Request,
): Promise<{ email: string | undefined; clonedRequest: Request }> {
   const clonedRequest = request.clone();
   try {
      const body = await clonedRequest.json();
      return { email: body?.email, clonedRequest: request };
   } catch {
      return { email: undefined, clonedRequest: request };
   }
}

export async function wrapAuthHandler(
   authInstance: AuthInstance,
): Promise<(request: Request) => Promise<Response>> {
   return async (request: Request): Promise<Response> => {
      if (!arcjetInstance) {
         return authInstance.handler(request);
      }

      const url = new URL(request.url);
      const pathname = url.pathname;

      const rateLimitRule = getAuthEndpointRateLimit(pathname);
      const isSignup = isSignupEndpoint(pathname);

      try {
         let decision: ArcjetDecision;

         if (isSignup && request.method === "POST") {
            const { email } = await extractEmailFromRequest(request);

            const aj = arcjetInstance
               .withRule(rateLimitRule)
               .withRule(BOT_DETECTION)
               .withRule(EMAIL_VALIDATION);

            decision = await aj.protect(request, {
               requested: 1,
               email: email || "",
            });
         } else {
            const aj = arcjetInstance
               .withRule(rateLimitRule)
               .withRule(BOT_DETECTION);

            decision = await aj.protect(request, { requested: 1 });
         }

         console.log(
            `[Arcjet Auth] ${pathname} - ${decision.conclusion} - ${decision.reason.type}`,
         );

         if (decision.isDenied()) {
            const reason = decision.reason;

            if (reason.isRateLimit()) {
               return new Response(
                  JSON.stringify({
                     error: "Too many requests. Please try again later.",
                     retryAfter: reason.resetTime
                        ? Math.ceil(
                             (reason.resetTime.getTime() - Date.now()) / 1000,
                          )
                        : 60,
                  }),
                  {
                     status: 429,
                     headers: {
                        "Content-Type": "application/json",
                        "Retry-After": reason.resetTime
                           ? Math.ceil(
                                (reason.resetTime.getTime() - Date.now()) /
                                   1000,
                             ).toString()
                           : "60",
                     },
                  },
               );
            }

            if (reason.isBot()) {
               return new Response(
                  JSON.stringify({
                     error: "Automated requests are not permitted.",
                  }),
                  {
                     status: 403,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            if (reason.isEmail()) {
               return new Response(
                  JSON.stringify({
                     error: "Invalid email address.",
                     details: {
                        emailTypes: reason.emailTypes,
                     },
                  }),
                  {
                     status: 400,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            if (reason.isShield()) {
               return new Response(
                  JSON.stringify({
                     error: "Request blocked for security reasons.",
                  }),
                  {
                     status: 403,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            return new Response(
               JSON.stringify({
                  error: "Access denied.",
               }),
               {
                  status: 403,
                  headers: {
                     "Content-Type": "application/json",
                  },
               },
            );
         }

         return authInstance.handler(request);
      } catch (error) {
         console.error("[Arcjet Auth] Error during protection:", error);
         return authInstance.handler(request);
      }
   };
}
