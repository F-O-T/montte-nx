import {
   adminClient,
   apiKeyClient,
   emailOTPClient,
   organizationClient,
} from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export interface AuthClientOptions {
   apiBaseUrl: string;
}

export const createAuthClient = ({ apiBaseUrl }: AuthClientOptions) =>
   createBetterAuthClient({
      baseURL: apiBaseUrl,
      plugins: [
         stripeClient({
            subscription: true, //if you want to enable subscription management
         }),
         emailOTPClient(),
         apiKeyClient(),
         adminClient(),
         organizationClient({
            teams: {
               enabled: true,
            },
         }),
      ],
   });
