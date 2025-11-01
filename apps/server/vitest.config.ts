import { defineConfig } from "vitest/config";

export default defineConfig({
   test: {
      environment: "node",
      exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
      globals: true,
      include: ["**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
   },
});
