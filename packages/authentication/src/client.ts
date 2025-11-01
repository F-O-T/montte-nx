import { polarClient } from "@polar-sh/better-auth";
import {
   adminClient,
   apiKeyClient,
   emailOTPClient,
   organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export interface AuthClientOptions {
   apiBaseUrl: string;
}

export const createAuthClient = ({ apiBaseUrl }: AuthClientOptions) =>
   createBetterAuthClient({
      baseURL: apiBaseUrl,
      plugins: [
         emailOTPClient(),
         apiKeyClient(),
         polarClient(),
         adminClient(),
         organizationClient({
            teams: {
               enabled: true,
            },
         }),
      ],
   });
