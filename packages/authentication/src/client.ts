import {
   adminClient,
   apiKeyClient,
   emailOTPClient,
   organizationClient,
} from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export interface AuthClientError {
   status: number;
   statusText: string;
   message?: string;
}

export interface AuthClientOptions {
   apiBaseUrl: string;
   onSuccess?: () => void;
   onError?: (error: AuthClientError) => void;
}

export const createAuthClient = ({
   apiBaseUrl,
   onSuccess,
   onError,
}: AuthClientOptions) =>
   createBetterAuthClient({
      baseURL: apiBaseUrl,
      fetchOptions: {
         onError: (context) => {
            onError?.({
               message: context.error?.message,
               status: context.response.status,
               statusText: context.response.statusText,
            });
         },
         onSuccess: () => {
            onSuccess?.();
         },
      },
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
