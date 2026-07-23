import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Vitest owns unit/integration specs only. The `tests/visual/`
    // tree uses `@playwright/test` (run via `npm run test:visual`)
    // and would crash vitest with "test.describe was not expected
    // here" if it tried to load them. The agent worktree mirror
    // under `.claude/` re-shadows the suite and is excluded too.
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "tests/visual/**",
      "tests/**/*.spec.ts",
      ".claude/**",
      "registry/**",
      "playwright-report/**",
      "test-results/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", ".next/**", "design/**", "types/**", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
