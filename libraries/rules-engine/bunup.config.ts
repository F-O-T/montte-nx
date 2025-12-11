import { defineConfig } from "bunup";

export default defineConfig({
   dts: {
      inferTypes: true,
   },
   entry: ["src/index.ts"],
   format: ["esm", "cjs"],
});
