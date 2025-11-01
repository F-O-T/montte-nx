import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig, passthroughImageService } from "astro/config";

// https://astro.build/config
export default defineConfig({
   image: {
      service: passthroughImageService(),
   },

   integrations: [
      starlight({
         customCss: ["./src/styles/global.css"],
         description: "Documentation for ContentaGen app",
         logo: {
            src: "./src/assets/contentagen-logo.svg",
         },
         sidebar: [
            {
               items: [
                  { label: "Overview", link: "/sdk/" },
                  { label: "Setup", link: "/sdk/setup" },
                  { label: "API Reference", link: "/sdk/api" },
                  { label: "Error Handling", link: "/sdk/error-handling" },
                  {
                     items: [
                        { label: "AstroJS", link: "/sdk/integrations/astrojs" },
                     ],
                     label: "Integrations",
                  },
               ],
               label: "SDK",
            },
         ],
         title: "ContentaGen",
      }),
      mdx(),
   ],
   output: "static",

   site: "https://docs.contentagen.com",
   vite: {
      plugins: [tailwindcss()],
      ssr: {
         noExternal: ["zod"],
      },
   },
});
