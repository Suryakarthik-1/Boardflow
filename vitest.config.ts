import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Restrict to unit tests under the packages; Playwright specs live in
    // `e2e/` and are run separately by `npm run test:e2e`.
    include: ["packages/*/src/**/*.test.ts"],
  },
});
