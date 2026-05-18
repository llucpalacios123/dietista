import { test as base, type Page } from "@playwright/test";
import { generateEmail, generatePassword } from "./helpers/test-data";
import { registerUser, loginUser } from "./helpers/api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TestUser {
  email: string;
  password: string;
}

interface TestFixtures {
  /**
   * A unique test user (email + password) not yet registered.
   * Regenerated per test — no cross-test contamination.
   */
  testUser: TestUser;

  /**
   * A Playwright Page whose browser context is already authenticated.
   * The user is registered via API and session cookies are injected,
   * so the page starts logged in without any UI interaction.
   */
  authenticatedPage: Page;
}

// ─── Fixtures ───────────────────────────────────────────────────────────────

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: generateEmail("fixture"),
      password: generatePassword(),
    };
    await use(user);
    // No per-test cleanup needed — globalTeardown cleans all e2e-* users
  },

  authenticatedPage: async ({ page, request, testUser }, use) => {
    // 1. Register via API
    await registerUser(request, testUser.email, testUser.password);

    // 2. Login via API to get session cookies
    const cookies = await loginUser(
      request,
      testUser.email,
      testUser.password
    );

    // 3. Inject session cookies into the browser context
    await page.context().addCookies(cookies);

    // 4. Verify the page is actually authenticated
    await page.goto("/dashboard");
    // If redirected to /login the cookies didn't take — fail fast
    await page.waitForURL("**/dashboard", { timeout: 5000 });

    await use(page);
  },
});

// Re-export expect so tests only ever import from this file
export { expect } from "@playwright/test";
