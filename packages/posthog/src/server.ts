import type { ServerEnv } from "@packages/environment/server";
import { PostHog } from "posthog-node";

export function getElysiaPosthogConfig(
   env: Pick<ServerEnv, "POSTHOG_HOST" | "POSTHOG_KEY">,
) {
   const internalPosthog = new PostHog(env.POSTHOG_KEY, {
      host: env.POSTHOG_HOST,
   });
   return internalPosthog;
}
