import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    VitePWA({ registerType: 'autoUpdate' }),
    
    react(),
  ],
  server: {
    port: 3000,
  }
});
