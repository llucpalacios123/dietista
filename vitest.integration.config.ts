import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup-integration.ts"],
    include: ["test/integration/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    fileParallelism: false,
    testTimeout: 120000, // 2 minutes for container startup
    hookTimeout: 120000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
