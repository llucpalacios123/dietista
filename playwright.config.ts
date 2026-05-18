import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests.
 *
 * Note: Browser installation requires a supported OS. On unsupported systems,
 * the tests are defined and ready but require a compatible environment to execute.
 *
 * Usage:
 *   npx playwright test          — run all E2E tests
 *   npx playwright test --ui     — run in UI mode
 *   npx playwright show-report   — view test report
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // E2E tests share state (DB), run sequentially
  forbidOnly: !!process.env.CI,
  retries: 3,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  globalSetup: require.resolve("./e2e/global-setup"),
  globalTeardown: require.resolve("./e2e/global-teardown"),
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        executablePath: "/usr/bin/chromium-browser",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
});
