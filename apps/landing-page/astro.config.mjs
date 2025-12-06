import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
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
