import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        scope: '/',
        name: 'Montte - Gestão Financeira',
        short_name: 'Montte',
        description: 'Gestão financeira completa para você e seus negócios. Simples, transparente e Open Source.',
        display: 'standalone',
        start_url: '/',
        background_color: '#050816',
        theme_color: '#050816',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        shortcuts: [
          { name: 'Nova transação', url: '/app/transactions/new' },
          { name: 'Dashboard', url: '/app' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/assets'),
            handler: 'CacheFirst',
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://api.montte.co',
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
    }),

    react(),
  ],
  server: {
    port: 3000,
  }
});
