//TODO: Use this on the errors to track the errors
import { PostHog } from "posthog-node";
import { posthogHost, posthogPublicKey } from "./shared-posthog-config";

export function getElysiaPosthogConfig() {
   const internalPosthog = new PostHog(posthogPublicKey, {
      host: posthogHost,
   });
   return internalPosthog;
}
