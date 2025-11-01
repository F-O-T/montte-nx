import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
   integrations: [mdx(), sitemap(), react()],

   output: "static",
   site: "https://blog.contentagen.com",

   vite: {
      plugins: [tailwindcss()],
   },
});
