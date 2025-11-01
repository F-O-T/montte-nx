import { getElysiaPosthogConfig } from "@packages/posthog/server";
import { Elysia } from "elysia";

const posthog = getElysiaPosthogConfig();
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
