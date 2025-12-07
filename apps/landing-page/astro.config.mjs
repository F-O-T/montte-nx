import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
   env: {
      schema: {
         POSTHOG_HOST: envField.string({
            access: "public",
            context: "client",
            optional: true,
         }),
         POSTHOG_KEY: envField.string({
            access: "public",
            context: "client",
            optional: true,
         }),
      },
   },
   i18n: {
      defaultLocale: "pt",
      locales: ["pt"],
      routing: {
         prefixDefaultLocale: false,
      },
   },
   integrations: [react(), sitemap()],
   output: "static",
   site: "https://www.montte.co",
   vite: {
      plugins: [tailwindcss()],
      ssr: {
         noExternal: ["@packages/localization"],
      },
   },
});
