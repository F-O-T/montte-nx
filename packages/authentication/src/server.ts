import type { DatabaseInstance } from "@packages/database/client";
import {
   createDefaultOrganization,
   findMemberByUserId,
} from "@packages/database/repositories/auth-repository";
import { getDomain, isProduction } from "@packages/environment/helpers";
import { serverEnv } from "@packages/environment/server";
import {
   type ResendClient,
   type SendEmailOTPOptions,
   sendEmailOTP,
   sendOrganizationInvitation,
} from "@packages/transactional/client";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import {
   admin,
   apiKey,
   emailOTP,
   openAPI,
   organization,
} from "better-auth/plugins";
export interface AuthOptions {
   db: DatabaseInstance;
   resendClient: ResendClient;
}

export const ORGANIZATION_LIMIT = 3;

export const getAuthOptions = (
   db: DatabaseInstance,
   resendClient: ResendClient,
) =>
   ({
      advanced: {
         crossSubDomainCookies: {
            domain: ".montte.co",
            enabled: isProduction,
         },

         database: { generateId: "uuid" },
      },
      database: drizzleAdapter(db, {
         provider: "pg",
      }),
      user: {
         additionalFields: {
            telemetryConsent: {
               defaultValue: true,
               input: true,
               required: false,
               type: "boolean",
            },
         },
      },
      databaseHooks: {
         session: {
            create: {
               before: async (session) => {
                  try {
                     const member = await findMemberByUserId(
                        db,
                        session.userId,
                     );

                     if (member?.organizationId) {
                        console.log(
                           `Setting activeOrganizationId for user ${session.userId} to ${member.organizationId}`,
                        );
                        return {
                           data: {
                              ...session,
                              activeOrganizationId: member.organizationId,
                           },
                        };
                     }
                  } catch (error) {
                     console.error(
                        "Error in session create before hook:",
                        error,
                     );
                     return {
                        data: {
                           ...session,
                        },
                     };
                  }
               },
            },
         },
         user: {
            create: {
               after: async (user) => {
                  try {
                     await createDefaultOrganization(db, user.id, user.name);
                  } catch (error) {
                     console.error(
                        "Error creating default organization for user:",
                        error,
                     );
                  }
               },
            },
         },
      },
      emailAndPassword: {
         enabled: true,
         requireEmailVerification: true,
      },
      emailVerification: {
         autoSignInAfterVerification: true,
         sendOnSignUp: true,
      },
      experimental: {
         joins: true,
      },
      plugins: [
         admin(),
         emailOTP({
            expiresIn: 60 * 10,
            otpLength: 6,
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({
               email,
               otp,
               type,
            }: SendEmailOTPOptions) {
               await sendEmailOTP(resendClient, { email, otp, type });
            },
         }),
         openAPI(),
         organization({
            organizationLimit: ORGANIZATION_LIMIT,
            schema: {
               organization: {
                  additionalFields: {
                     description: {
                        defaultValue: "",
                        input: true,
                        required: false,
                        type: "string",
                     },
                  },
               },
               team: {
                  additionalFields: {
                     description: {
                        defaultValue: "",
                        input: true,
                        required: false,
                        type: "string",
                     },
                  },
               },
            },
            async sendInvitationEmail(data) {
               const inviteLink = `${getDomain()}/callback/organization/invitation/${data.id}`;
               await sendOrganizationInvitation(resendClient, {
                  email: data.email,
                  invitedByEmail: data.inviter.user.email,
                  invitedByUsername: data.inviter.user.name,
                  inviteLink,
                  teamName: data.organization.name,
               });
            },
            teams: {
               allowRemovingAllTeams: false,
               enabled: true,
               maximumMembersPerTeam: 50,
               maximumTeams: 10,
            },
         }),
         apiKey({
            apiKeyHeaders: "sdk-api-key",
            enableMetadata: true,
            enableSessionForAPIKeys: true,
            rateLimit: {
               enabled: true,
               maxRequests: 500, // 500 requests per hour
               timeWindow: 1000 * 60 * 60, // 1 hour
            },
         }),
      ],

      secret: serverEnv.BETTER_AUTH_SECRET,
      session: {
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
         },
      },
      socialProviders: {
         google: {
            clientId: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
            clientSecret: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
            prompt: "select_account" as const,
         },
      },
      trustedOrigins: serverEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
   }) satisfies BetterAuthOptions;

export const createAuth = (options: AuthOptions) => {
   const authOptions = getAuthOptions(options.db, options.resendClient);
   return betterAuth(authOptions);
};
export type AuthInstance = ReturnType<typeof createAuth>;
