import { describe, expect, it } from "bun:test";
import { getElysiaPosthogConfig } from "../src/server";

describe("posthog server", () => {
   describe("getElysiaPosthogConfig", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should create a PostHog client instance", () => {
         const client = getElysiaPosthogConfig(mockEnv);

         expect(client).toBeDefined();
         expect(typeof client.capture).toBe("function");
         expect(typeof client.identify).toBe("function");
         expect(typeof client.shutdown).toBe("function");
      });

      it("should accept different host configurations", () => {
         const euEnv = {
            POSTHOG_HOST: "https://eu.i.posthog.com",
            POSTHOG_KEY: "phc_eu_key_456",
         };

         const client = getElysiaPosthogConfig(euEnv);

         expect(client).toBeDefined();
         expect(typeof client.capture).toBe("function");
      });

      it("should accept custom self-hosted configurations", () => {
         const selfHostedEnv = {
            POSTHOG_HOST: "https://posthog.mycompany.com",
            POSTHOG_KEY: "phc_self_hosted_key",
         };

         const client = getElysiaPosthogConfig(selfHostedEnv);

         expect(client).toBeDefined();
         expect(typeof client.capture).toBe("function");
      });
   });
});
