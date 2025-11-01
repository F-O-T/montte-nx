import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
   i18n: {
      defaultLocale: "en",
      locales: ["en", "pt"],
      routing: {
         prefixDefaultLocale: false,
      },
   },
   integrations: [react(), sitemap()],
   output: "static",
   site: "https://www.contentagen.com",
   vite: {
      plugins: [tailwindcss()],
      ssr: {
         noExternal: ["@packages/localization"],
      },
   },
});
