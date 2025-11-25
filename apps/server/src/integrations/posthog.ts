import { getElysiaPosthogConfig } from "@packages/posthog/server";
import { Elysia } from "elysia";

export const posthog = getElysiaPosthogConfig();
export const posthogPlugin = new Elysia({
   name: "posthog-plugin",
})
   .derive(() => ({
      posthog,
   }))
   .onStop(async () => {
      await posthog.shutdown();
      console.info("PostHog client shut down.");
   });
